import asyncio
import logging
from sqlalchemy import select
from app.db.session import init_db, AsyncSessionLocal
from app.models.models import User, UserStats
from app.services.leetcode import leetcode_service
from app.services.points import points_service
from app.services.ai_insights import ai_insights_service

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("force_sync")


async def force_sync_all():
    await init_db()
    async with AsyncSessionLocal() as db:
        res = await db.execute(select(User))
        users = res.scalars().all()

        logger.info(f"Found {len(users)} users in database.")

        for user in users:
            logger.info(f"Syncing profile for username '{user.leetcode_username}'...")
            
            # Fetch real submissions and profile stats
            raw_subs = await leetcode_service.fetch_recent_ac_submissions(user.leetcode_username, limit=20)
            if raw_subs:
                await points_service.process_new_submissions(db, user.id, raw_subs)

            stats = await points_service.update_user_stats(db, user.id)
            
            # Force regenerate AI insights for user
            await ai_insights_service.generate_insight(db, user.id, "weak_topics")
            await ai_insights_service.generate_insight(db, user.id, "weekly_recap")

            await db.commit()

            logger.info(
                f"User '{user.leetcode_username}' updated -> Easy: {stats.easy_count}, Med: {stats.medium_count}, Hard: {stats.hard_count}, Total Points: {stats.total_points}"
            )


if __name__ == "__main__":
    asyncio.run(force_sync_all())
