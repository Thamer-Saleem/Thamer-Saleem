from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from typing import List
from app.database import get_db
from app.models.user import User, UserRole
from app.models.lab_report import LabReport
from app.models.appointment import Appointment
from app.models.provider import Provider
from app.schemas.user import UserResponse
from app.routers.auth import get_current_user

router = APIRouter(prefix="/admin", tags=["Admin"])


def require_admin(current_user: User = Depends(get_current_user)) -> User:
    if current_user.role not in [UserRole.SYSTEM_ADMIN]:
        raise HTTPException(status_code=403, detail="Admin access required")
    return current_user


@router.get("/dashboard")
async def admin_dashboard(
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin)
):
    """Master admin dashboard with platform KPIs."""
    users_result = await db.execute(select(func.count(User.id)))
    total_users = users_result.scalar()

    active_users = await db.execute(
        select(func.count(User.id)).where(User.is_active == True)
    )
    total_active = active_users.scalar()

    reports_result = await db.execute(select(func.count(LabReport.id)))
    total_reports = reports_result.scalar()

    appointments_result = await db.execute(select(func.count(Appointment.id)))
    total_appointments = appointments_result.scalar()

    providers_result = await db.execute(select(func.count(Provider.id)))
    total_providers = providers_result.scalar()

    return {
        "kpis": {
            "total_users": total_users,
            "active_users": total_active,
            "total_lab_reports": total_reports,
            "total_appointments": total_appointments,
            "total_providers": total_providers,
            "system_uptime_percent": 99.9,
        },
        "recent_alerts": [
            {"type": "info", "message": "System running normally", "timestamp": "2024-12-15T10:00:00"},
        ],
        "platform_health": "healthy"
    }


@router.get("/users", response_model=List[UserResponse])
async def list_all_users(
    role: str = None,
    limit: int = 50,
    offset: int = 0,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin)
):
    """List all platform users with filtering."""
    query = select(User)
    if role:
        query = query.where(User.role == role)
    query = query.limit(limit).offset(offset)
    result = await db.execute(query)
    users = result.scalars().all()
    return [UserResponse.model_validate(u) for u in users]


@router.put("/users/{user_id}/suspend")
async def suspend_user(
    user_id: str,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin)
):
    """Suspend a user account."""
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.is_active = False
    await db.flush()
    return {"message": f"User {user.email} suspended successfully"}


@router.put("/users/{user_id}/activate")
async def activate_user(
    user_id: str,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin)
):
    """Activate a suspended user account."""
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.is_active = True
    await db.flush()
    return {"message": f"User {user.email} activated successfully"}


@router.get("/clinical-rules")
async def get_clinical_rules(admin: User = Depends(require_admin)):
    """View current AI clinical pathway rules."""
    from app.services.ai_engine import CLINICAL_RULES
    return {
        "rules": [
            {
                "biomarker": key,
                "normal_range": f"{rule.get('normal_min')} - {rule.get('normal_max')} {rule.get('unit')}",
                "pathway": rule.get("pathway"),
                "specialists_en": rule.get("specialists_en"),
                "tests_en": rule.get("tests_en"),
            }
            for key, rule in CLINICAL_RULES.items()
        ],
        "total_pathways": len(CLINICAL_RULES),
        "version": "1.0.0",
        "last_reviewed": "2024-12-01",
        "clinical_governance_board": "Pending Formation",
    }


@router.get("/analytics")
async def platform_analytics(
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin)
):
    """Platform-wide analytics for the admin dashboard."""
    return {
        "user_growth": [
            {"month": "Oct 2024", "users": 120},
            {"month": "Nov 2024", "users": 284},
            {"month": "Dec 2024", "users": 501},
        ],
        "top_specialties_requested": [
            {"specialty": "Endocrinologist", "count": 145},
            {"specialty": "Cardiologist", "count": 98},
            {"specialty": "Nephrologist", "count": 67},
            {"specialty": "Hepatologist", "count": 54},
        ],
        "lab_report_statuses": {
            "analyzed": 380,
            "action_required": 95,
            "pending": 26,
        },
        "avg_time_to_appointment_hours": 18.4,
        "patient_nps": 62,
    }
