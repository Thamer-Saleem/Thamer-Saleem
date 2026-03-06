from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime


class InsurancePolicyCreate(BaseModel):
    insurer_name_en: str
    insurer_name_ar: Optional[str] = None
    policy_number: str
    member_id: Optional[str] = None
    group_number: Optional[str] = None
    plan_name: Optional[str] = None
    coverage_type: Optional[str] = None
    effective_date: Optional[str] = None
    expiry_date: Optional[str] = None


class InsurancePolicyResponse(BaseModel):
    id: str
    user_id: str
    insurer_name_en: str
    insurer_name_ar: Optional[str]
    policy_number: str
    member_id: Optional[str]
    plan_name: Optional[str]
    coverage_type: Optional[str]
    network_providers: Optional[List[str]]
    coverage_details: Optional[Dict[str, Any]]
    effective_date: Optional[str]
    expiry_date: Optional[str]
    is_active: bool
    nphies_verified: bool
    created_at: Optional[datetime]

    class Config:
        from_attributes = True


class InsuranceVerificationResponse(BaseModel):
    is_eligible: bool
    policy_number: str
    member_name: str
    plan_name: str
    effective_date: str
    expiry_date: str
    co_payment_percentage: float
    network_hospitals: List[str]
    pre_auth_required: bool
    message: str
