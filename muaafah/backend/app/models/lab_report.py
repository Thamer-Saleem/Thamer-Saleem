from sqlalchemy import Column, String, DateTime, Float, ForeignKey, Text, Enum as SAEnum
from sqlalchemy.dialects.sqlite import JSON
from sqlalchemy.sql import func
import uuid
import enum
from app.database import Base


class ReportStatus(str, enum.Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    ANALYZED = "analyzed"
    ACTION_REQUIRED = "action_required"
    ERROR = "error"


class ResultStatus(str, enum.Enum):
    NORMAL = "normal"
    BORDERLINE = "borderline"
    ABNORMAL = "abnormal"


class LabReport(Base):
    __tablename__ = "lab_reports"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id"), nullable=False, index=True)
    file_name = Column(String, nullable=False)
    file_path = Column(String, nullable=True)
    file_type = Column(String, nullable=True)
    status = Column(SAEnum(ReportStatus), default=ReportStatus.PENDING)
    lab_name = Column(String, nullable=True)
    report_date = Column(String, nullable=True)
    raw_text = Column(Text, nullable=True)
    summary_en = Column(Text, nullable=True)
    summary_ar = Column(Text, nullable=True)
    recommendations = Column(JSON, default=list)
    ai_analysis = Column(JSON, default=dict)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    analyzed_at = Column(DateTime(timezone=True), nullable=True)


class LabResult(Base):
    __tablename__ = "lab_results"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    report_id = Column(String, ForeignKey("lab_reports.id"), nullable=False, index=True)
    biomarker_en = Column(String, nullable=False)
    biomarker_ar = Column(String, nullable=True)
    value = Column(Float, nullable=True)
    value_text = Column(String, nullable=True)
    unit = Column(String, nullable=True)
    normal_min = Column(Float, nullable=True)
    normal_max = Column(Float, nullable=True)
    normal_range_text = Column(String, nullable=True)
    status = Column(SAEnum(ResultStatus), default=ResultStatus.NORMAL)
    interpretation_en = Column(Text, nullable=True)
    interpretation_ar = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
