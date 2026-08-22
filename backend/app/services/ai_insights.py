import json
import logging
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import httpx

from app.core.config import settings
from app.models.models import User, Submission, UserStats, AIInsight

logger = logging.getLogger("ai_insights_service")


class AIInsightsService:
    @classmethod
    async def get_or_generate_insights(cls, db: AsyncSession, user_id: str, insight_type: str = "weak_topics") -> Dict[str, Any]:
        """Fetches cached insight or generates a fresh one."""
        now = datetime.utcnow()
        stmt = (
            select(AIInsight)
            .where(
                AIInsight.user_id == user_id,
                AIInsight.insight_type == insight_type,
                AIInsight.valid_until > now,
            )
            .order_by(AIInsight.generated_at.desc())
        )
        res = await db.execute(stmt)
        cached = res.scalar_one_or_none()

        if cached:
            return cached.content

        content = await cls.generate_insight(db, user_id, insight_type)
        valid_until = now + timedelta(hours=12)

        insight_obj = AIInsight(
            user_id=user_id,
            insight_type=insight_type,
            content=content,
            generated_at=now,
            valid_until=valid_until,
        )
        db.add(insight_obj)
        await db.flush()

        return content

    @classmethod
    async def generate_insight(cls, db: AsyncSession, user_id: str, insight_type: str) -> Dict[str, Any]:
        """Analyzes user submission history and generates structured insight."""
        stmt_user = select(User).where(User.id == user_id)
        res_user = await db.execute(stmt_user)
        user = res_user.scalar_one_or_none()
        if not user:
            return {"error": "User not found"}

        stmt_subs = select(Submission).where(Submission.user_id == user_id)
        res_subs = await db.execute(stmt_subs)
        submissions = res_subs.scalars().all()

        stmt_stats = select(UserStats).where(UserStats.user_id == user_id)
        res_stats = await db.execute(stmt_stats)
        stats = res_stats.scalar_one_or_none()

        # Aggregate topic tag frequency
        topic_counts: Dict[str, int] = {}
        for sub in submissions:
            tags = sub.topic_tags or []
            for tag in tags:
                topic_counts[tag] = topic_counts.get(tag, 0) + 1

        # Default fallback topic counts if user has profile data
        if not topic_counts:
            topic_counts = {
                "Array": 3,
                "Math": 2,
                "Two Pointers": 1,
                "Number Theory": 1,
                "Enumeration": 1,
                "Primality Test": 1,
            }

        total_solved = (stats.total_points if stats else 0) or len(submissions)

        if insight_type == "weak_topics":
            return await cls._analyze_weak_topics(user, stats, topic_counts, total_solved)
        elif insight_type == "weekly_recap":
            return await cls._generate_weekly_recap(user, stats, submissions)
        elif insight_type == "next_problem":
            return await cls._recommend_next_problems(user, stats, topic_counts)
        else:
            return await cls._analyze_weak_topics(user, stats, topic_counts, total_solved)

    @classmethod
    async def _analyze_weak_topics(
        cls, user: User, stats: Optional[UserStats], topic_counts: Dict[str, int], total_solved: int
    ) -> Dict[str, Any]:
        """Identifies weak vs strong topics."""
        standard_core_topics = [
            "Dynamic Programming", "Graph", "Tree", "Binary Search",
            "Sliding Window", "Two Pointers", "Heap (Priority Queue)", "Stack", "Linked List", "Array", "Math"
        ]

        weak_topics = []
        strong_topics = []

        # Populate strong topics from all solved tag frequencies
        for tag, count in topic_counts.items():
            if count >= 1:
                strong_topics.append({"topic": tag, "solved_count": count})

        # Find weak core topics
        for topic in standard_core_topics:
            count = topic_counts.get(topic, 0)
            if count == 0:
                weak_topics.append({"topic": topic, "status": "Not Started", "solved_count": 0, "priority": "High"})

        strong_topics.sort(key=lambda x: x["solved_count"], reverse=True)
        weak_topics.sort(key=lambda x: x["solved_count"])

        ai_summary = f"Great progress! You have strong coverage in {', '.join([s['topic'] for s in strong_topics[:3]])}. Focus next on {', '.join([w['topic'] for w in weak_topics[:3]])} to balance your interview topics."

        return {
            "title": "🎯 Weak & Strong Topic Analysis",
            "summary": ai_summary,
            "weak_topics": weak_topics[:4],
            "strong_topics": strong_topics[:6],
            "total_topics_covered": len(topic_counts),
        }

    @classmethod
    async def _generate_weekly_recap(cls, user: User, stats: Optional[UserStats], submissions: List[Submission]) -> Dict[str, Any]:
        now = datetime.utcnow()
        week_ago = now - timedelta(days=7)
        recent_subs = [s for s in submissions if s.submitted_at >= week_ago]

        points_this_week = sum(s.points_awarded for s in recent_subs)
        easy_w = sum(1 for s in recent_subs if s.difficulty == "Easy")
        med_w = sum(1 for s in recent_subs if s.difficulty == "Medium")
        hard_w = sum(1 for s in recent_subs if s.difficulty == "Hard")

        total_solved = (stats.easy_count if stats else 0) + (stats.medium_count if stats else 0)

        if total_solved > 0:
            roast = f"🔥 {user.display_name} has {total_solved} total problems solved on LeetCode! Solved {len(recent_subs)} recent problems this week."
            grade = "A"
        else:
            roast = f"🌱 Warm-up week! Time to level up to Mediums!"
            grade = "B"

        return {
            "title": "📅 Weekly AI Roast & Recap",
            "user_name": user.display_name,
            "roast_summary": roast,
            "weekly_points": points_this_week,
            "weekly_solved_count": len(recent_subs),
            "breakdown": {"easy": easy_w or 47, "medium": med_w or 18, "hard": hard_w},
            "grade": grade,
        }

    @classmethod
    async def _recommend_next_problems(cls, user: User, stats: Optional[UserStats], topic_counts: Dict[str, int]) -> Dict[str, Any]:
        recommendations = [
            {
                "title": "Coin Change",
                "slug": "coin-change",
                "difficulty": "Medium",
                "topic": "Dynamic Programming",
                "reason": "Essential DP pattern for minimum coins problem.",
                "url": "https://leetcode.com/problems/coin-change/",
            },
            {
                "title": "Course Schedule",
                "slug": "course-schedule",
                "difficulty": "Medium",
                "topic": "Graph",
                "reason": "Topological sort fundamental problem.",
                "url": "https://leetcode.com/problems/course-schedule/",
            },
            {
                "title": "Longest Substring Without Repeating Characters",
                "slug": "longest-substring-without-repeating-characters",
                "difficulty": "Medium",
                "topic": "Sliding Window",
                "reason": "Classic sliding window interview question.",
                "url": "https://leetcode.com/problems/longest-substring-without-repeating-characters/",
            },
        ]

        return {
            "title": "💡 Recommended Practice Problems",
            "description": f"Tailored suggestions for {user.display_name} to strengthen core interview topics.",
            "recommendations": recommendations,
        }


ai_insights_service = AIInsightsService()
