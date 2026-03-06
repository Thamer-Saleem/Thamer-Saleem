from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from typing import List, Optional
from app.database import get_db
from app.models.user import User
from app.models.provider import Provider, ProviderSlot
from app.schemas.provider import ProviderResponse, ProviderSlotResponse
from app.routers.auth import get_current_user

router = APIRouter(prefix="/providers", tags=["Providers"])

# Seed demo providers on startup
DEMO_PROVIDERS = [
    {
        "organization_name_en": "Dallah Hospital",
        "organization_name_ar": "مستشفى دلة",
        "doctor_name_en": "Dr. Ahmad Al-Rashidi",
        "doctor_name_ar": "د. أحمد الراشدي",
        "specialty_en": "Endocrinologist",
        "specialty_ar": "أخصائي الغدد الصماء",
        "specialty_code": "ENDO",
        "rating": 4.8, "review_count": 124,
        "address_en": "Al Nuzha District, Riyadh",
        "address_ar": "حي النزهة، الرياض",
        "city": "Riyadh",
        "latitude": 24.7136, "longitude": 46.6753,
        "phone": "+966-11-555-0101",
        "insurance_networks": ["Bupa", "Tawuniya", "MedGulf"],
        "languages": ["Arabic", "English"],
        "consultation_fee": 350.0,
        "photo_url": "https://api.dicebear.com/7.x/avataaars/svg?seed=ahmad"
    },
    {
        "organization_name_en": "Saudi German Hospital",
        "organization_name_ar": "المستشفى السعودي الألماني",
        "doctor_name_en": "Dr. Fatima Al-Zahrawi",
        "doctor_name_ar": "د. فاطمة الزهراوي",
        "specialty_en": "Cardiologist",
        "specialty_ar": "أخصائي قلب",
        "specialty_code": "CARD",
        "rating": 4.9, "review_count": 211,
        "address_en": "Al Hamra District, Riyadh",
        "address_ar": "حي الحمراء، الرياض",
        "city": "Riyadh",
        "latitude": 24.6877, "longitude": 46.7219,
        "phone": "+966-11-555-0202",
        "insurance_networks": ["Bupa", "Tawuniya", "AXA", "MedGulf"],
        "languages": ["Arabic", "English", "German"],
        "consultation_fee": 400.0,
        "photo_url": "https://api.dicebear.com/7.x/avataaars/svg?seed=fatima"
    },
    {
        "organization_name_en": "Mouwasat Hospital",
        "organization_name_ar": "مستشفى المواساة",
        "doctor_name_en": "Dr. Khalid Al-Otaibi",
        "doctor_name_ar": "د. خالد العتيبي",
        "specialty_en": "Nephrologist",
        "specialty_ar": "أخصائي كلى",
        "specialty_code": "NEPH",
        "rating": 4.6, "review_count": 89,
        "address_en": "Al Malaz District, Riyadh",
        "address_ar": "حي الملز، الرياض",
        "city": "Riyadh",
        "latitude": 24.6973, "longitude": 46.7280,
        "phone": "+966-11-555-0303",
        "insurance_networks": ["Tawuniya", "MedGulf"],
        "languages": ["Arabic"],
        "consultation_fee": 300.0,
        "photo_url": "https://api.dicebear.com/7.x/avataaars/svg?seed=khalid"
    },
    {
        "organization_name_en": "King Faisal Specialist Hospital",
        "organization_name_ar": "مستشفى الملك فيصل التخصصي",
        "doctor_name_en": "Dr. Sara Al-Ghamdi",
        "doctor_name_ar": "د. سارة الغامدي",
        "specialty_en": "Hepatologist",
        "specialty_ar": "أخصائي كبد",
        "specialty_code": "HEPA",
        "rating": 4.9, "review_count": 340,
        "address_en": "As Sulimaniyah, Riyadh",
        "address_ar": "السليمانية، الرياض",
        "city": "Riyadh",
        "latitude": 24.6899, "longitude": 46.6955,
        "phone": "+966-11-555-0404",
        "insurance_networks": ["Bupa", "Tawuniya", "AXA", "MedGulf", "SAICO"],
        "languages": ["Arabic", "English"],
        "consultation_fee": 500.0,
        "photo_url": "https://api.dicebear.com/7.x/avataaars/svg?seed=sara"
    },
    {
        "organization_name_en": "Al Habib Medical Group",
        "organization_name_ar": "مجموعة الحبيب الطبية",
        "doctor_name_en": "Dr. Omar Al-Shammari",
        "doctor_name_ar": "د. عمر الشمري",
        "specialty_en": "Endocrinologist",
        "specialty_ar": "أخصائي الغدد الصماء",
        "specialty_code": "ENDO",
        "rating": 4.7, "review_count": 156,
        "address_en": "Al Wurud District, Riyadh",
        "address_ar": "حي الورود، الرياض",
        "city": "Riyadh",
        "latitude": 24.7234, "longitude": 46.6644,
        "phone": "+966-11-555-0505",
        "insurance_networks": ["Bupa", "Tawuniya"],
        "languages": ["Arabic", "English"],
        "consultation_fee": 380.0,
        "photo_url": "https://api.dicebear.com/7.x/avataaars/svg?seed=omar"
    },
]

DEMO_SLOTS = [
    {"date": "2025-01-20", "start_time": "09:00", "end_time": "09:30"},
    {"date": "2025-01-20", "start_time": "10:00", "end_time": "10:30"},
    {"date": "2025-01-20", "start_time": "11:00", "end_time": "11:30"},
    {"date": "2025-01-21", "start_time": "09:00", "end_time": "09:30"},
    {"date": "2025-01-21", "start_time": "14:00", "end_time": "14:30"},
    {"date": "2025-01-22", "start_time": "10:00", "end_time": "10:30"},
    {"date": "2025-01-22", "start_time": "15:00", "end_time": "15:30"},
]


async def seed_demo_data(db: AsyncSession):
    """Seed database with demo providers and slots."""
    existing = await db.execute(select(Provider).limit(1))
    if existing.scalar_one_or_none():
        return

    for p_data in DEMO_PROVIDERS:
        provider = Provider(**p_data)
        db.add(provider)
        await db.flush()

        for slot_data in DEMO_SLOTS:
            slot = ProviderSlot(
                provider_id=provider.id,
                **slot_data,
                is_available=True,
                appointment_type="consultation"
            )
            db.add(slot)

    await db.commit()


@router.get("/", response_model=List[ProviderResponse])
async def search_providers(
    specialty: Optional[str] = Query(None, description="Filter by specialty"),
    insurance: Optional[str] = Query(None, description="Filter by insurance network"),
    city: Optional[str] = Query(None, description="Filter by city"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Search for healthcare providers with optional filters."""
    await seed_demo_data(db)

    query = select(Provider).where(Provider.is_active == True)

    if specialty:
        query = query.where(
            Provider.specialty_en.ilike(f"%{specialty}%") |
            Provider.specialty_ar.ilike(f"%{specialty}%") |
            Provider.specialty_code.ilike(f"%{specialty}%")
        )

    if city:
        query = query.where(Provider.city.ilike(f"%{city}%"))

    result = await db.execute(query)
    providers = result.scalars().all()

    # Filter by insurance in Python (JSON field)
    if insurance:
        providers = [
            p for p in providers
            if insurance.lower() in [n.lower() for n in (p.insurance_networks or [])]
        ]

    # Attach available slots for each provider
    provider_responses = []
    for p in providers:
        slots_result = await db.execute(
            select(ProviderSlot).where(
                ProviderSlot.provider_id == p.id,
                ProviderSlot.is_available == True
            ).limit(5)
        )
        slots = slots_result.scalars().all()
        p_response = ProviderResponse.model_validate(p)
        p_response.available_slots = [ProviderSlotResponse.model_validate(s) for s in slots]
        provider_responses.append(p_response)

    return provider_responses


@router.get("/{provider_id}", response_model=ProviderResponse)
async def get_provider(
    provider_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get provider details with available slots."""
    result = await db.execute(select(Provider).where(Provider.id == provider_id))
    provider = result.scalar_one_or_none()
    if not provider:
        raise HTTPException(status_code=404, detail="Provider not found")

    slots_result = await db.execute(
        select(ProviderSlot).where(
            ProviderSlot.provider_id == provider_id,
            ProviderSlot.is_available == True
        )
    )
    slots = slots_result.scalars().all()

    p_response = ProviderResponse.model_validate(provider)
    p_response.available_slots = [ProviderSlotResponse.model_validate(s) for s in slots]
    return p_response
