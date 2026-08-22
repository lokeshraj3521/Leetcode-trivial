from fastapi import APIRouter
from app.api.endpoints import auth, users, groups, messages, leaderboard, submissions, notifications, ai, sync

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["Auth"])
api_router.include_router(users.router, prefix="/users", tags=["Users"])
api_router.include_router(groups.router, prefix="/groups", tags=["Groups"])
api_router.include_router(messages.router, prefix="/messages", tags=["Messages"])
api_router.include_router(leaderboard.router, prefix="/leaderboard", tags=["Leaderboard"])
api_router.include_router(submissions.router, prefix="/submissions", tags=["Submissions"])
api_router.include_router(notifications.router, prefix="/notifications", tags=["Notifications"])
api_router.include_router(ai.router, prefix="/ai", tags=["AI Insights"])
api_router.include_router(sync.router, prefix="/sync", tags=["Sync"])
