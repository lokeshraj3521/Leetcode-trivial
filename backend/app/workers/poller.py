import asyncio
import logging
from datetime import datetime
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from sqlalchemy import select

from app.core.config import settings
from app.db.session import AsyncSessionLocal
from app.models.models import User
from app.services.leetcode import leetcode_service
from app.services.points import points_service
from app.services.messaging import messaging_service

logger = logging.getLogger("poller_worker")

scheduler = AsyncIOScheduler()


async def poll_active_users_job():
    """
    Background worker job:
    1. Fetches all active users.
    2. Polls LeetCode GraphQL for new AC submissions.
    3. Processes points & deduplication.
    4. Dispatches push notifications & logs in-app activity.
    """
    logger.info("Starting background LeetCode poll cycle...")

    async with AsyncSessionLocal() as db:
        try:
            stmt = select(User).where(User.is_active == True)
            res = await db.execute(stmt)
            users = res.scalars().all()

            if not users:
                logger.info("No active users to poll.")
                return

            for user in users:
                try:
                    logger.info(f"Polling LeetCode for user '{user.leetcode_username}'...")
                    raw_subs = await leetcode_service.fetch_recent_ac_submissions(user.leetcode_username, limit=15)

                    if raw_subs:
                        new_subs, total_pts = await points_service.process_new_submissions(db, user.id, raw_subs)
                        user.last_synced_at = datetime.utcnow()
                        await db.commit()

                        if new_subs:
                            logger.info(f"User '{user.leetcode_username}': {len(new_subs)} new AC submission(s) added! (+{total_pts} pts)")
                            for sub in new_subs:
                                await messaging_service.dispatch_submission_notifications(db, user.id, sub, sub.points_awarded)
                            await db.commit()

                except Exception as e:
                    logger.error(f"Error polling user '{user.leetcode_username}': {e}")
                    await db.rollback()

        except Exception as e:
            logger.error(f"Error in poll_active_users_job: {e}")


def start_poller():
    """Starts the APScheduler background polling job."""
    if not scheduler.running:
        scheduler.add_job(
            poll_active_users_job,
            "interval",
            minutes=settings.POLL_INTERVAL_MINUTES,
            id="leetcode_poller_job",
            replace_existing=True,
        )
        scheduler.start()
        logger.info(f"APScheduler started: Polling every {settings.POLL_INTERVAL_MINUTES} minutes.")


def stop_poller():
    """Stops the scheduler on app shutdown."""
    if scheduler.running:
        scheduler.shutdown(wait=False)
        logger.info("APScheduler stopped.")
