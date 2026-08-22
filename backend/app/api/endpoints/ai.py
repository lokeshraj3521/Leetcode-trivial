from typing import Any
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.db.session import get_db
from app.models.models import User
from app.services.ai_insights import ai_insights_service

router = APIRouter()


@router.get("/insights/{user_id}")
async def get_ai_insights(
    user_id: str,
    insight_type: str = Query("weak_topics", enum=["weak_topics", "weekly_recap", "next_problem"]),
    db: AsyncSession = Depends(get_db),
):
    """Retrieves AI insights (cached or generated) for a user."""
    stmt = select(User).where(User.id == user_id)
    res = await db.execute(stmt)
    if not res.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="User not found.")

    content = await ai_insights_service.get_or_generate_insights(db, user_id, insight_type)
    return {"user_id": user_id, "insight_type": insight_type, "content": content}


@router.post("/insights/{user_id}/refresh")
async def refresh_ai_insights(
    user_id: str,
    insight_type: str = Query("weak_topics", enum=["weak_topics", "weekly_recap", "next_problem"]),
    db: AsyncSession = Depends(get_db),
):
    """Forces instant regeneration of AI insight content."""
    stmt = select(User).where(User.id == user_id)
    res = await db.execute(stmt)
    if not res.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="User not found.")

    content = await ai_insights_service.generate_insight(db, user_id, insight_type)
    return {"user_id": user_id, "insight_type": insight_type, "content": content, "refreshed": True}
