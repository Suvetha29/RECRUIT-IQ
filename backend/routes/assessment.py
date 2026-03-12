from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List
from database import get_db
from models import Assessment, AssessmentResult, Application, ApplicationStatus, Job, User
from routes.auth_deps import get_current_hr_user, get_current_candidate
from routes.email_service import send_assessment_assigned_email, send_assessment_result_email
from threading import Thread
from datetime import datetime

router = APIRouter()

class QuestionCreate(BaseModel):
    question: str
    options: List[str]
    correct_answer: int

class AssessmentCreate(BaseModel):
    job_id: int
    questions: List[QuestionCreate]
    time_limit: int = 20
    passing_score: float = 60.0

class AnswerSubmit(BaseModel):
    application_id: int
    answers: List[int]


# ── HR creates assessment ──
@router.post("/api/assessments/create")
def create_assessment(
    data: AssessmentCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_hr_user)
):
    from routes.notifications import create_notification

    job = db.query(Job).filter(
        Job.id == data.job_id,
        Job.recruiter_id == current_user.id
    ).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    existing = db.query(Assessment).filter(Assessment.job_id == data.job_id).first()
    if existing:
        existing.questions = [q.dict() for q in data.questions]
        existing.time_limit = data.time_limit
        existing.passing_score = data.passing_score
        db.commit()
        assessment_id = existing.id
    else:
        assessment = Assessment(
            job_id=data.job_id,
            questions=[q.dict() for q in data.questions],
            time_limit=data.time_limit,
            passing_score=data.passing_score
        )
        db.add(assessment)
        db.commit()
        db.refresh(assessment)
        assessment_id = assessment.id

    # Get all shortlisted candidates for this job
    shortlisted_apps = db.query(Application).filter(
        Application.job_id == data.job_id,
        Application.status == ApplicationStatus.SHORTLISTED
    ).all()

    for app in shortlisted_apps:
        candidate = db.query(User).filter(User.id == app.candidate_id).first()
        if candidate:
            # Send email
            Thread(target=send_assessment_assigned_email, args=(
                candidate.email,
                candidate.full_name,
                job.title,
                job.company,
                data.time_limit,
                data.passing_score
            )).start()

            # In-app notification
            create_notification(
                db,
                candidate.id,
                "📝 New Assessment Assigned",
                f"You have been assigned a skill assessment for {job.title} at {job.company}. Login to take the test."
            )

    return {"message": "Assessment saved!", "assessment_id": assessment_id}


# ── Candidate gets questions (without correct answers) ──
@router.get("/api/assessments/{job_id}")
def get_assessment(
    job_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_candidate)
):
    assessment = db.query(Assessment).filter(Assessment.job_id == job_id).first()
    if not assessment:
        raise HTTPException(status_code=404, detail="No assessment for this job")

    questions_safe = []
    for q in assessment.questions:
        questions_safe.append({
            "question": q["question"],
            "options": q["options"]
        })

    return {
        "assessment_id": assessment.id,
        "job_id": job_id,
        "time_limit": assessment.time_limit,
        "passing_score": assessment.passing_score,
        "total_questions": len(questions_safe),
        "questions": questions_safe
    }


# ── Candidate submits answers ──
@router.post("/api/assessments/submit")
def submit_assessment(
    data: AnswerSubmit,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_candidate)
):
    from routes.notifications import create_notification

    application = db.query(Application).filter(
        Application.id == data.application_id,
        Application.candidate_id == current_user.id
    ).first()
    if not application:
        raise HTTPException(status_code=404, detail="Application not found")

    # Check already submitted
    existing_result = db.query(AssessmentResult).filter(
        AssessmentResult.application_id == data.application_id
    ).first()
    if existing_result:
        raise HTTPException(status_code=400, detail="Assessment already submitted")

    assessment = db.query(Assessment).filter(
        Assessment.job_id == application.job_id
    ).first()
    if not assessment:
        raise HTTPException(status_code=404, detail="Assessment not found")

    # Calculate score
    correct = 0
    for i, answer in enumerate(data.answers):
        if i < len(assessment.questions):
            if answer == assessment.questions[i]["correct_answer"]:
                correct += 1

    score = (correct / len(assessment.questions)) * 100
    passed = score >= assessment.passing_score

    # Save result
    result = AssessmentResult(
        application_id=data.application_id,
        assessment_id=assessment.id,
        answers=data.answers,
        score=round(score, 2),
        passed=passed,
        completed_at=datetime.utcnow()
    )
    db.add(result)

    # Update application status
    if passed:
        application.status = ApplicationStatus.SHORTLISTED  # HR will manually schedule interview
    else:
        application.status = ApplicationStatus.REJECTED

    db.commit()
    db.refresh(result)

    # Get HR and candidate info
    job = db.query(Job).filter(Job.id == application.job_id).first()
    hr = db.query(User).filter(User.id == job.recruiter_id).first()
    candidate = db.query(User).filter(User.id == application.candidate_id).first()

    if hr and candidate and job:
        # Send email to HR
        Thread(target=send_assessment_result_email, args=(
            hr.email,
            hr.full_name,
            candidate.full_name,
            job.title,
            round(score, 2),
            passed
        )).start()

        # In-app notification for HR
        create_notification(
            db,
            hr.id,
            f"{'✅ Assessment Passed' if passed else '❌ Assessment Failed'}",
            f"{candidate.full_name} scored {round(score, 2)}% on the assessment for {job.title}."
        )

    return {
        "score": result.score,
        "passed": result.passed,
        "correct": correct,
        "total": len(assessment.questions),
        "message": "🎉 Passed! You will be contacted for interview." if passed else "❌ Not passed. Better luck next time."
    }


# ── HR checks assessment results ──
@router.get("/api/assessments/results/{application_id}")
def get_assessment_result(
    application_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_hr_user)
):
    result = db.query(AssessmentResult).filter(
        AssessmentResult.application_id == application_id
    ).first()
    if not result:
        return {"message": "No assessment taken yet"}
    return {
        "score": result.score,
        "passed": result.passed,
        "completed_at": result.completed_at.isoformat()
    }