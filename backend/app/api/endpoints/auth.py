from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from passlib.context import CryptContext

from app.db.session import get_db
from app.models.models import User, UserStats
from app.schemas.schemas import UserRegister, UserLogin, UserProfileResponse
from app.services.leetcode import leetcode_service
from app.services.points import points_service

router = APIRouter()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    if not hashed_password:
        return True
    try:
        return pwd_context.verify(plain_password, hashed_password)
    except Exception:
        return False


@router.post("/register", response_model=UserProfileResponse, status_code=status.HTTP_201_CREATED)
async def register(user_in: UserRegister, db: AsyncSession = Depends(get_db)):
    """Registers or updates a user account with password, phone number, and display name."""
    clean_username = user_in.leetcode_username.strip()

    # Case-insensitive check if user exists
    stmt = select(User).where(func.lower(User.leetcode_username) == clean_username.lower())
    res = await db.execute(stmt)
    existing_user = res.scalar_one_or_none()

    pw_hash = hash_password(user_in.password)

    if existing_user:
        # If user exists, update their details (password, display_name, phone_number, email)
        if user_in.display_name:
            existing_user.display_name = user_in.display_name.strip()
        if user_in.email:
            existing_user.email = user_in.email.strip()
        if user_in.phone_number:
            existing_user.phone_number = user_in.phone_number.strip()
        existing_user.password_hash = pw_hash
        user = existing_user
    else:
        # Verify username validity on LeetCode for brand new user
        profile_stats = await leetcode_service.fetch_user_profile_stats(clean_username)
        if profile_stats.get("totalSolved") == 0 and profile_stats.get("easySolved") == 0:
            recent = await leetcode_service.fetch_recent_ac_submissions(clean_username, limit=1)
            if not recent:
                cal = await leetcode_service.fetch_user_calendar(clean_username)
                if not cal.get("submissionCalendar") and not cal.get("activeYears"):
                    raise HTTPException(
                        status_code=status.HTTP_404_NOT_FOUND,
                        detail=f"LeetCode user '{clean_username}' not found. Please check spelling.",
                    )

        user = User(
            leetcode_username=clean_username,
            display_name=user_in.display_name.strip(),
            email=user_in.email.strip() if user_in.email else None,
            phone_number=user_in.phone_number.strip() if user_in.phone_number else None,
            password_hash=pw_hash,
            created_at=datetime.utcnow(),
        )
        db.add(user)
        await db.flush()

        stats = UserStats(user_id=user.id)
        db.add(stats)
        await db.flush()

    raw_subs = await leetcode_service.fetch_recent_ac_submissions(clean_username, limit=20)
    if raw_subs:
        await points_service.process_new_submissions(db, user.id, raw_subs)
    
    updated_stats = await points_service.update_user_stats(db, user.id)
    user.last_synced_at = datetime.utcnow()

    await db.commit()
    await db.refresh(user)

    skills_data = await leetcode_service.fetch_user_skills_and_languages(clean_username)

    return UserProfileResponse(
        id=user.id,
        leetcode_username=user.leetcode_username,
        display_name=user.display_name,
        email=user.email,
        phone_number=user.phone_number,
        created_at=user.created_at,
        last_synced_at=user.last_synced_at,
        is_active=user.is_active,
        stats=updated_stats,
        topic_breakdown={},
        skills_breakdown=skills_data.get("skills", {}),
        languages_breakdown=skills_data.get("languages", []),
        recent_submissions_count=len(raw_subs),
    )


@router.post("/login", response_model=UserProfileResponse)
async def login(credentials: UserLogin, db: AsyncSession = Depends(get_db)):
    """Authenticates username and password, persisting session."""
    clean_username = credentials.leetcode_username.strip()
    stmt = select(User).where(func.lower(User.leetcode_username) == clean_username.lower())
    res = await db.execute(stmt)
    user = res.scalar_one_or_none()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Account '{clean_username}' not found. Please click 'Register with your LeetCode ID' below.",
        )

    # Password validation
    if user.password_hash:
        if not verify_password(credentials.password, user.password_hash):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect password. Please check your password.",
            )
    else:
        user.password_hash = hash_password(credentials.password)

    updated_stats = await points_service.update_user_stats(db, user.id)
    user.last_synced_at = datetime.utcnow()
    await db.commit()

    skills_data = await leetcode_service.fetch_user_skills_and_languages(user.leetcode_username)

    return UserProfileResponse(
        id=user.id,
        leetcode_username=user.leetcode_username,
        display_name=user.display_name,
        email=user.email,
        phone_number=user.phone_number,
        created_at=user.created_at,
        last_synced_at=user.last_synced_at,
        is_active=user.is_active,
        stats=updated_stats,
        topic_breakdown={},
        skills_breakdown=skills_data.get("skills", {}),
        languages_breakdown=skills_data.get("languages", []),
        recent_submissions_count=0,
    )
