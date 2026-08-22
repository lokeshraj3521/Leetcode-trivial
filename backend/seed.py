import asyncio
import logging
from datetime import datetime
from sqlalchemy import select

from app.db.session import init_db, AsyncSessionLocal
from app.models.models import User, Group, GroupMember, UserStats
from app.services.leetcode import leetcode_service
from app.services.points import points_service
from app.services.messaging import messaging_service

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("seed")


async def seed_data():
    logger.info("Initializing database...")
    await init_db()

    async with AsyncSessionLocal() as db:
        demo_users = [
            {"leetcode_username": "raj_coder", "display_name": "Raj Kumar", "email": "raj@example.com"},
            {"leetcode_username": "alex_dev", "display_name": "Alex Chen", "email": "alex@example.com"},
            {"leetcode_username": "priya_algo", "display_name": "Priya Sharma", "email": "priya@example.com"},
        ]

        created_users = []

        for u_data in demo_users:
            stmt = select(User).where(User.leetcode_username == u_data["leetcode_username"])
            res = await db.execute(stmt)
            existing = res.scalar_one_or_none()

            if not existing:
                user = User(
                    leetcode_username=u_data["leetcode_username"],
                    display_name=u_data["display_name"],
                    email=u_data["email"],
                )
                db.add(user)
                await db.flush()

                stats = UserStats(user_id=user.id)
                db.add(stats)
                created_users.append(user)
            else:
                created_users.append(existing)

        # Create demo Group
        stmt_grp = select(Group).where(Group.name == "Samsung Health Squad")
        res_grp = await db.execute(stmt_grp)
        group = res_grp.scalar_one_or_none()

        if not group and created_users:
            group = Group(
                name="Samsung Health Squad",
                invite_code="CODE2026",
                created_by=created_users[0].id,
            )
            db.add(group)
            await db.flush()

            for user in created_users:
                member = GroupMember(group_id=group.id, user_id=user.id)
                db.add(member)

        await db.commit()

        # Perform initial sync & points calculation for demo users
        logger.info("Performing initial LeetCode sync for demo users...")
        for user in created_users:
            raw_subs = await leetcode_service.fetch_recent_ac_submissions(user.leetcode_username, limit=10)
            if raw_subs:
                new_subs, pts = await points_service.process_new_submissions(db, user.id, raw_subs)
                user.last_synced_at = datetime.utcnow()
                logger.info(f"Seeded '{user.display_name}': {len(new_subs)} submissions (+{pts} pts)")

                for sub in new_subs:
                    await messaging_service.dispatch_submission_notifications(db, user.id, sub, sub.points_awarded)

        await db.commit()
        logger.info("Database seeding & initial sync complete!")


if __name__ == "__main__":
    asyncio.run(seed_data())
