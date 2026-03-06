from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class ProviderSlotResponse(BaseModel):
    id: str
    provider_id: str
    date: str
    start_time: str
    end_time: str
    is_available: bool
    appointment_type: str

    class Config:
        from_attributes = True


class ProviderResponse(BaseModel):
    id: str
    organization_name_en: str
    organization_name_ar: Optional[str]
    doctor_name_en: str
    doctor_name_ar: Optional[str]
    specialty_en: str
    specialty_ar: Optional[str]
    specialty_code: Optional[str]
    photo_url: Optional[str]
    rating: float
    review_count: int
    address_en: Optional[str]
    address_ar: Optional[str]
    city: Optional[str]
    latitude: Optional[float]
    longitude: Optional[float]
    phone: Optional[str]
    insurance_networks: Optional[List[str]]
    languages: Optional[List[str]]
    is_active: bool
    consultation_fee: Optional[float]
    available_slots: Optional[List[ProviderSlotResponse]] = []

    class Config:
        from_attributes = True


class ProviderSearchParams(BaseModel):
    specialty: Optional[str] = None
    insurance_network: Optional[str] = None
    city: Optional[str] = None
    language: Optional[str] = None
    date: Optional[str] = None
