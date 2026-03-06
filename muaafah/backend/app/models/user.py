from sqlalchemy import Column, String, DateTime, Boolean, Enum as SAEnum
from sqlalchemy.dialects.sqlite import JSON
from sqlalchemy.sql import func
import uuid
import enum
from app.database import Base


class UserRole(str, enum.Enum):
    PATIENT = "patient"
    PROVIDER_ADMIN = "provider_admin"
    INSURER_ADMIN = "insurer_admin"
    SYSTEM_ADMIN = "system_admin"


class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    national_id = Column(String, unique=True, index=True, nullable=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name_en = Column(String, nullable=False)
    full_name_ar = Column(String, nullable=True)
    phone = Column(String, nullable=True)
    date_of_birth = Column(String, nullable=True)
    gender = Column(String, nullable=True)
    role = Column(SAEnum(UserRole), default=UserRole.PATIENT, nullable=False)
    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=False)
    nafath_verified = Column(Boolean, default=False)
    organization_id = Column(String, nullable=True)
    preferences = Column(JSON, default=dict)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    last_login = Column(DateTime(timezone=True), nullable=True)
