"""
Mua'afah AI Clinical Intelligence Engine
Powered by Claude claude-opus-4-6 with adaptive thinking for medical analysis.
"""
import anthropic
import json
import re
from typing import Optional
from app.config import get_settings

settings = get_settings()

# Clinical pathway rules: biomarker -> (low_threshold, high_threshold, specialists, tests)
CLINICAL_RULES = {
    "glucose": {
        "normal_min": 70, "normal_max": 100,
        "borderline_max": 125,
        "unit": "mg/dL",
        "specialists_en": ["Endocrinologist", "Internal Medicine"],
        "specialists_ar": ["أخصائي الغدد الصماء", "طب الباطنة"],
        "tests_en": ["HbA1c", "Fasting Insulin", "Oral Glucose Tolerance Test"],
        "tests_ar": ["هيموغلوبين غليكوزيلاتد", "الأنسولين الصيامي", "اختبار تحمل الجلوكوز"],
        "pathway": "diabetes"
    },
    "hba1c": {
        "normal_min": 0, "normal_max": 5.6,
        "borderline_max": 6.4,
        "unit": "%",
        "specialists_en": ["Endocrinologist", "Ophthalmologist", "Cardiologist"],
        "specialists_ar": ["أخصائي الغدد الصماء", "طبيب عيون", "أخصائي قلب"],
        "tests_en": ["Fasting Blood Sugar", "Kidney Function Tests", "Lipid Profile"],
        "tests_ar": ["سكر الدم الصيامي", "وظائف الكلى", "دهون الدم"],
        "pathway": "diabetes"
    },
    "cholesterol": {
        "normal_min": 0, "normal_max": 200,
        "borderline_max": 239,
        "unit": "mg/dL",
        "specialists_en": ["Cardiologist", "Internal Medicine"],
        "specialists_ar": ["أخصائي قلب", "طب الباطنة"],
        "tests_en": ["LDL Cholesterol", "HDL Cholesterol", "Triglycerides", "ECG"],
        "tests_ar": ["الكولسترول الضار", "الكولسترول النافع", "ثلاثي الجليسريد", "تخطيط القلب"],
        "pathway": "cardiovascular"
    },
    "ldl": {
        "normal_min": 0, "normal_max": 100,
        "borderline_max": 159,
        "unit": "mg/dL",
        "specialists_en": ["Cardiologist"],
        "specialists_ar": ["أخصائي قلب"],
        "tests_en": ["Coronary CT Angiography", "Echo Cardiogram"],
        "tests_ar": ["أنجيوغرافي القلب بالأشعة المقطعية", "صدى القلب"],
        "pathway": "cardiovascular"
    },
    "hdl": {
        "normal_min": 40, "normal_max": 999,
        "borderline_max": None,
        "unit": "mg/dL",
        "specialists_en": ["Cardiologist"],
        "specialists_ar": ["أخصائي قلب"],
        "tests_en": ["Full Lipid Panel"],
        "tests_ar": ["تحليل الدهون الكامل"],
        "pathway": "cardiovascular"
    },
    "creatinine": {
        "normal_min": 0.6, "normal_max": 1.2,
        "borderline_max": 1.5,
        "unit": "mg/dL",
        "specialists_en": ["Nephrologist", "Internal Medicine"],
        "specialists_ar": ["أخصائي كلى", "طب الباطنة"],
        "tests_en": ["eGFR", "BUN", "Urine Analysis", "Kidney Ultrasound"],
        "tests_ar": ["معدل الترشيح الكبيبي", "نيتروجين اليوريا", "تحليل البول", "سونار الكلى"],
        "pathway": "renal"
    },
    "tsh": {
        "normal_min": 0.4, "normal_max": 4.0,
        "borderline_max": 5.0,
        "unit": "mIU/L",
        "specialists_en": ["Endocrinologist"],
        "specialists_ar": ["أخصائي الغدد الصماء"],
        "tests_en": ["Free T4", "Free T3", "Thyroid Ultrasound"],
        "tests_ar": ["الثيروكسين الحر", "ثلاثي يودو الثيرونين الحر", "سونار الغدة الدرقية"],
        "pathway": "thyroid"
    },
    "hemoglobin": {
        "normal_min": 12.0, "normal_max": 17.5,
        "borderline_max": None,
        "unit": "g/dL",
        "specialists_en": ["Hematologist", "Internal Medicine"],
        "specialists_ar": ["أخصائي أمراض الدم", "طب الباطنة"],
        "tests_en": ["Iron Studies", "B12", "Folate", "Bone Marrow Biopsy"],
        "tests_ar": ["دراسات الحديد", "فيتامين ب12", "حمض الفوليك", "خزعة نخاع العظم"],
        "pathway": "anemia"
    },
    "vitamin_d": {
        "normal_min": 30, "normal_max": 100,
        "borderline_max": None,
        "unit": "ng/mL",
        "specialists_en": ["Internal Medicine", "Endocrinologist"],
        "specialists_ar": ["طب الباطنة", "أخصائي الغدد الصماء"],
        "tests_en": ["Parathyroid Hormone", "Calcium", "Bone Density Scan"],
        "tests_ar": ["هرمون الغدة الجار درقية", "الكالسيوم", "قياس كثافة العظام"],
        "pathway": "vitamin_deficiency"
    },
    "alt": {
        "normal_min": 7, "normal_max": 56,
        "borderline_max": 80,
        "unit": "U/L",
        "specialists_en": ["Gastroenterologist", "Hepatologist"],
        "specialists_ar": ["أخصائي الجهاز الهضمي", "أخصائي الكبد"],
        "tests_en": ["AST", "Bilirubin", "Liver Ultrasound", "Hepatitis Panel"],
        "tests_ar": ["ناقلة الأسبارتات", "البيليروبين", "سونار الكبد", "اختبارات التهاب الكبد"],
        "pathway": "liver"
    },
}


def _find_biomarker_rule(name: str) -> Optional[dict]:
    """Match extracted biomarker name to clinical rule."""
    name_lower = name.lower().strip()
    for key, rule in CLINICAL_RULES.items():
        if key in name_lower or name_lower in key:
            return {**rule, "key": key}
    # Common aliases
    aliases = {
        "blood sugar": "glucose", "fbs": "glucose", "rbs": "glucose",
        "a1c": "hba1c", "glycated hemoglobin": "hba1c",
        "total cholesterol": "cholesterol",
        "serum creatinine": "creatinine",
        "thyroid stimulating": "tsh",
        "hgb": "hemoglobin", "hb": "hemoglobin",
        "vit d": "vitamin_d", "25-oh": "vitamin_d",
        "alanine": "alt", "sgpt": "alt",
    }
    for alias, key in aliases.items():
        if alias in name_lower:
            return {**CLINICAL_RULES[key], "key": key}
    return None


def _classify_result(value: float, rule: dict) -> str:
    """Classify result as normal, borderline, or abnormal."""
    normal_min = rule.get("normal_min", 0)
    normal_max = rule.get("normal_max", 999)
    borderline_max = rule.get("borderline_max")
    # Check if it's a low-is-bad case (like HDL or hemoglobin)
    if normal_min and value < normal_min:
        return "abnormal"
    if value <= normal_max:
        return "normal"
    if borderline_max and value <= borderline_max:
        return "borderline"
    return "abnormal"


async def analyze_lab_report(
    raw_text: str,
    patient_name: str,
    language: str = "en"
) -> dict:
    """
    Main AI Clinical Intelligence Engine.
    Uses Claude claude-opus-4-6 with adaptive thinking to analyze lab reports.
    Returns structured analysis with bilingual summaries and care recommendations.
    """
    client = anthropic.Anthropic(api_key=settings.ANTHROPIC_API_KEY)

    system_prompt = """You are Mua'afah's AI Clinical Intelligence Engine, a highly specialized medical AI
assistant operating under strict clinical governance in Saudi Arabia. Your role is to:

1. Extract all biomarkers, test results, and values from lab reports
2. Identify abnormal values based on standard clinical ranges
3. Generate plain-language explanations in BOTH English and Arabic
4. Recommend appropriate medical specialists and follow-up tests
5. Assess urgency level (routine, priority, urgent, emergency)

CRITICAL RULES:
- Always provide results in BOTH English (en) and Arabic (ar)
- Use simple, patient-friendly language
- Never provide specific diagnoses, only flag for clinical review
- Always recommend consulting a licensed physician
- Use standard KSA clinical reference ranges (aligned with international standards)
- For Arabic: use formal Modern Standard Arabic (Fus'ha) with medical terms

Output MUST be valid JSON matching this exact structure:
{
  "lab_name": "string or null",
  "report_date": "string or null",
  "summary_en": "Plain English summary of overall results",
  "summary_ar": "ملخص عربي سهل الفهم للنتائج",
  "overall_risk": "low|medium|high|critical",
  "requires_urgent_care": false,
  "results": [
    {
      "biomarker_en": "English name",
      "biomarker_ar": "الاسم بالعربي",
      "value": 5.6,
      "value_text": "string representation",
      "unit": "unit string",
      "normal_range_text": "normal range",
      "status": "normal|borderline|abnormal",
      "interpretation_en": "What this means in simple English",
      "interpretation_ar": "ما يعنيه هذا بالعربي البسيط"
    }
  ],
  "recommendations": [
    {
      "specialty_en": "Specialist type in English",
      "specialty_ar": "التخصص بالعربي",
      "reason_en": "Why this specialist is recommended",
      "reason_ar": "سبب التوصية بهذا الطبيب",
      "urgency": "routine|priority|urgent",
      "suggested_tests_en": ["test1", "test2"],
      "suggested_tests_ar": ["فحص1", "فحص2"]
    }
  ]
}"""

    user_message = f"""Please analyze the following lab report for patient: {patient_name}

LAB REPORT TEXT:
{raw_text}

Extract all available biomarkers, classify their status, and provide bilingual recommendations.
Return ONLY valid JSON with no additional text."""

    try:
        with client.messages.stream(
            model="claude-opus-4-6",
            max_tokens=4096,
            thinking={"type": "adaptive"},
            system=system_prompt,
            messages=[{"role": "user", "content": user_message}]
        ) as stream:
            final_message = stream.get_final_message()

        # Extract text content from response
        response_text = ""
        for block in final_message.content:
            if block.type == "text":
                response_text = block.text
                break

        # Parse JSON response
        json_match = re.search(r'\{.*\}', response_text, re.DOTALL)
        if json_match:
            analysis = json.loads(json_match.group())
        else:
            analysis = json.loads(response_text)

        return analysis

    except (json.JSONDecodeError, anthropic.APIError) as e:
        # Fallback: basic rule-based analysis if AI fails
        return _fallback_analysis(raw_text)


def _fallback_analysis(raw_text: str) -> dict:
    """Rule-based fallback if AI is unavailable."""
    results = []
    recommendations = []
    found_abnormal = False

    # Simple regex to extract values
    patterns = [
        r'(glucose|blood sugar|fbs)[:\s]+(\d+\.?\d*)\s*(mg/dl)?',
        r'(hba1c|a1c)[:\s]+(\d+\.?\d*)\s*(%)?',
        r'(cholesterol)[:\s]+(\d+\.?\d*)\s*(mg/dl)?',
        r'(creatinine)[:\s]+(\d+\.?\d*)\s*(mg/dl)?',
        r'(tsh)[:\s]+(\d+\.?\d*)\s*(miu/l)?',
        r'(hemoglobin|hgb|hb)[:\s]+(\d+\.?\d*)\s*(g/dl)?',
    ]

    text_lower = raw_text.lower()
    for pattern in patterns:
        match = re.search(pattern, text_lower)
        if match:
            name = match.group(1)
            value = float(match.group(2))
            rule = _find_biomarker_rule(name)
            if rule:
                status = _classify_result(value, rule)
                if status != "normal":
                    found_abnormal = True
                    for spec_en, spec_ar in zip(
                        rule["specialists_en"], rule["specialists_ar"]
                    ):
                        recommendations.append({
                            "specialty_en": spec_en,
                            "specialty_ar": spec_ar,
                            "reason_en": f"{name.title()} level requires medical review",
                            "reason_ar": f"مستوى {name} يتطلب مراجعة طبية",
                            "urgency": "priority" if status == "abnormal" else "routine",
                            "suggested_tests_en": rule.get("tests_en", [])[:2],
                            "suggested_tests_ar": rule.get("tests_ar", [])[:2]
                        })

                results.append({
                    "biomarker_en": name.title(),
                    "biomarker_ar": name,
                    "value": value,
                    "value_text": str(value),
                    "unit": rule.get("unit", ""),
                    "normal_range_text": f"{rule.get('normal_min')} - {rule.get('normal_max')} {rule.get('unit', '')}",
                    "status": status,
                    "interpretation_en": f"Your {name} level is {status}",
                    "interpretation_ar": f"مستوى {name} لديك {status}"
                })

    return {
        "lab_name": None,
        "report_date": None,
        "summary_en": "Your lab results have been reviewed. " + (
            "Some values require attention." if found_abnormal else "All values appear normal."
        ),
        "summary_ar": "تمت مراجعة نتائج تحاليلك. " + (
            "بعض القيم تحتاج إلى اهتمام." if found_abnormal else "جميع القيم تبدو طبيعية."
        ),
        "overall_risk": "medium" if found_abnormal else "low",
        "requires_urgent_care": False,
        "results": results,
        "recommendations": recommendations
    }


async def get_health_advice(
    question: str,
    language: str = "en",
    context: Optional[str] = None
) -> str:
    """
    AI Health Assistant for patient questions.
    Provides educational health information (NOT medical advice).
    """
    client = anthropic.Anthropic(api_key=settings.ANTHROPIC_API_KEY)

    lang_instruction = (
        "Respond in Arabic (العربية)" if language == "ar"
        else "Respond in English"
    )

    system_prompt = f"""You are Mua'afah Health Assistant, an AI health education tool
for patients in Saudi Arabia. {lang_instruction}.

IMPORTANT BOUNDARIES:
- Provide general health education only
- Never diagnose conditions
- Always recommend consulting a licensed physician for medical decisions
- Keep responses concise (max 200 words)
- Use simple, compassionate language
- For Arabic: use Modern Standard Arabic (Fus'ha)

If asked about specific medications, dosages, or treatment decisions,
redirect to "Please consult your doctor" / "يرجى استشارة طبيبك"."""

    messages = []
    if context:
        messages.append({"role": "user", "content": f"My lab context: {context}"})
        messages.append({"role": "assistant", "content": "I understand your context. How can I help you?"})
    messages.append({"role": "user", "content": question})

    response = client.messages.create(
        model="claude-opus-4-6",
        max_tokens=512,
        system=system_prompt,
        messages=messages
    )

    return response.content[0].text
