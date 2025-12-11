from typing import Dict, List, Any
from app.models.student import StudentProfile
from app.models.scholarship import Scholarship

def check_eligibility(student: StudentProfile, scholarship: Scholarship) -> Dict[str, Any]:
    """
    Check if a student is eligible for a scholarship.
    Returns: {"eligible": bool, "reasons": List[str]}
    """
    reasons = []
    eligible = True

    # 1. Income Check
    if scholarship.max_family_income:
        if student.annual_family_income > scholarship.max_family_income:
            eligible = False
            reasons.append(f"Family income ({student.annual_family_income}) exceeds limit ({scholarship.max_family_income})")

    # 2. Percentage Check
    if scholarship.min_percentage:
        if student.previous_exam_percentage < scholarship.min_percentage:
            eligible = False
            reasons.append(f"Percentage ({student.previous_exam_percentage}%) is below minimum required ({scholarship.min_percentage}%)")

    # 3. Category Check
    if scholarship.allowed_categories:
        # Assuming allowed_categories is a list of strings stored as JSON
        if student.category not in scholarship.allowed_categories:
            eligible = False
            reasons.append(f"Category '{student.category}' is not eligible. Allowed: {', '.join(scholarship.allowed_categories)}")

    # 4. Department Check
    if scholarship.allowed_departments:
        if student.department not in scholarship.allowed_departments:
            eligible = False
            reasons.append(f"Department '{student.department}' is not eligible.")

    # 5. Year/Semester Check
    if scholarship.allowed_years:
        if student.current_year_or_semester not in scholarship.allowed_years:
            eligible = False
            reasons.append(f"Year/Semester '{student.current_year_or_semester}' is not eligible.")

    # 6. Government Job Check
    if not scholarship.govt_job_allowed:
        if student.parents_govt_job:
            eligible = False
            reasons.append("Students with parents in government jobs are not eligible.")

    return {
        "eligible": eligible,
        "reasons": reasons
    }
