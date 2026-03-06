from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime
from app.models.lab_report import ReportStatus, ResultStatus


class LabReportCreate(BaseModel):
    file_name: str
    file_type: Optional[str] = None


class LabResultResponse(BaseModel):
    id: str
    report_id: str
    biomarker_en: str
    biomarker_ar: Optional[str]
    value: Optional[float]
    value_text: Optional[str]
    unit: Optional[str]
    normal_min: Optional[float]
    normal_max: Optional[float]
    normal_range_text: Optional[str]
    status: ResultStatus
    interpretation_en: Optional[str]
    interpretation_ar: Optional[str]

    class Config:
        from_attributes = True


class LabReportResponse(BaseModel):
    id: str
    user_id: str
    file_name: str
    file_type: Optional[str]
    status: ReportStatus
    lab_name: Optional[str]
    report_date: Optional[str]
    summary_en: Optional[str]
    summary_ar: Optional[str]
    recommendations: Optional[List[Dict[str, Any]]]
    ai_analysis: Optional[Dict[str, Any]]
    results: Optional[List[LabResultResponse]] = []
    created_at: Optional[datetime]
    analyzed_at: Optional[datetime]

    class Config:
        from_attributes = True


class LabAnalysisResponse(BaseModel):
    report_id: str
    status: ReportStatus
    summary_en: str
    summary_ar: str
    results: List[LabResultResponse]
    recommendations: List[Dict[str, Any]]
    requires_urgent_care: bool
    overall_risk_level: str
