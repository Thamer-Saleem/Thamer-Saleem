import uuid
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List, Optional
from app.database import get_db
from app.models.user import User
from app.models.lab_report import LabReport, LabResult, ReportStatus, ResultStatus
from app.schemas.lab_report import LabReportResponse, LabResultResponse, LabAnalysisResponse
from app.services.ai_engine import analyze_lab_report
from app.services.ocr_service import extract_text_from_file, mock_lab_report_text
from app.routers.auth import get_current_user

router = APIRouter(prefix="/labs", tags=["Lab Reports"])

ALLOWED_TYPES = {"application/pdf", "image/jpeg", "image/jpg", "image/png", "image/heic"}
MAX_SIZE = 20 * 1024 * 1024  # 20MB


async def process_lab_report(
    report_id: str,
    file_content: bytes,
    file_type: str,
    patient_name: str,
    db_url: str
):
    """Background task to OCR and analyze lab report."""
    from app.database import AsyncSessionLocal
    async with AsyncSessionLocal() as db:
        result = await db.execute(select(LabReport).where(LabReport.id == report_id))
        report = result.scalar_one_or_none()
        if not report:
            return

        try:
            report.status = ReportStatus.PROCESSING
            await db.commit()

            # Extract text via OCR
            if file_content and len(file_content) > 0:
                raw_text = await extract_text_from_file(file_content, file_type)
            else:
                raw_text = mock_lab_report_text()  # Demo fallback

            report.raw_text = raw_text

            # AI Analysis via Claude
            analysis = await analyze_lab_report(raw_text, patient_name)

            # Update report
            report.lab_name = analysis.get("lab_name")
            report.report_date = analysis.get("report_date")
            report.summary_en = analysis.get("summary_en")
            report.summary_ar = analysis.get("summary_ar")
            report.recommendations = analysis.get("recommendations", [])
            report.ai_analysis = {
                "overall_risk": analysis.get("overall_risk", "low"),
                "requires_urgent_care": analysis.get("requires_urgent_care", False),
            }

            has_abnormal = any(
                r.get("status") in ["abnormal", "borderline"]
                for r in analysis.get("results", [])
            )
            report.status = ReportStatus.ACTION_REQUIRED if has_abnormal else ReportStatus.ANALYZED
            report.analyzed_at = datetime.utcnow()

            # Save individual results
            for result_data in analysis.get("results", []):
                lab_result = LabResult(
                    report_id=report.id,
                    biomarker_en=result_data.get("biomarker_en", ""),
                    biomarker_ar=result_data.get("biomarker_ar"),
                    value=result_data.get("value"),
                    value_text=result_data.get("value_text"),
                    unit=result_data.get("unit"),
                    normal_range_text=result_data.get("normal_range_text"),
                    status=ResultStatus(result_data.get("status", "normal")),
                    interpretation_en=result_data.get("interpretation_en"),
                    interpretation_ar=result_data.get("interpretation_ar"),
                )
                db.add(lab_result)

            await db.commit()

        except Exception as e:
            report.status = ReportStatus.ERROR
            await db.commit()


@router.post("/upload", response_model=LabReportResponse, status_code=201)
async def upload_lab_report(
    background_tasks: BackgroundTasks,
    file: Optional[UploadFile] = File(None),
    use_demo: bool = False,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Upload a lab report for AI analysis.
    Supports PDF, JPG, PNG, HEIC. Set use_demo=true to use sample data.
    """
    file_content = b""
    file_name = "demo_report.pdf"
    file_type = "application/pdf"

    if file and not use_demo:
        if file.content_type not in ALLOWED_TYPES:
            raise HTTPException(
                status_code=400,
                detail=f"Unsupported file type. Allowed: PDF, JPG, PNG, HEIC"
            )
        file_content = await file.read()
        if len(file_content) > MAX_SIZE:
            raise HTTPException(status_code=400, detail="File too large (max 20MB)")
        file_name = file.filename
        file_type = file.content_type

    report = LabReport(
        user_id=current_user.id,
        file_name=file_name,
        file_type=file_type,
        status=ReportStatus.PENDING,
    )
    db.add(report)
    await db.flush()

    patient_name = current_user.full_name_en
    background_tasks.add_task(
        process_lab_report,
        report.id,
        file_content,
        file_type,
        patient_name,
        ""
    )

    return LabReportResponse.model_validate(report)


@router.get("/", response_model=List[LabReportResponse])
async def get_my_reports(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get all lab reports for the current user."""
    result = await db.execute(
        select(LabReport)
        .where(LabReport.user_id == current_user.id)
        .order_by(LabReport.created_at.desc())
    )
    reports = result.scalars().all()
    return [LabReportResponse.model_validate(r) for r in reports]


@router.get("/{report_id}", response_model=LabReportResponse)
async def get_report(
    report_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get a specific lab report with all results."""
    result = await db.execute(
        select(LabReport).where(
            LabReport.id == report_id,
            LabReport.user_id == current_user.id
        )
    )
    report = result.scalar_one_or_none()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")

    # Get results
    results_query = await db.execute(
        select(LabResult).where(LabResult.report_id == report_id)
    )
    lab_results = results_query.scalars().all()

    report_data = LabReportResponse.model_validate(report)
    report_data.results = [LabResultResponse.model_validate(r) for r in lab_results]
    return report_data


@router.get("/{report_id}/analysis", response_model=LabAnalysisResponse)
async def get_analysis(
    report_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get the full AI analysis for a lab report."""
    result = await db.execute(
        select(LabReport).where(
            LabReport.id == report_id,
            LabReport.user_id == current_user.id
        )
    )
    report = result.scalar_one_or_none()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")

    if report.status == ReportStatus.PENDING or report.status == ReportStatus.PROCESSING:
        raise HTTPException(status_code=202, detail="Analysis still in progress")

    results_query = await db.execute(
        select(LabResult).where(LabResult.report_id == report_id)
    )
    lab_results = results_query.scalars().all()

    ai_data = report.ai_analysis or {}
    return LabAnalysisResponse(
        report_id=report.id,
        status=report.status,
        summary_en=report.summary_en or "Analysis complete.",
        summary_ar=report.summary_ar or "اكتمل التحليل.",
        results=[LabResultResponse.model_validate(r) for r in lab_results],
        recommendations=report.recommendations or [],
        requires_urgent_care=ai_data.get("requires_urgent_care", False),
        overall_risk_level=ai_data.get("overall_risk", "low"),
    )
