"""
Mua'afah (معافاة) - AI Healthcare Assistant
FastAPI Backend Application

Mua'afah means "good health" in Arabic. This platform bridges the critical gap
between lab result diagnosis and proactive healthcare scheduling in Saudi Arabia.
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
from app.database import init_db
from app.routers import auth, labs, providers, appointments, insurance, admin, chat
from app.config import get_settings

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialize database on startup."""
    await init_db()
    yield


app = FastAPI(
    title="Mua'afah API - معافاة",
    description="""
    ## AI-Powered Healthcare Navigation Platform for Saudi Arabia

    Mua'afah (معافاة) connects patients with healthcare providers by:
    - 📋 Analyzing lab reports using Claude claude-opus-4-6 AI
    - 🏥 Recommending specialists based on clinical pathways
    - 📅 Facilitating appointment booking with in-network providers
    - 🔒 Integrating with Nafath (national ID) and NPHIES (insurance)

    **Supports both Arabic 🇸🇦 and English 🇬🇧**
    """,
    version="1.0.0",
    contact={
        "name": "Mua'afah Technical Team",
        "email": "tech@muaafah.sa"
    },
    license_info={
        "name": "Private - KSA Healthcare Platform",
    },
    lifespan=lifespan,
)

# CORS for web frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:5173",
        "https://muaafah.sa",
        "https://app.muaafah.sa",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include all routers
app.include_router(auth.router, prefix="/api/v1")
app.include_router(labs.router, prefix="/api/v1")
app.include_router(providers.router, prefix="/api/v1")
app.include_router(appointments.router, prefix="/api/v1")
app.include_router(insurance.router, prefix="/api/v1")
app.include_router(admin.router, prefix="/api/v1")
app.include_router(chat.router, prefix="/api/v1")


@app.get("/", tags=["Health"])
async def root():
    return {
        "platform": "Mua'afah - معافاة",
        "tagline": "Your AI-Powered Health Navigator",
        "tagline_ar": "مساعدك الذكي للرعاية الصحية",
        "version": "1.0.0",
        "status": "operational",
        "docs": "/docs",
        "supported_languages": ["ar", "en"],
    }


@app.get("/health", tags=["Health"])
async def health_check():
    return {"status": "healthy", "service": "muaafah-api"}
