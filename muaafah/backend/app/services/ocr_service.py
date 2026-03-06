"""
OCR Service for extracting text from lab report images and PDFs.
Uses Pytesseract for images and pdfplumber for PDFs.
"""
import io
import base64
from pathlib import Path
from typing import Optional


async def extract_text_from_file(
    file_content: bytes,
    file_type: str
) -> str:
    """
    Extract text from uploaded lab report file.
    Supports PDF, JPG, PNG, HEIC formats.
    """
    file_type_lower = file_type.lower()

    if "pdf" in file_type_lower:
        return await _extract_from_pdf(file_content)
    else:
        return await _extract_from_image(file_content)


async def _extract_from_pdf(content: bytes) -> str:
    """Extract text from PDF using pdfplumber."""
    try:
        import pdfplumber
        text_parts = []
        with pdfplumber.open(io.BytesIO(content)) as pdf:
            for page in pdf.pages:
                page_text = page.extract_text()
                if page_text:
                    text_parts.append(page_text)
                # Also try table extraction for structured lab data
                tables = page.extract_tables()
                for table in tables:
                    for row in table:
                        if row:
                            row_text = " | ".join(str(cell) for cell in row if cell)
                            if row_text.strip():
                                text_parts.append(row_text)
        return "\n".join(text_parts)
    except ImportError:
        return "[PDF text extraction requires pdfplumber]"
    except Exception as e:
        return f"[PDF extraction error: {str(e)}]"


async def _extract_from_image(content: bytes) -> str:
    """Extract text from image using pytesseract (OCR)."""
    try:
        import pytesseract
        from PIL import Image

        image = Image.open(io.BytesIO(content))
        # Try Arabic + English OCR
        text_en = pytesseract.image_to_string(image, lang="eng")
        try:
            text_ar = pytesseract.image_to_string(image, lang="ara")
            return f"{text_en}\n{text_ar}".strip()
        except Exception:
            return text_en.strip()
    except ImportError:
        return "[OCR requires pytesseract and Pillow]"
    except Exception as e:
        return f"[Image OCR error: {str(e)}]"


def mock_lab_report_text() -> str:
    """Returns sample lab report text for demo/testing purposes."""
    return """
    LABORATORY REPORT
    Patient: John Doe | Date: 2024-12-15 | Lab: Al-Hammadi Hospital Lab

    COMPLETE METABOLIC PANEL
    Glucose (Fasting)     110 mg/dL     Normal: 70-100 mg/dL     *** HIGH ***
    HbA1c                  6.2 %         Normal: < 5.7 %           *** HIGH ***
    Creatinine             1.1 mg/dL     Normal: 0.6-1.2 mg/dL    Normal

    LIPID PROFILE
    Total Cholesterol      215 mg/dL     Normal: < 200 mg/dL       *** HIGH ***
    LDL Cholesterol        135 mg/dL     Normal: < 100 mg/dL       *** HIGH ***
    HDL Cholesterol         42 mg/dL     Normal: > 40 mg/dL        Normal
    Triglycerides          168 mg/dL     Normal: < 150 mg/dL       *** HIGH ***

    THYROID FUNCTION
    TSH                    4.8 mIU/L     Normal: 0.4-4.0 mIU/L    *** HIGH ***

    COMPLETE BLOOD COUNT
    Hemoglobin             13.2 g/dL     Normal: 12-17.5 g/dL     Normal
    WBC                    7.2 K/uL      Normal: 4.5-11 K/uL      Normal
    Platelets              245 K/uL      Normal: 150-400 K/uL     Normal

    VITAMINS & MINERALS
    Vitamin D (25-OH)      18 ng/mL      Normal: > 30 ng/mL       *** LOW ***

    LIVER FUNCTION
    ALT (SGPT)             65 U/L        Normal: 7-56 U/L          *** HIGH ***
    AST (SGOT)             45 U/L        Normal: 10-40 U/L         *** HIGH ***
    """
