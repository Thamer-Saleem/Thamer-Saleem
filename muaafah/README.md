# Mua'afah (معافاة) — AI Healthcare Assistant

> **"معافاة"** means *good health* in Arabic. Mua'afah is an AI-powered healthcare navigation platform for Saudi Arabia that bridges the gap between lab result analysis and proactive healthcare scheduling.

---

## Overview

Mua'afah connects patients with healthcare providers by:
- 🤖 **AI Lab Analysis** — Claude claude-opus-4-6 analyzes uploaded lab reports and identifies abnormal values
- 🏥 **Smart Recommendations** — Clinical pathways suggest the right specialists and follow-up tests
- 📅 **Seamless Booking** — Directly book appointments with in-network providers
- 🔒 **Nafath Integration** — Saudi national identity verification (mocked)
- 💊 **NPHIES Insurance** — Real-time insurance eligibility verification (mocked)
- 🌐 **Bilingual** — Full Arabic (RTL) and English (LTR) support

---

## Architecture

```
muaafah/
├── backend/               # FastAPI Python backend
│   ├── app/
│   │   ├── main.py        # Application entry point
│   │   ├── models/        # SQLAlchemy ORM models
│   │   ├── schemas/       # Pydantic request/response models
│   │   ├── routers/       # API endpoints
│   │   │   ├── auth.py    # Authentication (JWT + Nafath mock)
│   │   │   ├── labs.py    # Lab report upload & AI analysis
│   │   │   ├── providers.py  # Provider search & slots
│   │   │   ├── appointments.py  # Booking management
│   │   │   ├── insurance.py  # NPHIES integration (mock)
│   │   │   ├── admin.py   # Admin portal APIs
│   │   │   └── chat.py    # AI health education chat
│   │   └── services/
│   │       ├── ai_engine.py  # Claude claude-opus-4-6 Clinical Intelligence Engine
│   │       ├── ocr_service.py  # Lab report OCR (Tesseract + pdfplumber)
│   │       └── auth_service.py  # JWT authentication
│   └── requirements.txt
│
└── frontend/              # React + TypeScript frontend
    ├── src/
    │   ├── contexts/      # Auth + Language (RTL/LTR) contexts
    │   ├── i18n/          # Arabic + English translations
    │   ├── pages/         # Patient, Provider, Admin portals
    │   └── utils/api.ts   # Axios API client
    └── package.json
```

---

## Quick Start

### Prerequisites
- Python 3.11+
- Node.js 20+
- Anthropic API Key

### Backend Setup

```bash
cd backend
cp .env.example .env
# Edit .env and add your ANTHROPIC_API_KEY

pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

The app will be available at `http://localhost:3000`

### Docker (Production)

```bash
ANTHROPIC_API_KEY=your-key docker-compose up --build
```

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/auth/register` | Register new user |
| POST | `/api/v1/auth/login` | Login (email/password) |
| POST | `/api/v1/auth/nafath` | Login via Nafath (mock) |
| POST | `/api/v1/labs/upload` | Upload lab report for AI analysis |
| GET  | `/api/v1/labs/` | Get user's lab reports |
| GET  | `/api/v1/labs/{id}/analysis` | Get full AI analysis |
| GET  | `/api/v1/providers/` | Search providers |
| POST | `/api/v1/appointments/` | Book appointment |
| POST | `/api/v1/chat/` | AI health education chat |
| GET  | `/api/v1/admin/dashboard` | Admin KPI dashboard |

Full interactive docs: `http://localhost:8000/docs`

---

## AI Clinical Intelligence Engine

The engine (`backend/app/services/ai_engine.py`) uses **Claude claude-opus-4-6** with adaptive thinking to:

1. **Extract** biomarkers from raw lab report text (OCR output)
2. **Classify** each result as Normal / Borderline / Abnormal
3. **Generate** bilingual (Arabic + English) summaries
4. **Map** abnormal results to clinical pathways → specialist recommendations
5. **Assess** urgency level (routine, priority, urgent)

### Supported Clinical Pathways (Phase 1)
- 🩸 **Diabetes** — Glucose, HbA1c → Endocrinologist
- ❤️ **Cardiovascular** — Cholesterol, LDL, HDL → Cardiologist
- 🫘 **Renal** — Creatinine, eGFR → Nephrologist
- 🦋 **Thyroid** — TSH, T3, T4 → Endocrinologist
- 🩺 **Anemia** — Hemoglobin, Iron → Hematologist
- 🌿 **Liver** — ALT, AST → Hepatologist/Gastroenterologist
- ☀️ **Vitamin Deficiency** — Vitamin D → Internal Medicine

### Example Interaction (Demo Mode)

```json
POST /api/v1/labs/upload?use_demo=true
→ Analyzes sample report with elevated glucose, cholesterol, TSH, Vitamin D deficiency

Response includes:
{
  "summary_en": "Your report shows several values requiring attention...",
  "summary_ar": "يُظهر تقريرك عدة قيم تحتاج إلى اهتمام...",
  "overall_risk": "medium",
  "recommendations": [
    {
      "specialty_en": "Endocrinologist",
      "specialty_ar": "أخصائي الغدد الصماء",
      "urgency": "priority",
      "suggested_tests_en": ["HbA1c", "Fasting Insulin"]
    }
  ]
}
```

---

## User Roles

| Role | Portal | Access |
|------|--------|--------|
| Patient | Main App | Lab upload, booking, insurance |
| Provider Admin | `/provider` | Referrals, slots, analytics |
| Insurer Admin | `/insurer` | Pre-auth, network management |
| System Admin | `/admin` | All portals + clinical rules |

---

## Language Support

- **English** 🇬🇧 — Left-to-right layout, Inter font
- **Arabic** 🇸🇦 — Right-to-left layout, Cairo/Tajawal font
- Seamless switching via the language toggle in navbar/login
- All AI responses include both `summary_en` and `summary_ar`

---

## Compliance & Security

- 🔒 JWT authentication with configurable expiry
- 🔐 Nafath national identity integration (mocked)
- 📜 PDPL (Personal Data Protection Law) compliant data handling
- 🛡️ SAMA Cybersecurity Framework aligned architecture
- 🔑 AES-256 at-rest encryption ready (cloud deployment)
- 📡 TLS 1.2+ in transit (handled at reverse proxy level)

---

## PRD Coverage Summary

| PRD Section | Status | Notes |
|-------------|--------|-------|
| PA-01: Nafath Auth | ✅ | Mocked - requires Nafath SDK for production |
| LR-01: Lab Upload | ✅ | PDF/JPG/PNG with OCR fallback |
| AI-01: Lab Analysis | ✅ | Claude claude-opus-4-6 with bilingual output |
| AI-02: Recommendations | ✅ | 7 clinical pathways |
| PB-01: Provider Search | ✅ | With demo data seeding |
| AN-01: Notifications | 📋 | Architecture ready, FCM not connected |
| PROV-01 to 06 | ✅ | Provider portal built |
| INS-01 to 05 | ✅ | Insurance portal with NPHIES mock |
| ADMIN-01 to 05 | ✅ | Full admin dashboard |
| NFR-01: Encryption | 📋 | Architecture ready |
| NFR-04: API <500ms | ✅ | Async FastAPI |
| INT-01: Nafath | ✅ (mock) | Ready for Nafath SDK |
| INT-03: NPHIES | ✅ (mock) | Ready for NPHIES APIs |

---

## Roadmap Alignment

- **Phase 1 (MVP)**: ✅ Delivered — Core patient journey, AI analysis, manual booking
- **Phase 2**: 🔲 NPHIES real integration, HIS connectivity, payment gateway
- **Phase 3**: 🔲 Expand to top 10 chronic diseases, advanced analytics

---

*Built with ❤️ for healthcare in Saudi Arabia | Powered by Claude AI*
