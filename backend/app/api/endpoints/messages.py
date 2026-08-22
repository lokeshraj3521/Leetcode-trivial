from typing import List
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.db.session import get_db
from app.models.models import Group, GroupMessage, User
from app.schemas.schemas import GroupMessageCreate, GroupMessageResponse

router = APIRouter()


@router.get("/group/{group_id}", response_model=List[GroupMessageResponse])
async def list_group_messages(group_id: str, limit: int = 50, db: AsyncSession = Depends(get_db)):
    """Returns recent message chat history for a group."""
    stmt_group = select(Group).where(Group.id == group_id)
    res_group = await db.execute(stmt_group)
    if not res_group.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Group not found.")

    stmt = (
        select(GroupMessage)
        .where(GroupMessage.group_id == group_id)
        .order_by(GroupMessage.sent_at.asc())
        .limit(limit)
    )
    res = await db.execute(stmt)
    return res.scalars().all()


@router.post("/group/{group_id}", response_model=GroupMessageResponse, status_code=status.HTTP_201_CREATED)
async def send_group_message(group_id: str, msg_in: GroupMessageCreate, db: AsyncSession = Depends(get_db)):
    """Posts a new message to the group chat stream."""
    stmt_group = select(Group).where(Group.id == group_id)
    res_group = await db.execute(stmt_group)
    if not res_group.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Group not found.")

    stmt_user = select(User).where(User.id == msg_in.sender_id)
    res_user = await db.execute(stmt_user)
    user = res_user.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="Sender user not found.")

    msg = GroupMessage(
        group_id=group_id,
        sender_id=msg_in.sender_id,
        sender_name=user.display_name,
        content=msg_in.content.strip(),
        sent_at=datetime.utcnow(),
    )
    db.add(msg)
    await db.commit()
    await db.refresh(msg)
    return msg
