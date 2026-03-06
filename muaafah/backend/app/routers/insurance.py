from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List
from app.database import get_db
from app.models.user import User
from app.models.insurance import InsurancePolicy
from app.schemas.insurance import (
    InsurancePolicyCreate, InsurancePolicyResponse, InsuranceVerificationResponse
)
from app.routers.auth import get_current_user

router = APIRouter(prefix="/insurance", tags=["Insurance"])

# Mock NPHIES insurance verification
MOCK_INSURERS = {
    "Bupa Arabia": {
        "networks": ["Dallah Hospital", "Saudi German Hospital", "King Faisal Specialist"],
        "co_payment": 10.0,
        "pre_auth_required": True,
    },
    "Tawuniya": {
        "networks": ["Mouwasat Hospital", "Al Habib Medical Group", "Saudi German Hospital"],
        "co_payment": 15.0,
        "pre_auth_required": False,
    },
    "MedGulf": {
        "networks": ["Dallah Hospital", "Mouwasat Hospital"],
        "co_payment": 20.0,
        "pre_auth_required": True,
    },
    "AXA Cooperative": {
        "networks": ["Saudi German Hospital", "King Faisal Specialist"],
        "co_payment": 10.0,
        "pre_auth_required": False,
    },
}


@router.post("/policies", response_model=InsurancePolicyResponse, status_code=201)
async def add_insurance_policy(
    policy_data: InsurancePolicyCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Add insurance policy to user profile."""
    policy = InsurancePolicy(
        user_id=current_user.id,
        **policy_data.model_dump()
    )
    db.add(policy)
    await db.flush()
    return InsurancePolicyResponse.model_validate(policy)


@router.get("/policies", response_model=List[InsurancePolicyResponse])
async def get_my_policies(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get all insurance policies for the current user."""
    result = await db.execute(
        select(InsurancePolicy).where(InsurancePolicy.user_id == current_user.id)
    )
    policies = result.scalars().all()
    return [InsurancePolicyResponse.model_validate(p) for p in policies]


@router.get("/verify/{policy_id}", response_model=InsuranceVerificationResponse)
async def verify_insurance(
    policy_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Verify insurance eligibility via NPHIES (mocked for demo).
    In production: calls NPHIES API for real-time verification.
    """
    result = await db.execute(
        select(InsurancePolicy).where(
            InsurancePolicy.id == policy_id,
            InsurancePolicy.user_id == current_user.id
        )
    )
    policy = result.scalar_one_or_none()
    if not policy:
        raise HTTPException(status_code=404, detail="Policy not found")

    insurer_data = MOCK_INSURERS.get(policy.insurer_name_en, {
        "networks": [],
        "co_payment": 20.0,
        "pre_auth_required": True,
    })

    # Update policy with NPHIES data
    policy.nphies_verified = True
    policy.network_providers = insurer_data["networks"]
    policy.coverage_details = {
        "co_payment_percentage": insurer_data["co_payment"],
        "pre_auth_required": insurer_data["pre_auth_required"]
    }
    await db.flush()

    return InsuranceVerificationResponse(
        is_eligible=True,
        policy_number=policy.policy_number,
        member_name=current_user.full_name_en,
        plan_name=policy.plan_name or "Comprehensive Health Plan",
        effective_date=policy.effective_date or "2024-01-01",
        expiry_date=policy.expiry_date or "2024-12-31",
        co_payment_percentage=insurer_data["co_payment"],
        network_hospitals=insurer_data["networks"],
        pre_auth_required=insurer_data["pre_auth_required"],
        message="Insurance verified successfully via NPHIES"
    )


@router.get("/networks", response_model=dict)
async def get_insurance_networks(
    current_user: User = Depends(get_current_user)
):
    """Get list of supported insurance companies and their networks."""
    return {
        "insurers": [
            {
                "name_en": name,
                "name_ar": {
                    "Bupa Arabia": "بوبا العربية",
                    "Tawuniya": "التعاونية",
                    "MedGulf": "ميدغلف",
                    "AXA Cooperative": "AXA التعاونية",
                }.get(name, name),
                "network_size": len(data["networks"]),
                "pre_auth_required": data["pre_auth_required"]
            }
            for name, data in MOCK_INSURERS.items()
        ]
    }
