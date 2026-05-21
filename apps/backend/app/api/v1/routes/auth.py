import uuid
import secrets
import asyncio
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID
import httpx

from app.core.database import get_db
from app.core.security import (
    get_current_user,
    get_password_hash,
    verify_password,
    create_access_token,
    create_refresh_token,
)
from app.core.config import get_settings
from app.models.user import User
from app.services.email_service import send_password_reset_email
from app.schemas.user import (
    UserResponse,
    UserUpdate,
    UserRegister,
    UserLogin,
    GoogleLogin,
    TokenResponse,
    ForgotPassword,
    ResetPassword,
)

settings = get_settings()

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=TokenResponse)
async def register(user_in: UserRegister, db: AsyncSession = Depends(get_db)):
    """Register a new user."""
    # Check if user exists
    result = await db.execute(select(User).where(User.email == user_in.email))
    if result.scalar_one_or_none():
        raise HTTPException(
            status_code=400,
            detail="User with this email already exists",
        )

    user_id = str(uuid.uuid4())
    user = User(
        id=user_id,
        email=user_in.email,
        password_hash=get_password_hash(user_in.password),
        name=user_in.name,
    )
    db.add(user)
    await db.commit()

    return TokenResponse(
        access_token=create_access_token(user_id),
        refresh_token=create_refresh_token(user_id),
    )


@router.post("/login", response_model=TokenResponse)
async def login(user_in: UserLogin, db: AsyncSession = Depends(get_db)):
    """Authenticate user and return tokens."""
    result = await db.execute(select(User).where(User.email == user_in.email))
    user = result.scalar_one_or_none()

    if not user or not user.password_hash:
        raise HTTPException(
            status_code=401,
            detail="Incorrect email or password",
        )

    if not verify_password(user_in.password, user.password_hash):
        raise HTTPException(
            status_code=401,
            detail="Incorrect email or password",
        )

    return TokenResponse(
        access_token=create_access_token(user.id),
        refresh_token=create_refresh_token(user.id),
    )


@router.post("/google", response_model=TokenResponse)
async def google_login(user_in: GoogleLogin, db: AsyncSession = Depends(get_db)):
    """Authenticate or register user via Google OAuth access token."""
    async with httpx.AsyncClient() as client:
        resp = await client.get(
            "https://www.googleapis.com/oauth2/v3/userinfo",
            headers={"Authorization": f"Bearer {user_in.access_token}"},
            timeout=10.0,
        )

    if resp.status_code != 200:
        raise HTTPException(status_code=401, detail="Invalid Google access token")

    info = resp.json()
    email = info.get("email")
    if not email:
        raise HTTPException(status_code=400, detail="Google account has no email address")

    if not info.get("email_verified", False):
        raise HTTPException(status_code=400, detail="Google account email is not verified")

    # Find existing user or create a new one
    result = await db.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()

    if not user:
        user_id = str(uuid.uuid4())
        user = User(
            id=user_id,
            email=email,
            name=info.get("name"),
            avatar_url=info.get("picture"),
        )
        db.add(user)
        await db.commit()

    return TokenResponse(
        access_token=create_access_token(user.id),
        refresh_token=create_refresh_token(user.id),
    )


@router.post("/forgot-password")
async def forgot_password(data: ForgotPassword, db: AsyncSession = Depends(get_db)):
    """Send password reset email."""
    result = await db.execute(select(User).where(User.email == data.email))
    user = result.scalar_one_or_none()
    
    if user:
        token = secrets.token_urlsafe(32)
        user.password_reset_token = token
        user.password_reset_expires = datetime.utcnow() + timedelta(hours=1)
        await db.commit()
        
        # Send password reset email (run in thread so it never blocks the event loop)
        await asyncio.to_thread(send_password_reset_email, user.email, token)
        
    return {"message": "If that email exists, a reset link has been sent"}


@router.post("/reset-password")
async def reset_password(data: ResetPassword, db: AsyncSession = Depends(get_db)):
    """Reset password using token."""
    result = await db.execute(
        select(User).where(
            User.password_reset_token == data.token,
            User.password_reset_expires > datetime.utcnow()
        )
    )
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(status_code=400, detail="Invalid or expired reset token")
        
    user.password_hash = get_password_hash(data.new_password)
    user.password_reset_token = None
    user.password_reset_expires = None
    await db.commit()
    
    return {"message": "Password reset successfully"}


@router.get("/me", response_model=UserResponse)
async def get_me(
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get the current authenticated user's profile."""
    user_id = current_user["sub"]
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    return user


@router.patch("/me", response_model=UserResponse)
async def update_me(
    updates: UserUpdate,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update the current user's profile."""
    user_id = current_user["sub"]
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    update_data = updates.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(user, field, value)

    await db.commit()
    await db.refresh(user)

    return user


@router.delete("/me")
async def delete_me(
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Permanently delete the current user's account and all related data."""
    user_id = current_user["sub"]
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    await db.delete(user)
    await db.commit()

    return {"message": "Account deleted successfully"}
