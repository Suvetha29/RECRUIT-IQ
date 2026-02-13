from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import List, Optional
import os
import shutil
from datetime import datetime
import json

from database import get_db
from models import User, Job, Application, SavedResume, ApplicationStatus, UserRole
from auth import get_current_user, get_current_hr_user
from services.ats_scorer import ATSScorer
from utils.resume_parser import extract_text_from_resume

router = APIRouter(prefix="/api/applications", tags=["applications"])
scorer = ATSScorer()

# Create upload directory
UPLOAD_DIR = "uploads/resumes"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.post("/apply/{job_id}")
async def apply_to_job(
    job_id: int,
    resume: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Candidate applies to a job with resume"""
    
    # Check if user is candidate
    if current_user.role != UserRole.CANDIDATE:
        raise HTTPException(status_code=403, detail="Only candidates can apply")
    
    # Check if job exists and is open
    job = db.query(Job).filter(Job.id == job_id, Job.status == "open").first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found or not open")
    
    # Check if already applied
    existing = db.query(Application).filter(
        Application.job_id == job_id,
        Application.candidate_id == current_user.id
    ).first()
    
    if existing:
        raise HTTPException(status_code=400, detail="You have already applied to this job")
    
    # Validate file type
    file_extension = resume.filename.split('.')[-1].lower()
    if file_extension not in ['pdf', 'docx']:
        raise HTTPException(status_code=400, detail="Only PDF and DOCX files are allowed")
    
    # Check file size (limit to 5MB)
    file_size = 0
    contents = await resume.read()
    file_size = len(contents)
    if file_size > 5 * 1024 * 1024:  # 5MB
        raise HTTPException(status_code=400, detail="File size exceeds 5MB limit")
    
    # Reset file position after reading
    await resume.seek(0)
    
    # Save resume file
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"resume_{current_user.id}_{job_id}_{timestamp}.{file_extension}"
    file_path = os.path.join(UPLOAD_DIR, filename)
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(resume.file, buffer)
    
    # Extract text from resume
    resume_text = extract_text_from_resume(file_path)
    
    # Combine job description for ATS scoring
    job_description = f"{job.title} {job.description} {job.requirements} {job.responsibilities}"
    
    # Calculate ATS score
    ats_result = scorer.calculate_ats_score(resume_text, job_description)
    
    # Create application
    application = Application(
        job_id=job_id,
        candidate_id=current_user.id,
        resume_url=f"/uploads/resumes/{filename}",
        resume_text=resume_text[:5000],  # Store first 5000 chars
        ats_score=ats_result["ats_score"],
        skills_score=ats_result["skills_score"],
        experience_score=ats_result["experience_score"],
        education_score=ats_result["keyword_score"],
        matched_skills=ats_result["matched_skills"],
        missing_skills=ats_result["missing_skills"],
        recommendations=ats_result["recommendations"],
        status=ApplicationStatus.NEW,
        applied_date=datetime.utcnow()
    )
    
    db.add(application)
    db.commit()
    db.refresh(application)
    
    # Save resume record
    saved_resume = SavedResume(
        candidate_id=current_user.id,
        filename=filename,
        file_url=f"/uploads/resumes/{filename}"
    )
    db.add(saved_resume)
    db.commit()
    
    return {
        "message": "Application submitted successfully",
        "application_id": application.id,
        "ats_score": application.ats_score,
        "skills_score": application.skills_score,
        "matched_skills": application.matched_skills,
        "missing_skills": application.missing_skills,
        "recommendations": application.recommendations
    }

@router.get("/my-applications")
def get_my_applications(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Candidate views their applications"""
    
    applications = db.query(Application).filter(
        Application.candidate_id == current_user.id
    ).order_by(Application.applied_date.desc()).all()
    
    result = []
    for app in applications:
        job = db.query(Job).filter(Job.id == app.job_id).first()
        if job:
            result.append({
                "id": app.id,
                "job_title": job.title,
                "company": job.company,
                "location": job.location,
                "applied_date": app.applied_date.isoformat() if app.applied_date else None,
                "status": app.status.value,
                "ats_score": app.ats_score,
                "skills_score": app.skills_score,
                "matched_skills": app.matched_skills or [],
                "missing_skills": app.missing_skills or [],
                "recommendations": app.recommendations or [],
                "job_id": job.id
            })
    
    return result

@router.get("/job/{job_id}")
def get_job_applications(
    job_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_hr_user)
):
    """HR views all applications for a specific job"""
    
    # Check if job belongs to this HR
    job = db.query(Job).filter(
        Job.id == job_id,
        Job.recruiter_id == current_user.id
    ).first()
    
    if not job:
        raise HTTPException(status_code=404, detail="Job not found or you don't have permission")
    
    applications = db.query(Application).filter(
        Application.job_id == job_id
    ).order_by(Application.ats_score.desc()).all()
    
    result = []
    for app in applications:
        candidate = db.query(User).filter(User.id == app.candidate_id).first()
        if candidate:
            result.append({
                "id": app.id,
                "candidate_name": candidate.full_name,
                "candidate_email": candidate.email,
                "applied_date": app.applied_date.isoformat() if app.applied_date else None,
                "status": app.status.value,
                "ats_score": app.ats_score,
                "skills_score": app.skills_score,
                "experience_score": app.experience_score,
                "matched_skills": app.matched_skills or [],
                "missing_skills": app.missing_skills or [],
                "resume_url": app.resume_url
            })
    
    # Calculate average score
    avg_score = 0
    if result:
        avg_score = sum([a["ats_score"] for a in result]) / len(result)
    
    return {
        "job_title": job.title,
        "total_applications": len(result),
        "average_score": round(avg_score, 2),
        "applications": result
    }

@router.patch("/{application_id}/status")
def update_application_status(
    application_id: int,
    status: str = Form(...),
    notes: Optional[str] = Form(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_hr_user)
):
    """HR updates application status"""
    
    application = db.query(Application).filter(
        Application.id == application_id
    ).first()
    
    if not application:
        raise HTTPException(status_code=404, detail="Application not found")
    
    # Check if job belongs to this HR
    job = db.query(Job).filter(
        Job.id == application.job_id,
        Job.recruiter_id == current_user.id
    ).first()
    
    if not job:
        raise HTTPException(status_code=403, detail="You don't have permission")
    
    # Validate status
    valid_statuses = [s.value for s in ApplicationStatus]
    if status not in valid_statuses:
        raise HTTPException(status_code=400, detail=f"Invalid status. Must be one of: {valid_statuses}")
    
    # Update application
    application.status = ApplicationStatus(status)
    if notes:
        application.hr_notes = notes
    application.updated_at = datetime.utcnow()
    
    db.commit()
    
    return {"message": f"Application status updated to {status}"}

@router.get("/ats-analytics")
def get_ats_analytics(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_hr_user)
):
    """HR views ATS analytics across all their jobs"""
    
    # Get all jobs by this HR
    jobs = db.query(Job).filter(Job.recruiter_id == current_user.id).all()
    job_ids = [job.id for job in jobs]
    
    if not job_ids:
        return {
            "total_applications": 0,
            "average_score": 0,
            "score_distribution": {
                "90-100": 0, "80-89": 0, "70-79": 0, "60-69": 0, "below_60": 0
            },
            "status_distribution": {},
            "top_skills": []
        }
    
    # Get all applications for these jobs
    applications = db.query(Application).filter(
        Application.job_id.in_(job_ids)
    ).all()
    
    total_applications = len(applications)
    if total_applications == 0:
        return {
            "total_applications": 0,
            "average_score": 0,
            "score_distribution": {
                "90-100": 0, "80-89": 0, "70-79": 0, "60-69": 0, "below_60": 0
            },
            "status_distribution": {},
            "top_skills": []
        }
    
    # Score distribution
    score_dist = {
        "90-100": 0, "80-89": 0, "70-79": 0, "60-69": 0, "below_60": 0
    }
    
    for app in applications:
        score = app.ats_score
        if score >= 90:
            score_dist["90-100"] += 1
        elif score >= 80:
            score_dist["80-89"] += 1
        elif score >= 70:
            score_dist["70-79"] += 1
        elif score >= 60:
            score_dist["60-69"] += 1
        else:
            score_dist["below_60"] += 1
    
    # Status distribution
    status_dist = {}
    for app in applications:
        status = app.status.value
        status_dist[status] = status_dist.get(status, 0) + 1
    
    # Collect all matched skills
    all_skills = []
    for app in applications:
        if app.matched_skills:
            all_skills.extend(app.matched_skills)
    
    # Top skills (simple count)
    skill_count = {}
    for skill in all_skills:
        skill_count[skill] = skill_count.get(skill, 0) + 1
    
    # Sort and get top 10
    top_skills = sorted(skill_count.items(), key=lambda x: x[1], reverse=True)[:10]
    
    return {
        "total_applications": total_applications,
        "average_score": round(sum([a.ats_score for a in applications]) / total_applications, 2),
        "score_distribution": score_dist,
        "status_distribution": status_dist,
        "top_skills": [{"skill": s, "count": c} for s, c in top_skills]
    }