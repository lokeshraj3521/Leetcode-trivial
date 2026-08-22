from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.db.session import get_db
from app.models.models import User
from app.services.leetcode import leetcode_service
from app.services.points import points_service
from app.services.messaging import messaging_service
from app.services.ai_insights import ai_insights_service

router = APIRouter()


@router.post("/user/{user_id}")
async def sync_user_now(user_id: str, db: AsyncSession = Depends(get_db)):
    """Triggers an instant manual sync from LeetCode APIs for a user."""
    stmt = select(User).where(User.id == user_id)
    res = await db.execute(stmt)
    user = res.scalar_one_or_none()

    if not user:
        raise HTTPException(status_code=404, detail="User not found.")

    raw_subs = await leetcode_service.fetch_recent_ac_submissions(user.leetcode_username, limit=20)
    new_subs, total_pts = await points_service.process_new_submissions(db, user.id, raw_subs)
    
    # Always update lifetime UserStats & streaks from LeetCode profile
    stats = await points_service.update_user_stats(db, user.id)
    user.last_synced_at = datetime.utcnow()

    # Force regenerate AI insights
    await ai_insights_service.generate_insight(db, user.id, "weak_topics")
    await ai_insights_service.generate_insight(db, user.id, "weekly_recap")

    notifications_sent = 0
    if new_subs:
        for sub in new_subs:
            logs = await messaging_service.dispatch_submission_notifications(db, user.id, sub, sub.points_awarded)
            notifications_sent += len(logs)

    await db.commit()

    return {
        "status": "success",
        "leetcode_username": user.leetcode_username,
        "total_solved": (stats.easy_count + stats.medium_count + stats.hard_count),
        "easy_count": stats.easy_count,
        "medium_count": stats.medium_count,
        "hard_count": stats.hard_count,
        "total_points": stats.total_points,
        "new_submissions_count": len(new_subs),
        "notifications_sent": notifications_sent,
        "synced_at": user.last_synced_at,
    }
