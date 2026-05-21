"""User Pydantic schemas."""

from pydantic import BaseModel, EmailStr
from datetime import datetime
from uuid import UUID


class UserCreate(BaseModel):
    email: EmailStr
    name: str | None = None
    avatar_url: str | None = None


class UserRegister(BaseModel):
    email: EmailStr
    password: str
    name: str | None = None


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class GoogleLogin(BaseModel):
    access_token: str


class ForgotPassword(BaseModel):
    email: EmailStr


class ResetPassword(BaseModel):
    token: str
    new_password: str


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"



class UserUpdate(BaseModel):
    name: str | None = None
    avatar_url: str | None = None
    preferred_language: str | None = None
    timezone: str | None = None
    onboarding_complete: bool | None = None
    age: str | None = None
    primary_reason: str | None = None
    relaxation_methods: list[str] | None = None
    personalization_preferences: list | dict | None = None


class UserResponse(BaseModel):
    id: UUID
    email: str
    name: str | None
    avatar_url: str | None
    onboarding_complete: bool
    preferred_language: str
    timezone: str
    app_streak_count: int | None = 0
    longest_app_streak: int | None = 0
    age: str | None = None
    primary_reason: str | None = None
    relaxation_methods: list[str] | None = None
    personalization_preferences: list | dict | None = None
    created_at: datetime

    model_config = {"from_attributes": True}
