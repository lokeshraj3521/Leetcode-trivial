import logging
from datetime import datetime
from typing import List, Optional
import httpx
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.config import settings
from app.models.models import User, GroupMember, DeviceToken, NotificationLog, Submission, UserStats

logger = logging.getLogger("messaging_service")


class MessagingService:
    @classmethod
    async def dispatch_submission_notifications(
        cls,
        db: AsyncSession,
        solver_id: str,
        submission: Submission,
        new_points: int,
    ) -> List[NotificationLog]:
        """
        Dispatches notifications to all group members when a user solves a problem.
        1. Formats title/body notification content.
        2. Logs notifications in `NotificationLog` table for live in-app feed.
        3. Sends FCM Web Push to registered device tokens if FCM is configured.
        """
        # Fetch solver details
        stmt_solver = select(User).where(User.id == solver_id)
        res_solver = await db.execute(stmt_solver)
        solver = res_solver.scalar_one_or_none()
        if not solver:
            return []

        # Find all groups solver belongs to
        stmt_groups = select(GroupMember.group_id).where(GroupMember.user_id == solver_id)
        res_groups = await db.execute(stmt_groups)
        group_ids = res_groups.scalars().all()

        if not group_ids:
            return []

        # Find all group peers (excluding solver)
        stmt_peers = (
            select(GroupMember.user_id)
            .where(GroupMember.group_id.in_(group_ids), GroupMember.user_id != solver_id)
            .distinct()
        )
        res_peers = await db.execute(stmt_peers)
        peer_ids = res_peers.scalars().all()

        if not peer_ids:
            return []

        # Format Notification Payload
        difficulty_emoji = {"Easy": "🟢", "Medium": "🟡", "Hard": "🔴"}.get(submission.difficulty, "⚡")
        pts_text = f"+{new_points} pts" if new_points > 0 else "Already solved"
        
        title = f"🔥 {solver.display_name} solved a problem!"
        body = f"{difficulty_emoji} {submission.problem_title} ({submission.difficulty}) | {pts_text}"

        logs: List[NotificationLog] = []

        for peer_id in peer_ids:
            log_entry = NotificationLog(
                triggered_by_user_id=solver_id,
                submission_id=submission.id,
                sent_to_user_id=peer_id,
                title=title,
                body=body,
                sent_at=datetime.utcnow(),
                status="sent",
            )
            db.add(log_entry)
            logs.append(log_entry)

            # Send FCM Push if token exists
            await cls._send_fcm_push(db, peer_id, title, body)

        await db.flush()
        return logs

    @classmethod
    async def _send_fcm_push(cls, db: AsyncSession, recipient_user_id: str, title: str, body: str) -> bool:
        """
        Sends Web Push via FCM to user's registered tokens.
        """
        if not settings.FCM_SERVER_KEY:
            logger.debug(f"FCM_SERVER_KEY not configured. Notification logged locally for user {recipient_user_id}.")
            return False

        stmt = select(DeviceToken).where(DeviceToken.user_id == recipient_user_id)
        res = await db.execute(stmt)
        tokens = res.scalars().all()

        if not tokens:
            return False

        headers = {
            "Authorization": f"key={settings.FCM_SERVER_KEY}",
            "Content-Type": "application/json",
        }

        success = True
        async with httpx.AsyncClient() as client:
            for dt in tokens:
                payload = {
                    "to": dt.fcm_token,
                    "notification": {"title": title, "body": body, "icon": "/icon.png"},
                    "data": {"click_action": "/dashboard"},
                }
                try:
                    resp = await client.post("https://fcm.googleapis.com/fcm/send", json=payload, headers=headers, timeout=5.0)
                    if resp.status_code != 200:
                        logger.warning(f"FCM Push failed for token {dt.fcm_token}: status {resp.status_code}")
                        success = False
                except Exception as e:
                    logger.warning(f"FCM Push exception: {e}")
                    success = False

        return success


messaging_service = MessagingService()
