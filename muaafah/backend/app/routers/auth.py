from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime
from app.database import get_db
from app.models.user import User
from app.schemas.user import UserCreate, UserLogin, UserResponse, TokenResponse, UserUpdate, NafathAuthRequest
from app.services.auth_service import (
    get_password_hash, authenticate_user, create_access_token,
    decode_token, get_user_by_id
)

router = APIRouter(prefix="/auth", tags=["Authentication"])
security = HTTPBearer()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: AsyncSession = Depends(get_db)
) -> User:
    token = credentials.credentials
    payload = decode_token(token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token"
        )
    user = await get_user_by_id(db, payload.get("sub"))
    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or inactive"
        )
    return user


@router.post("/register", response_model=TokenResponse, status_code=201)
async def register(user_data: UserCreate, db: AsyncSession = Depends(get_db)):
    """Register a new user account."""
    result = await db.execute(select(User).where(User.email == user_data.email))
    if result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Email already registered")

    user = User(
        email=user_data.email,
        hashed_password=get_password_hash(user_data.password),
        full_name_en=user_data.full_name_en,
        full_name_ar=user_data.full_name_ar,
        phone=user_data.phone,
        date_of_birth=user_data.date_of_birth,
        gender=user_data.gender,
        role=user_data.role,
        national_id=user_data.national_id,
    )
    db.add(user)
    await db.flush()

    token = create_access_token({"sub": user.id, "role": user.role.value})
    return TokenResponse(access_token=token, user=UserResponse.model_validate(user))


@router.post("/login", response_model=TokenResponse)
async def login(credentials: UserLogin, db: AsyncSession = Depends(get_db)):
    """Login with email and password."""
    user = await authenticate_user(db, credentials.email, credentials.password)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    user.last_login = datetime.utcnow()
    await db.flush()

    token = create_access_token({"sub": user.id, "role": user.role.value})
    return TokenResponse(access_token=token, user=UserResponse.model_validate(user))


@router.post("/nafath", response_model=TokenResponse)
async def nafath_login(nafath_data: NafathAuthRequest, db: AsyncSession = Depends(get_db)):
    """
    Authenticate via Nafath national identity (mocked for demo).
    In production: validates nafath_token against Nafath APIs.
    """
    # Mock Nafath verification - in production, verify token with Nafath API
    result = await db.execute(select(User).where(User.national_id == nafath_data.national_id))
    user = result.scalar_one_or_none()

    if not user:
        # Auto-create patient account linked to national ID
        user = User(
            email=f"{nafath_data.national_id}@nafath.sa",
            hashed_password=get_password_hash(nafath_data.national_id),
            full_name_en=f"Patient {nafath_data.national_id[-4:]}",
            national_id=nafath_data.national_id,
            nafath_verified=True,
        )
        db.add(user)
        await db.flush()
    else:
        user.nafath_verified = True
        user.last_login = datetime.utcnow()
        await db.flush()

    token = create_access_token({"sub": user.id, "role": user.role.value})
    return TokenResponse(access_token=token, user=UserResponse.model_validate(user))


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user)):
    """Get current user profile."""
    return UserResponse.model_validate(current_user)


@router.put("/me", response_model=UserResponse)
async def update_profile(
    update_data: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Update user profile."""
    for field, value in update_data.model_dump(exclude_none=True).items():
        setattr(current_user, field, value)
    await db.flush()
    return UserResponse.model_validate(current_user)
