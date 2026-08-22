from typing import List, Optional
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.db.session import get_db
from app.models.models import User, UserStats, Submission, GroupMember
from app.schemas.schemas import LeaderboardEntry

router = APIRouter()


@router.get("/", response_model=List[LeaderboardEntry])
async def get_leaderboard(
    timeframe: str = Query("all_time", enum=["daily", "weekly", "all_time"]),
    group_id: Optional[str] = Query(None, description="Filter leaderboard by group ID"),
    db: AsyncSession = Depends(get_db),
):
    """
    Returns ranked leaderboard entries filtered by timeframe (daily, weekly, all_time)
    and optional group membership.
    """
    # 1. Base query for users
    if group_id:
        stmt_users = (
            select(User)
            .join(GroupMember, GroupMember.user_id == User.id)
            .where(GroupMember.group_id == group_id, User.is_active == True)
        )
    else:
        stmt_users = select(User).where(User.is_active == True)

    res_users = await db.execute(stmt_users)
    users = res_users.scalars().all()

    if not users:
        return []

    user_map = {u.id: u for u in users}
    user_ids = list(user_map.keys())

    # 2. Timeframe Filter Calculation
    now = datetime.utcnow()
    leaderboard_data = []

    if timeframe == "daily":
        since_dt = now.replace(hour=0, minute=0, second=0, microsecond=0)
    elif timeframe == "weekly":
        since_dt = now - timedelta(days=7)
    else:
        since_dt = None

    for uid in user_ids:
        u = user_map[uid]

        # Fetch stats object for streak & lifetime counts
        stmt_st = select(UserStats).where(UserStats.user_id == uid)
        res_st = await db.execute(stmt_st)
        stats = res_st.scalar_one_or_none()

        streak = stats.current_streak if stats else 0
        last_date = stats.last_solved_date if stats else None

        if timeframe == "all_time":
            total_pts = stats.total_points if stats else 0
            e_cnt = stats.easy_count if stats else 0
            m_cnt = stats.medium_count if stats else 0
            h_cnt = stats.hard_count if stats else 0
        else:
            # Query submissions in window
            stmt_window = select(Submission).where(
                Submission.user_id == uid,
                Submission.submitted_at >= since_dt,
            )
            res_win = await db.execute(stmt_window)
            win_subs = res_win.scalars().all()

            total_pts = sum(s.points_awarded for s in win_subs)
            e_cnt = sum(1 for s in win_subs if s.difficulty == "Easy" and s.points_awarded > 0)
            m_cnt = sum(1 for s in win_subs if s.difficulty == "Medium" and s.points_awarded > 0)
            h_cnt = sum(1 for s in win_subs if s.difficulty == "Hard" and s.points_awarded > 0)

        leaderboard_data.append({
            "user_id": u.id,
            "leetcode_username": u.leetcode_username,
            "display_name": u.display_name,
            "total_points": total_pts,
            "easy_count": e_cnt,
            "medium_count": m_cnt,
            "hard_count": h_cnt,
            "current_streak": streak,
            "last_solved_date": last_date,
        })

    # Sort by total points (descending), then streak (descending)
    leaderboard_data.sort(key=lambda x: (x["total_points"], x["current_streak"]), reverse=True)

    # Assign ranks
    result = []
    for idx, item in enumerate(leaderboard_data, start=1):
        result.append(
            LeaderboardEntry(
                rank=idx,
                user_id=item["user_id"],
                leetcode_username=item["leetcode_username"],
                display_name=item["display_name"],
                total_points=item["total_points"],
                easy_count=item["easy_count"],
                medium_count=item["medium_count"],
                hard_count=item["hard_count"],
                current_streak=item["current_streak"],
                last_solved_date=item["last_solved_date"],
            )
        )

    return result
