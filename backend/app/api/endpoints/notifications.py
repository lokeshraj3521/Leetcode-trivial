from typing import List
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.db.session import get_db
from app.models.models import DeviceToken, NotificationLog, User
from app.schemas.schemas import DeviceTokenRegister, NotificationLogResponse

router = APIRouter()


@router.post("/register-token", status_code=status.HTTP_201_CREATED)
async def register_device_token(dt_in: DeviceTokenRegister, db: AsyncSession = Depends(get_db)):
    """Registers an FCM Web Push device token for a user."""
    stmt_user = select(User).where(User.id == dt_in.user_id)
    res_user = await db.execute(stmt_user)
    if not res_user.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="User not found.")

    # Check if token already registered
    stmt_token = select(DeviceToken).where(
        DeviceToken.user_id == dt_in.user_id,
        DeviceToken.fcm_token == dt_in.fcm_token,
    )
    res_token = await db.execute(stmt_token)
    token_obj = res_token.scalar_one_or_none()

    if not token_obj:
        token_obj = DeviceToken(
            user_id=dt_in.user_id,
            fcm_token=dt_in.fcm_token,
            platform=dt_in.platform,
            created_at=datetime.utcnow(),
        )
        db.add(token_obj)
        await db.commit()

    return {"message": "FCM device token registered successfully."}


@router.get("/user/{user_id}", response_model=List[NotificationLogResponse])
async def get_user_notifications(user_id: str, limit: int = 30, db: AsyncSession = Depends(get_db)):
    """Fetches activity notification log for a user's notification drawer feed."""
    stmt = (
        select(NotificationLog)
        .where(NotificationLog.sent_to_user_id == user_id)
        .order_by(NotificationLog.sent_at.desc())
        .limit(limit)
    )
    res = await db.execute(stmt)
    logs = res.scalars().all()

    result = []
    for log in logs:
        # Resolve trigger user display name
        stmt_trig = select(User.display_name).where(User.id == log.triggered_by_user_id)
        res_trig = await db.execute(stmt_trig)
        trig_name = res_trig.scalar_one_or_none() or "Friend"

        result.append(
            NotificationLogResponse(
                id=log.id,
                triggered_by_user_id=log.triggered_by_user_id,
                triggered_by_name=trig_name,
                sent_to_user_id=log.sent_to_user_id,
                title=log.title,
                body=log.body,
                sent_at=log.sent_at,
                status=log.status,
            )
        )
    return result
