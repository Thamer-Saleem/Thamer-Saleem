from fastapi import APIRouter, Depends
from pydantic import BaseModel
from typing import Optional
from app.models.user import User
from app.services.ai_engine import get_health_advice
from app.routers.auth import get_current_user

router = APIRouter(prefix="/chat", tags=["AI Health Chat"])


class ChatRequest(BaseModel):
    message: str
    language: str = "en"
    report_context: Optional[str] = None


class ChatResponse(BaseModel):
    response: str
    language: str
    disclaimer_en: str = "This is general health information only. Always consult a licensed physician for medical decisions."
    disclaimer_ar: str = "هذه معلومات صحية عامة فقط. استشر دائمًا طبيبًا مرخصًا للقرارات الطبية."


@router.post("/", response_model=ChatResponse)
async def health_chat(
    request: ChatRequest,
    current_user: User = Depends(get_current_user)
):
    """
    AI Health Education Chat powered by Claude claude-opus-4-6.
    Provides general health information and guidance based on lab results.
    """
    response_text = await get_health_advice(
        question=request.message,
        language=request.language,
        context=request.report_context
    )
    return ChatResponse(response=response_text, language=request.language)
