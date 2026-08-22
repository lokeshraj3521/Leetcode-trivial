from typing import List, Dict, Any
from datetime import datetime, timedelta, date
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.db.session import get_db
from app.models.models import User, UserStats, Submission, GroupMember, Group
from app.schemas.schemas import UserCreate, UserResponse, UserProfileResponse, HeatmapEntry
from app.services.points import points_service
from app.services.leetcode import leetcode_service

router = APIRouter()


@router.post("/", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def create_user(user_in: UserCreate, db: AsyncSession = Depends(get_db)):
    """Registers a new LeetCode user and creates initial stats."""
    stmt = select(User).where(User.leetcode_username == user_in.leetcode_username)
    res = await db.execute(stmt)
    if res.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"User with LeetCode username '{user_in.leetcode_username}' already exists.",
        )

    user = User(
        leetcode_username=user_in.leetcode_username,
        display_name=user_in.display_name,
        email=user_in.email,
        created_at=datetime.utcnow(),
    )
    db.add(user)
    await db.flush()

    # Initialize UserStats
    stats = UserStats(user_id=user.id)
    db.add(stats)
    await db.flush()

    # Trigger immediate first sync in background
    raw_subs = await leetcode_service.fetch_recent_ac_submissions(user.leetcode_username, limit=15)
    if raw_subs:
        await points_service.process_new_submissions(db, user.id, raw_subs)
        user.last_synced_at = datetime.utcnow()

    await db.commit()
    await db.refresh(user)
    return user


@router.get("/", response_model=List[UserResponse])
async def list_users(db: AsyncSession = Depends(get_db)):
    """Lists all active users."""
    stmt = select(User).where(User.is_active == True).order_by(User.created_at.desc())
    res = await db.execute(stmt)
    return res.scalars().all()


@router.get("/{user_id}", response_model=UserProfileResponse)
async def get_user_profile(user_id: str, db: AsyncSession = Depends(get_db)):
    """Returns detailed user profile, stats, and topic breakdown."""
    stmt = select(User).where(User.id == user_id)
    res = await db.execute(stmt)
    user = res.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")

    # Fetch stats
    stmt_stats = select(UserStats).where(UserStats.user_id == user_id)
    res_stats = await db.execute(stmt_stats)
    stats = res_stats.scalar_one_or_none()

    # Fetch topic tag breakdown
    stmt_subs = select(Submission).where(Submission.user_id == user_id)
    res_subs = await db.execute(stmt_subs)
    submissions = res_subs.scalars().all()

    topic_breakdown: Dict[str, int] = {}
    for sub in submissions:
        for tag in sub.topic_tags or []:
            topic_breakdown[tag] = topic_breakdown.get(tag, 0) + 1

    return UserProfileResponse(
        id=user.id,
        leetcode_username=user.leetcode_username,
        display_name=user.display_name,
        email=user.email,
        created_at=user.created_at,
        last_synced_at=user.last_synced_at,
        is_active=user.is_active,
        stats=stats,
        topic_breakdown=topic_breakdown,
        recent_submissions_count=len(submissions),
    )


@router.get("/{user_id}/heatmap", response_model=List[HeatmapEntry])
async def get_user_heatmap(user_id: str, db: AsyncSession = Depends(get_db)):
    """Returns 365-day submission heatmap activity grid for GitHub-style visualization."""
    stmt_subs = select(Submission).where(Submission.user_id == user_id)
    res_subs = await db.execute(stmt_subs)
    submissions = res_subs.scalars().all()

    daily_map: Dict[str, Dict[str, int]] = {}
    for s in submissions:
        day_str = s.submitted_at.strftime("%Y-%m-%d")
        if day_str not in daily_map:
            daily_map[day_str] = {"count": 0, "points": 0, "easy": 0, "medium": 0, "hard": 0}

        daily_map[day_str]["count"] += 1
        daily_map[day_str]["points"] += s.points_awarded
        diff = s.difficulty.capitalize()
        if diff == "Easy":
            daily_map[day_str]["easy"] += 1
        elif diff == "Medium":
            daily_map[day_str]["medium"] += 1
        elif diff == "Hard":
            daily_map[day_str]["hard"] += 1

    heatmap = [
        HeatmapEntry(
            date=day,
            count=data["count"],
            points=data["points"],
            easy=data["easy"],
            medium=data["medium"],
            hard=data["hard"],
        )
        for day, data in daily_map.items()
    ]
    heatmap.sort(key=lambda x: x.date)
    return heatmap
