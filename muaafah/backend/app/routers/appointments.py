from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List
from app.database import get_db
from app.models.user import User
from app.models.appointment import Appointment, AppointmentStatus
from app.models.provider import ProviderSlot
from app.schemas.appointment import AppointmentCreate, AppointmentUpdate, AppointmentResponse
from app.routers.auth import get_current_user

router = APIRouter(prefix="/appointments", tags=["Appointments"])


@router.post("/", response_model=AppointmentResponse, status_code=201)
async def book_appointment(
    appointment_data: AppointmentCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Book a new appointment with a provider."""
    # Mark slot as unavailable if slot_id provided
    if appointment_data.slot_id:
        slot_result = await db.execute(
            select(ProviderSlot).where(ProviderSlot.id == appointment_data.slot_id)
        )
        slot = slot_result.scalar_one_or_none()
        if slot and slot.is_available:
            slot.is_available = False
            await db.flush()

    appointment = Appointment(
        patient_id=current_user.id,
        **appointment_data.model_dump()
    )
    db.add(appointment)
    await db.flush()

    return AppointmentResponse.model_validate(appointment)


@router.get("/", response_model=List[AppointmentResponse])
async def get_my_appointments(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get all appointments for the current patient."""
    result = await db.execute(
        select(Appointment)
        .where(Appointment.patient_id == current_user.id)
        .order_by(Appointment.scheduled_date.desc())
    )
    appointments = result.scalars().all()
    return [AppointmentResponse.model_validate(a) for a in appointments]


@router.get("/upcoming", response_model=List[AppointmentResponse])
async def get_upcoming_appointments(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get upcoming confirmed appointments."""
    result = await db.execute(
        select(Appointment).where(
            Appointment.patient_id == current_user.id,
            Appointment.status.in_([AppointmentStatus.CONFIRMED, AppointmentStatus.PENDING])
        ).order_by(Appointment.scheduled_date)
    )
    appointments = result.scalars().all()
    return [AppointmentResponse.model_validate(a) for a in appointments]


@router.get("/{appointment_id}", response_model=AppointmentResponse)
async def get_appointment(
    appointment_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get a specific appointment."""
    result = await db.execute(
        select(Appointment).where(
            Appointment.id == appointment_id,
            Appointment.patient_id == current_user.id
        )
    )
    appointment = result.scalar_one_or_none()
    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found")
    return AppointmentResponse.model_validate(appointment)


@router.put("/{appointment_id}", response_model=AppointmentResponse)
async def update_appointment(
    appointment_id: str,
    update_data: AppointmentUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Update or cancel an appointment."""
    result = await db.execute(
        select(Appointment).where(
            Appointment.id == appointment_id,
            Appointment.patient_id == current_user.id
        )
    )
    appointment = result.scalar_one_or_none()
    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found")

    for field, value in update_data.model_dump(exclude_none=True).items():
        setattr(appointment, field, value)
    await db.flush()

    return AppointmentResponse.model_validate(appointment)


@router.delete("/{appointment_id}", status_code=204)
async def cancel_appointment(
    appointment_id: str,
    reason: str = "Patient cancelled",
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Cancel an appointment."""
    result = await db.execute(
        select(Appointment).where(
            Appointment.id == appointment_id,
            Appointment.patient_id == current_user.id
        )
    )
    appointment = result.scalar_one_or_none()
    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found")

    appointment.status = AppointmentStatus.CANCELLED
    appointment.cancellation_reason = reason

    # Re-open the slot
    if appointment.slot_id:
        slot_result = await db.execute(
            select(ProviderSlot).where(ProviderSlot.id == appointment.slot_id)
        )
        slot = slot_result.scalar_one_or_none()
        if slot:
            slot.is_available = True
    await db.flush()
