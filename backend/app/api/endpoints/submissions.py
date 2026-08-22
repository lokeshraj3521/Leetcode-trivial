from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.db.session import get_db
from app.models.models import Submission, GroupMember
from app.schemas.schemas import SubmissionResponse

router = APIRouter()


@router.get("/", response_model=List[SubmissionResponse])
async def list_submissions(
    user_id: Optional[str] = Query(None, description="Filter by user ID"),
    group_id: Optional[str] = Query(None, description="Filter by group ID"),
    limit: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    """Lists recent solved submissions sorted chronologically (newest first)."""
    stmt = select(Submission)

    if user_id:
        stmt = stmt.where(Submission.user_id == user_id)
    elif group_id:
        stmt_m = select(GroupMember.user_id).where(GroupMember.group_id == group_id)
        res_m = await db.execute(stmt_m)
        member_ids = res_m.scalars().all()
        stmt = stmt.where(Submission.user_id.in_(member_ids))

    stmt = stmt.order_by(Submission.submitted_at.desc()).limit(limit)
    res = await db.execute(stmt)
    return res.scalars().all()
