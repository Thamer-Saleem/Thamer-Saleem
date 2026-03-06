from sqlalchemy import Column, String, DateTime, ForeignKey, Text, Enum as SAEnum
from sqlalchemy.dialects.sqlite import JSON
from sqlalchemy.sql import func
import uuid
import enum
from app.database import Base


class AppointmentStatus(str, enum.Enum):
    PENDING = "pending"
    CONFIRMED = "confirmed"
    CANCELLED = "cancelled"
    COMPLETED = "completed"
    NO_SHOW = "no_show"


class Appointment(Base):
    __tablename__ = "appointments"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    patient_id = Column(String, ForeignKey("users.id"), nullable=False, index=True)
    provider_id = Column(String, ForeignKey("providers.id"), nullable=False)
    slot_id = Column(String, ForeignKey("provider_slots.id"), nullable=True)
    lab_report_id = Column(String, ForeignKey("lab_reports.id"), nullable=True)
    scheduled_date = Column(String, nullable=False)
    scheduled_time = Column(String, nullable=False)
    status = Column(SAEnum(AppointmentStatus), default=AppointmentStatus.PENDING)
    appointment_type = Column(String, default="consultation")
    reason = Column(Text, nullable=True)
    notes = Column(Text, nullable=True)
    insurance_policy_id = Column(String, nullable=True)
    pre_auth_number = Column(String, nullable=True)
    co_payment = Column(String, nullable=True)
    cancellation_reason = Column(Text, nullable=True)
    reminders_sent = Column(JSON, default=list)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
