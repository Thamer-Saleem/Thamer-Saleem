from sqlalchemy import Column, String, DateTime, Boolean, Float, Integer, ForeignKey, Text
from sqlalchemy.dialects.sqlite import JSON
from sqlalchemy.sql import func
import uuid
from app.database import Base


class Provider(Base):
    __tablename__ = "providers"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    organization_name_en = Column(String, nullable=False)
    organization_name_ar = Column(String, nullable=True)
    doctor_name_en = Column(String, nullable=False)
    doctor_name_ar = Column(String, nullable=True)
    specialty_en = Column(String, nullable=False)
    specialty_ar = Column(String, nullable=True)
    specialty_code = Column(String, nullable=True)
    photo_url = Column(String, nullable=True)
    rating = Column(Float, default=0.0)
    review_count = Column(Integer, default=0)
    address_en = Column(Text, nullable=True)
    address_ar = Column(Text, nullable=True)
    city = Column(String, nullable=True)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    phone = Column(String, nullable=True)
    email = Column(String, nullable=True)
    insurance_networks = Column(JSON, default=list)
    languages = Column(JSON, default=list)
    is_active = Column(Boolean, default=True)
    consultation_fee = Column(Float, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class ProviderSlot(Base):
    __tablename__ = "provider_slots"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    provider_id = Column(String, ForeignKey("providers.id"), nullable=False, index=True)
    date = Column(String, nullable=False)
    start_time = Column(String, nullable=False)
    end_time = Column(String, nullable=False)
    is_available = Column(Boolean, default=True)
    appointment_type = Column(String, default="consultation")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
