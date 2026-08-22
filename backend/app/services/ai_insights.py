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
        """
        Fetches existing valid AI insight from cache (`ai_insights` table), or generates a new one if expired.
        """
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

        # Generate new insight
        content = await cls.generate_insight(db, user_id, insight_type)
        valid_until = now + timedelta(hours=12)  # Cache for 12 hours

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
        """
        Analyzes user's submission history and generates structured insight.
        """
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

        # Aggregate topic breakdown
        topic_counts: Dict[str, int] = {}
        for sub in submissions:
            tags = sub.topic_tags or []
            for tag in tags:
                topic_counts[tag] = topic_counts.get(tag, 0) + 1

        if insight_type == "weak_topics":
            return await cls._analyze_weak_topics(user, stats, topic_counts, len(submissions))
        elif insight_type == "weekly_recap":
            return await cls._generate_weekly_recap(user, stats, submissions)
        elif insight_type == "next_problem":
            return await cls._recommend_next_problems(user, stats, topic_counts)
        else:
            return await cls._analyze_weak_topics(user, stats, topic_counts, len(submissions))

    @classmethod
    async def _analyze_weak_topics(
        cls, user: User, stats: Optional[UserStats], topic_counts: Dict[str, int], total_solved: int
    ) -> Dict[str, Any]:
        """Identifies weak topics based on tag frequencies and interview priority."""
        standard_core_topics = [
            "Dynamic Programming", "Graph", "Tree", "Binary Search",
            "Sliding Window", "Two Pointers", "Heap (Priority Queue)", "Stack", "Linked List", "Greedy"
        ]

        # Calculate coverage ratio
        weak_topics = []
        strong_topics = []

        for topic in standard_core_topics:
            count = topic_counts.get(topic, 0)
            if count == 0:
                weak_topics.append({"topic": topic, "status": "Not Started", "solved_count": 0, "priority": "High"})
            elif count < 3:
                weak_topics.append({"topic": topic, "status": "Needs Practice", "solved_count": count, "priority": "Medium"})
            else:
                strong_topics.append({"topic": topic, "solved_count": count})

        weak_topics.sort(key=lambda x: (x["solved_count"], 0 if x["priority"] == "High" else 1))

        # LLM enhancement if key available
        ai_summary = f"Focus on building core proficiency in {', '.join([w['topic'] for w in weak_topics[:3]])} to balance your LeetCode problem portfolio."
        if settings.OPENAI_API_KEY or settings.GEMINI_API_KEY:
            llm_text = await cls._query_llm(
                f"Analyze LeetCode stats for user '{user.display_name}': Solved {total_solved} problems. "
                f"Strong topics: {[s['topic'] for s in strong_topics[:3]]}. Weak topics: {[w['topic'] for w in weak_topics[:3]]}. "
                "Provide a brief 2-sentence tactical recommendation."
            )
            if llm_text:
                ai_summary = llm_text

        return {
            "title": "🎯 Weak Topic Analysis",
            "summary": ai_summary,
            "weak_topics": weak_topics[:4],
            "strong_topics": strong_topics[:4],
            "total_topics_covered": len(topic_counts),
        }

    @classmethod
    async def _generate_weekly_recap(cls, user: User, stats: Optional[UserStats], submissions: List[Submission]) -> Dict[str, Any]:
        """Generates a witty weekly recap / roast."""
        now = datetime.utcnow()
        week_ago = now - timedelta(days=7)
        recent_subs = [s for s in submissions if s.submitted_at >= week_ago]

        points_this_week = sum(s.points_awarded for s in recent_subs)
        easy_w = sum(1 for s in recent_subs if s.difficulty == "Easy")
        med_w = sum(1 for s in recent_subs if s.difficulty == "Medium")
        hard_w = sum(1 for s in recent_subs if s.difficulty == "Hard")

        if len(recent_subs) == 0:
            roast = f"🔥 {user.display_name} ghosted LeetCode this week. Zero submissions detected!"
            grade = "F"
        elif hard_w > 0:
            roast = f"💪 Impressive hustle! {user.display_name} crushed {len(recent_subs)} problems including {hard_w} Hard problem(s)!"
            grade = "A+"
        elif med_w >= 3:
            roast = f"🚀 Steady progress! {user.display_name} tackled {med_w} Mediums this week. Keep pushing!"
            grade = "B+"
        else:
            roast = f"🌱 Warm-up week! {user.display_name} solved {easy_w} Easy problems. Time to level up to Mediums!"
            grade = "C"

        return {
            "title": "📅 Weekly AI Roast & Recap",
            "user_name": user.display_name,
            "roast_summary": roast,
            "weekly_points": points_this_week,
            "weekly_solved_count": len(recent_subs),
            "breakdown": {"easy": easy_w, "medium": med_w, "hard": hard_w},
            "grade": grade,
        }

    @classmethod
    async def _recommend_next_problems(cls, user: User, stats: Optional[UserStats], topic_counts: Dict[str, int]) -> Dict[str, Any]:
        """Recommends specific problems based on user's weak topics."""
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

    @classmethod
    async def _query_llm(cls, prompt: str) -> Optional[str]:
        """Queries OpenAI or Gemini API if key is set."""
        if settings.OPENAI_API_KEY:
            try:
                headers = {
                    "Authorization": f"Bearer {settings.OPENAI_API_KEY}",
                    "Content-Type": "application/json",
                }
                body = {
                    "model": "gpt-3.5-turbo",
                    "messages": [{"role": "user", "content": prompt}],
                    "max_tokens": 120,
                }
                async with httpx.AsyncClient(timeout=6.0) as client:
                    resp = await client.post("https://api.openai.com/v1/chat/completions", json=body, headers=headers)
                    if resp.status_code == 200:
                        return resp.json()["choices"][0]["message"]["content"].strip()
            except Exception:
                pass
        return None


ai_insights_service = AIInsightsService()
