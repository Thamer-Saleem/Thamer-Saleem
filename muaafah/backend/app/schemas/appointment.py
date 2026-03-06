from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from app.models.appointment import AppointmentStatus


class AppointmentCreate(BaseModel):
    provider_id: str
    slot_id: Optional[str] = None
    lab_report_id: Optional[str] = None
    scheduled_date: str
    scheduled_time: str
    appointment_type: str = "consultation"
    reason: Optional[str] = None
    insurance_policy_id: Optional[str] = None


class AppointmentUpdate(BaseModel):
    scheduled_date: Optional[str] = None
    scheduled_time: Optional[str] = None
    status: Optional[AppointmentStatus] = None
    notes: Optional[str] = None
    cancellation_reason: Optional[str] = None


class AppointmentResponse(BaseModel):
    id: str
    patient_id: str
    provider_id: str
    slot_id: Optional[str]
    lab_report_id: Optional[str]
    scheduled_date: str
    scheduled_time: str
    status: AppointmentStatus
    appointment_type: str
    reason: Optional[str]
    notes: Optional[str]
    insurance_policy_id: Optional[str]
    pre_auth_number: Optional[str]
    co_payment: Optional[str]
    created_at: Optional[datetime]
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True
