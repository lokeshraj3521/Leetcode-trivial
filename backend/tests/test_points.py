import pytest
import pytest_asyncio
from datetime import datetime, timedelta
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from app.db.session import Base
from app.models.models import User
from app.services.points import points_service


@pytest_asyncio.fixture
async def async_db():
    engine = create_async_engine("sqlite+aiosqlite:///:memory:", echo=False)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async_session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    async with async_session() as session:
        yield session

    await engine.dispose()


@pytest.mark.asyncio
async def test_calculate_difficulty_points():
    assert points_service.calculate_difficulty_points("Easy") == 1
    assert points_service.calculate_difficulty_points("Medium") == 3
    assert points_service.calculate_difficulty_points("Hard") == 5


@pytest.mark.asyncio
async def test_process_new_submissions_and_deduplication(async_db):
    user = User(leetcode_username="test_user", display_name="Test User")
    async_db.add(user)
    await async_db.flush()

    raw_subs = [
        {
            "leetcode_submission_id": "sub1",
            "problem_slug": "two-sum",
            "problem_title": "Two Sum",
            "difficulty": "Easy",
            "language": "python3",
            "topic_tags": ["Array"],
            "submitted_at": datetime.utcnow() - timedelta(days=1),
        },
        {
            "leetcode_submission_id": "sub2",
            "problem_slug": "add-two-numbers",
            "problem_title": "Add Two Numbers",
            "difficulty": "Medium",
            "language": "python3",
            "topic_tags": ["Linked List"],
            "submitted_at": datetime.utcnow(),
        },
        {
            "leetcode_submission_id": "sub3",
            "problem_slug": "two-sum",
            "problem_title": "Two Sum",
            "difficulty": "Easy",
            "language": "python3",
            "topic_tags": ["Array"],
            "submitted_at": datetime.utcnow(),
        },
    ]

    new_subs, pts = await points_service.process_new_submissions(async_db, user.id, raw_subs)
    await async_db.commit()

    assert len(new_subs) == 3
    assert pts == 4

    stats = await points_service.update_user_stats(async_db, user.id)
    assert stats.total_points == 4
    assert stats.easy_count == 1
    assert stats.medium_count == 1
    assert stats.hard_count == 0
