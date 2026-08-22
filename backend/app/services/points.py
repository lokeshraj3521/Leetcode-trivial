from datetime import datetime, date, timedelta
from typing import List, Tuple
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.core.config import settings
from app.models.models import User, Submission, UserStats


class PointsService:
    @staticmethod
    def calculate_difficulty_points(difficulty: str) -> int:
        diff = difficulty.capitalize()
        if diff == "Easy":
            return settings.POINTS_EASY
        elif diff == "Medium":
            return settings.POINTS_MEDIUM
        elif diff == "Hard":
            return settings.POINTS_HARD
        return 1

    @classmethod
    async def process_new_submissions(
        self, db: AsyncSession, user_id: str, raw_submissions: List[dict]
    ) -> Tuple[List[Submission], int]:
        """
        Deduplicates submissions by `leetcode_submission_id`, calculates points (first AC rule),
        persists new submissions, and updates `UserStats` and streaks.
        Returns (list of newly added Submissions, total new points awarded).
        """
        new_submissions: List[Submission] = []
        new_points_total = 0

        # Fetch existing leetcode_submission_ids for user to deduplicate
        stmt = select(Submission.leetcode_submission_id).where(Submission.user_id == user_id)
        res = await db.execute(stmt)
        existing_sub_ids = set(res.scalars().all())

        # Fetch set of problem_slugs user has already solved previously
        stmt_solved = select(Submission.problem_slug).where(Submission.user_id == user_id)
        res_solved = await db.execute(stmt_solved)
        already_solved_slugs = set(res_solved.scalars().all())

        # Sort raw submissions chronologically (oldest first) so points & streaks compute in order
        raw_submissions_sorted = sorted(raw_submissions, key=lambda s: s["submitted_at"])

        for sub_data in raw_submissions_sorted:
            sub_id = sub_data["leetcode_submission_id"]
            if sub_id in existing_sub_ids:
                continue

            slug = sub_data["problem_slug"]
            difficulty = sub_data["difficulty"]

            # First AC per problem awarded only (avoid resubmission farming)
            if slug in already_solved_slugs:
                pts = 0
            else:
                pts = self.calculate_difficulty_points(difficulty)
                already_solved_slugs.add(slug)

            sub_obj = Submission(
                user_id=user_id,
                leetcode_submission_id=sub_id,
                problem_slug=slug,
                problem_title=sub_data["problem_title"],
                difficulty=difficulty,
                language=sub_data["language"],
                topic_tags=sub_data.get("topic_tags", []),
                points_awarded=pts,
                submitted_at=sub_data["submitted_at"],
            )

            db.add(sub_obj)
            existing_sub_ids.add(sub_id)
            new_submissions.append(sub_obj)
            new_points_total += pts

        if new_submissions:
            await db.flush()
            await self.update_user_stats(db, user_id)

        return new_submissions, new_points_total

    @classmethod
    async def update_user_stats(cls, db: AsyncSession, user_id: str) -> UserStats:
        """
        Recalculates total points, counts, and daily streak for a user.
        """
        # Fetch all user submissions
        stmt = select(Submission).where(Submission.user_id == user_id).order_by(Submission.submitted_at.asc())
        res = await db.execute(stmt)
        submissions = res.scalars().all()

        total_pts = sum(s.points_awarded for s in submissions)

        # Count unique solved problems per difficulty
        solved_difficulties = {}
        for s in submissions:
            if s.problem_slug not in solved_difficulties:
                solved_difficulties[s.problem_slug] = s.difficulty.capitalize()

        easy_cnt = sum(1 for d in solved_difficulties.values() if d == "Easy")
        med_cnt = sum(1 for d in solved_difficulties.values() if d == "Medium")
        hard_cnt = sum(1 for d in solved_difficulties.values() if d == "Hard")

        # Calculate streak logic based on unique solve dates
        solve_dates = sorted(list({s.submitted_at.date() for s in submissions}))

        current_streak = 0
        longest_streak = 0
        last_solved_date = None

        if solve_dates:
            last_solved_date = solve_dates[-1]
            today = date.today()

            # Current streak is active if last solve was today or yesterday
            if last_solved_date >= today - timedelta(days=1):
                streak = 1
                for i in range(len(solve_dates) - 1, 0, -1):
                    if solve_dates[i] - solve_dates[i - 1] == timedelta(days=1):
                        streak += 1
                    else:
                        break
                current_streak = streak
            else:
                current_streak = 0

            # Compute longest streak
            temp_streak = 1
            max_s = 1
            for i in range(1, len(solve_dates)):
                if solve_dates[i] - solve_dates[i - 1] == timedelta(days=1):
                    temp_streak += 1
                else:
                    temp_streak = 1
                if temp_streak > max_s:
                    max_s = temp_streak
            longest_streak = max_s

        # Update or create UserStats
        stmt_stats = select(UserStats).where(UserStats.user_id == user_id)
        res_stats = await db.execute(stmt_stats)
        stats = res_stats.scalar_one_or_none()

        if not stats:
            stats = UserStats(user_id=user_id)
            db.add(stats)

        stats.total_points = total_pts
        stats.easy_count = easy_cnt
        stats.medium_count = med_cnt
        stats.hard_count = hard_cnt
        stats.current_streak = current_streak
        stats.longest_streak = max(longest_streak, current_streak)
        stats.last_solved_date = last_solved_date
        stats.updated_at = datetime.utcnow()

        await db.flush()
        return stats


points_service = PointsService()
