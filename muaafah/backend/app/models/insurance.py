from sqlalchemy import Column, String, DateTime, Boolean, ForeignKey
from sqlalchemy.dialects.sqlite import JSON
from sqlalchemy.sql import func
import uuid
from app.database import Base


class InsurancePolicy(Base):
    __tablename__ = "insurance_policies"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id"), nullable=False, index=True)
    insurer_name_en = Column(String, nullable=False)
    insurer_name_ar = Column(String, nullable=True)
    policy_number = Column(String, nullable=False)
    member_id = Column(String, nullable=True)
    group_number = Column(String, nullable=True)
    plan_name = Column(String, nullable=True)
    coverage_type = Column(String, nullable=True)
    network_providers = Column(JSON, default=list)
    coverage_details = Column(JSON, default=dict)
    effective_date = Column(String, nullable=True)
    expiry_date = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)
    nphies_verified = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
