import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from app.main import app
from app.db.session import Base, get_db


@pytest_asyncio.fixture
async def async_test_db():
    engine = create_async_engine("sqlite+aiosqlite:///:memory:", echo=False)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async_session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async def override_get_db():
        async with async_session() as session:
            yield session

    app.dependency_overrides[get_db] = override_get_db

    async with async_session() as session:
        yield session

    app.dependency_overrides.clear()
    await engine.dispose()


@pytest.mark.asyncio
async def test_health_check():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        res = await ac.get("/health")
        assert res.status_code == 200
        assert res.json()["status"] == "online"


@pytest.mark.asyncio
async def test_create_and_get_user(async_test_db):
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        payload = {"leetcode_username": "tester_1", "display_name": "Tester One"}
        res = await ac.post("/api/v1/users/", json=payload)
        assert res.status_code == 201
        data = res.json()
        user_id = data["id"]
        assert data["leetcode_username"] == "tester_1"

        res_prof = await ac.get(f"/api/v1/users/{user_id}")
        assert res_prof.status_code == 200
        assert res_prof.json()["display_name"] == "Tester One"


@pytest.mark.asyncio
async def test_group_create_and_join(async_test_db):
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        u1 = (await ac.post("/api/v1/users/", json={"leetcode_username": "creator_u", "display_name": "Creator"})).json()
        u2 = (await ac.post("/api/v1/users/", json={"leetcode_username": "joiner_u", "display_name": "Joiner"})).json()

        grp_payload = {"name": "Test Squad", "created_by": u1["id"]}
        res_g = await ac.post("/api/v1/groups/", json=grp_payload)
        assert res_g.status_code == 201
        g_data = res_g.json()
        invite_code = g_data["invite_code"]

        join_payload = {"invite_code": invite_code, "user_id": u2["id"]}
        res_j = await ac.post("/api/v1/groups/join", json=join_payload)
        assert res_j.status_code == 200
        assert res_j.json()["member_count"] == 2


@pytest.mark.asyncio
async def test_leaderboard(async_test_db):
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        await ac.post("/api/v1/users/", json={"leetcode_username": "user_a", "display_name": "User A"})
        res_lb = await ac.get("/api/v1/leaderboard/")
        assert res_lb.status_code == 200
        assert isinstance(res_lb.json(), list)
