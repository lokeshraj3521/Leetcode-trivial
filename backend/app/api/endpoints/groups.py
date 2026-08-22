import secrets
from typing import List
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.db.session import get_db
from app.models.models import Group, GroupMember, User, UserStats
from app.schemas.schemas import GroupCreate, GroupJoin, GroupResponse, LeaderboardEntry

router = APIRouter()


def generate_invite_code() -> str:
    return secrets.token_hex(4).upper()


@router.post("/", response_model=GroupResponse, status_code=status.HTTP_201_CREATED)
async def create_group(group_in: GroupCreate, db: AsyncSession = Depends(get_db)):
    """Creates a new friend group/room with a unique invite code."""
    # Check creator exists
    stmt_user = select(User).where(User.id == group_in.created_by)
    res_user = await db.execute(stmt_user)
    if not res_user.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Creator user not found.")

    invite_code = generate_invite_code()
    group = Group(
        name=group_in.name,
        invite_code=invite_code,
        created_by=group_in.created_by,
        created_at=datetime.utcnow(),
    )
    db.add(group)
    await db.flush()

    # Automatically add creator as first group member
    member = GroupMember(group_id=group.id, user_id=group_in.created_by)
    db.add(member)

    await db.commit()

    return GroupResponse(
        id=group.id,
        name=group.name,
        invite_code=group.invite_code,
        created_by=group.created_by,
        created_at=group.created_at,
        member_count=1,
    )


@router.post("/join", response_model=GroupResponse)
async def join_group(join_in: GroupJoin, db: AsyncSession = Depends(get_db)):
    """Joins an existing group using an invite code."""
    stmt_grp = select(Group).where(Group.invite_code == join_in.invite_code.upper())
    res_grp = await db.execute(stmt_grp)
    group = res_grp.scalar_one_or_none()

    if not group:
        raise HTTPException(status_code=404, detail="Invalid invite code.")

    stmt_user = select(User).where(User.id == join_in.user_id)
    res_user = await db.execute(stmt_user)
    if not res_user.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="User not found.")

    # Check if already a member
    stmt_mem = select(GroupMember).where(
        GroupMember.group_id == group.id,
        GroupMember.user_id == join_in.user_id,
    )
    res_mem = await db.execute(stmt_mem)
    if res_mem.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="User is already a member of this group.")

    member = GroupMember(group_id=group.id, user_id=join_in.user_id)
    db.add(member)
    await db.commit()

    # Count members
    stmt_count = select(func.count(GroupMember.user_id)).where(GroupMember.group_id == group.id)
    res_cnt = await db.execute(stmt_count)
    m_count = res_cnt.scalar() or 1

    return GroupResponse(
        id=group.id,
        name=group.name,
        invite_code=group.invite_code,
        created_by=group.created_by,
        created_at=group.created_at,
        member_count=m_count,
    )


@router.get("/", response_model=List[GroupResponse])
async def list_groups(db: AsyncSession = Depends(get_db)):
    """Lists all groups with member counts."""
    stmt = select(Group).order_by(Group.created_at.desc())
    res = await db.execute(stmt)
    groups = res.scalars().all()

    result = []
    for g in groups:
        stmt_cnt = select(func.count(GroupMember.user_id)).where(GroupMember.group_id == g.id)
        res_cnt = await db.execute(stmt_cnt)
        cnt = res_cnt.scalar() or 0

        result.append(
            GroupResponse(
                id=g.id,
                name=g.name,
                invite_code=g.invite_code,
                created_by=g.created_by,
                created_at=g.created_at,
                member_count=cnt,
            )
        )
    return result
