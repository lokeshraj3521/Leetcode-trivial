from pydantic import BaseModel, Field, EmailStr, ConfigDict
from datetime import datetime, date
from typing import List, Optional, Any, Dict


# --- User Schemas ---
class UserCreate(BaseModel):
    leetcode_username: str = Field(..., min_length=1, max_length=100, description="LeetCode public username")
    display_name: str = Field(..., min_length=1, max_length=100, description="Display name for leaderboards")
    email: Optional[EmailStr] = None


class UserStatsSchema(BaseModel):
    total_points: int = 0
    easy_count: int = 0
    medium_count: int = 0
    hard_count: int = 0
    current_streak: int = 0
    longest_streak: int = 0
    last_solved_date: Optional[date] = None
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class UserResponse(BaseModel):
    id: str
    leetcode_username: str
    display_name: str
    email: Optional[str] = None
    created_at: datetime
    last_synced_at: Optional[datetime] = None
    is_active: bool

    model_config = ConfigDict(from_attributes=True)


class UserProfileResponse(UserResponse):
    stats: Optional[UserStatsSchema] = None
    topic_breakdown: Dict[str, int] = {}
    skills_breakdown: Dict[str, List[Dict[str, Any]]] = {}
    languages_breakdown: List[Dict[str, Any]] = []
    recent_submissions_count: int = 0


# --- Group Schemas ---
class GroupCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    created_by: str = Field(..., description="User ID of creator")


class GroupJoin(BaseModel):
    invite_code: str = Field(..., min_length=1, max_length=20)
    user_id: str


class GroupResponse(BaseModel):
    id: str
    name: str
    invite_code: str
    created_by: str
    created_at: datetime
    member_count: int = 0

    model_config = ConfigDict(from_attributes=True)


# --- Submission & Heatmap Schemas ---
class SubmissionResponse(BaseModel):
    id: str
    user_id: str
    leetcode_submission_id: str
    problem_slug: str
    problem_title: str
    difficulty: str
    language: str
    topic_tags: List[str] = []
    points_awarded: int
    submitted_at: datetime
    synced_at: datetime

    model_config = ConfigDict(from_attributes=True)


class HeatmapEntry(BaseModel):
    date: str  # YYYY-MM-DD
    count: int
    points: int
    easy: int = 0
    medium: int = 0
    hard: int = 0


# --- Leaderboard Schemas ---
class LeaderboardEntry(BaseModel):
    rank: int
    user_id: str
    leetcode_username: str
    display_name: str
    total_points: int
    easy_count: int
    medium_count: int
    hard_count: int
    current_streak: int
    last_solved_date: Optional[date] = None


# --- Notification Schemas ---
class DeviceTokenRegister(BaseModel):
    user_id: str
    fcm_token: str
    platform: str = "web"


class NotificationLogResponse(BaseModel):
    id: str
    triggered_by_user_id: str
    triggered_by_name: Optional[str] = None
    sent_to_user_id: str
    title: str
    body: str
    sent_at: datetime
    status: str

    model_config = ConfigDict(from_attributes=True)


# --- AI Insights Schemas ---
class AIInsightResponse(BaseModel):
    id: str
    user_id: str
    insight_type: str
    content: Any
    generated_at: datetime
    valid_until: datetime

    model_config = ConfigDict(from_attributes=True)
