from pydantic import BaseModel, EmailStr
from typing import Optional, Dict, Any
from datetime import datetime
from app.models.user import UserRole


class UserCreate(BaseModel):
    email: EmailStr
    password: str
    full_name_en: str
    full_name_ar: Optional[str] = None
    phone: Optional[str] = None
    date_of_birth: Optional[str] = None
    gender: Optional[str] = None
    role: UserRole = UserRole.PATIENT
    national_id: Optional[str] = None


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserUpdate(BaseModel):
    full_name_en: Optional[str] = None
    full_name_ar: Optional[str] = None
    phone: Optional[str] = None
    date_of_birth: Optional[str] = None
    gender: Optional[str] = None
    preferences: Optional[Dict[str, Any]] = None


class UserResponse(BaseModel):
    id: str
    email: str
    full_name_en: str
    full_name_ar: Optional[str]
    phone: Optional[str]
    date_of_birth: Optional[str]
    gender: Optional[str]
    role: UserRole
    is_active: bool
    is_verified: bool
    nafath_verified: bool
    national_id: Optional[str]
    organization_id: Optional[str]
    preferences: Optional[Dict[str, Any]]
    created_at: Optional[datetime]

    class Config:
        from_attributes = True


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


class NafathAuthRequest(BaseModel):
    national_id: str
    nafath_token: str


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str
