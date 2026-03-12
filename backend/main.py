from fastapi import FastAPI, Depends, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
from datetime import timedelta, datetime
from typing import Optional
from pydantic import BaseModel, EmailStr
import os, json, re, uuid
from dotenv import load_dotenv
from groq import Groq

from jose import jwt, JWTError
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import bcrypt

from routes.assessment import router as assessment_router
from routes.evaluation import router as evaluation_router
from routes.email_service import send_interview_email, send_shortlist_email, send_hired_email, send_rejected_email

from threading import Thread

from database import engine, get_db, Base
from models import User, UserRole, Job, JobStatus, JobType, Application, ApplicationStatus
from routes.notifications import router as notifications_router

load_dotenv()

GROQ_API_KEY = os.getenv("GROQ_API_KEY")
if not GROQ_API_KEY:
    raise ValueError("GROQ_API_KEY not found in .env file")

client = Groq(api_key=GROQ_API_KEY)

Base.metadata.create_all(bind=engine)

UPLOAD_DIR = "uploads/resumes"
os.makedirs(UPLOAD_DIR, exist_ok=True)

app = FastAPI(title="AI Recruitment Platform")

app.include_router(assessment_router)
app.include_router(evaluation_router)
app.include_router(notifications_router)

app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

SECRET_KEY = os.getenv("SECRET_KEY", "fallback-secret")
ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 30))


# ================= Pydantic Models =================

class UserRegister(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    role: UserRole
    phone: Optional[str] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str
    user: dict

class JobCreate(BaseModel):
    title: str
    company: str
    location: str
    job_type: str
    experience_required: str
    salary_range: Optional[str] = None
    description: str
    requirements: str
    responsibilities: str

class JobGenerateRequest(BaseModel):
    title: str
    company: Optional[str] = "our company"

class StatusUpdate(BaseModel):
    status: str
    interview_date: Optional[str] = None
    interview_time: Optional[str] = None
    interview_notes: Optional[str] = None


# ================= Auth Helpers =================

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode("utf-8"))

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

from routes.auth_deps import get_current_user, get_current_hr_user, get_current_candidate


# ================= Internal Utilities =================

def clean_json_string(s):
    result = []
    inside_string = False
    i = 0
    while i < len(s):
        c = s[i]
        if c == '"' and (i == 0 or s[i - 1] != '\\'):
            inside_string = not inside_string
            result.append(c)
        elif inside_string and c in ('\n', '\r', '\t'):
            result.append(' ')
        else:
            result.append(c)
        i += 1
    return ''.join(result)


def extract_text_from_pdf(file_path: str) -> str:
    text = ""
    try:
        import PyPDF2
        with open(file_path, 'rb') as f:
            reader = PyPDF2.PdfReader(f)
            for page in reader.pages:
                t = page.extract_text()
                if t:
                    text += t + "\n"
    except ImportError:
        print("PyPDF2 not installed.")
    except Exception as e:
        print(f"PDF extraction error: {e}")
    return text


def calculate_ats_score(resume_text: str, job: Job) -> dict:
    stop_words = {
        'i','me','my','we','our','you','your','he','him','his','she','her','it','its',
        'they','them','their','what','which','who','this','that','these','those','am',
        'is','are','was','were','be','been','being','have','has','had','do','does','did',
        'a','an','the','and','but','if','or','as','of','at','by','for','with','about',
        'into','through','to','from','in','out','on','off','then','here','there','when',
        'where','how','all','any','both','each','more','most','other','some','no','not',
        'only','same','so','than','too','very','can','will','just','should','now'
    }
    common_skills = [
        'python','java','javascript','react','angular','vue','node','express','django',
        'flask','spring','c++','c#','aws','azure','gcp','docker','kubernetes','sql',
        'mongodb','postgresql','mysql','redis','git','html','css','typescript','php',
        'ruby','swift','kotlin','machine learning','ai','data science','tensorflow',
        'pytorch','excel','powerpoint','agile','jira','linux','rest','api'
    ]

    def get_keywords(text):
        words = re.findall(r'\b[a-zA-Z]{3,}\b', text.lower())
        return set(w for w in words if w not in stop_words)

    def get_skills(text):
        t = text.lower()
        return set(s for s in common_skills if s in t)

    def get_experience(text):
        for p in [r'(\d+)\+?\s*years?\s*(?:of\s*)?experience', r'experience\s*(?:of\s*)?(\d+)\+?\s*years?']:
            m = re.findall(p, text.lower())
            if m:
                try: return int(m[0])
                except: pass
        return 0

    job_text = f"{job.title} {job.requirements} {job.responsibilities} {job.description} {job.experience_required}"

    resume_kw = get_keywords(resume_text)
    job_kw    = get_keywords(job_text)
    resume_sk = get_skills(resume_text)
    job_sk    = get_skills(job_text)

    matched_kw = resume_kw & job_kw
    matched_sk = resume_sk & job_sk
    missing_sk = job_sk - resume_sk

    kw_score  = (len(matched_kw) / max(len(job_kw), 1)) * 100
    sk_score  = (len(matched_sk) / max(len(job_sk), 1)) * 100 if job_sk else 50
    resume_exp = get_experience(resume_text)
    job_exp    = get_experience(job_text)
    exp_score  = min(100, (resume_exp / max(job_exp, 1)) * 100) if job_exp > 0 else 50

    overall = round(kw_score * 0.3 + sk_score * 0.5 + exp_score * 0.2, 2)

    recs = []
    if missing_sk:
        recs.append(f"Add these skills: {', '.join(list(missing_sk)[:5])}")
    if exp_score < 70:
        recs.append("Highlight your relevant experience more clearly")
    if sk_score < 50:
        recs.append("Tailor your resume to match the job requirements")

    feedback = (
        f"Skills Match: {round(sk_score, 1)}% | "
        f"Keyword Match: {round(kw_score, 1)}% | "
        f"Experience Match: {round(exp_score, 1)}% | "
        f"Matched Skills: {', '.join(matched_sk) if matched_sk else 'None'} | "
        f"Missing Skills: {', '.join(missing_sk) if missing_sk else 'None'} | "
        f"Tips: {'; '.join(recs) if recs else 'Good match!'}"
    )

    return {
        "ats_score": overall,
        "ats_feedback": feedback,
        "matched_skills": list(matched_sk),
        "missing_skills": list(missing_sk),
        "recommendations": recs,
    }


# ================= Root =================

@app.get("/")
def read_root():
    return {
        "status": "online",
        "service": "AI Recruitment Platform API",
        "groq_configured": bool(GROQ_API_KEY)
    }


# ================= Auth Routes =================

@app.post("/api/auth/register", response_model=Token)
def register(user_data: UserRegister, db: Session = Depends(get_db)):
    if db.query(User).filter(User.email == user_data.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")
    new_user = User(
        email=user_data.email,
        full_name=user_data.full_name,
        hashed_password=hash_password(user_data.password),
        role=user_data.role,
        phone=user_data.phone
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    token = create_access_token({"sub": new_user.email})
    return {
        "access_token": token, "token_type": "bearer",
        "user": {"id": new_user.id, "email": new_user.email,
                 "full_name": new_user.full_name, "role": new_user.role.value}
    }

@app.post("/api/auth/login", response_model=Token)
def login(user_data: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == user_data.email).first()
    if not user or not verify_password(user_data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    token = create_access_token({"sub": user.email})
    return {
        "access_token": token, "token_type": "bearer",
        "user": {"id": user.id, "email": user.email,
                 "full_name": user.full_name, "role": user.role.value}
    }


# ================= AI JOB GENERATION =================

@app.post("/api/jobs/generate")
def generate_job_content(
    request: JobGenerateRequest,
    current_user: User = Depends(get_current_hr_user)
):
    try:
        prompt = (
            f"Generate a job description for a {request.title} at {request.company}. "
            "Return only a JSON object with exactly these three keys: description, requirements, responsibilities. "
            "Use plain text only. No special characters. No line breaks inside values. Keep it concise."
        )
        response = client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[
                {
                    "role": "system",
                    "content": "You are a JSON generator. Output only a single valid JSON object. No markdown. No code blocks. No newlines inside string values. No special characters. Be concise."
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            temperature=0.1,
            max_tokens=500
        )
        raw = response.choices[0].message.content.strip()
        print("Raw AI response:", raw)

        raw = re.sub(r"```json|```", "", raw).strip()
        start = raw.find("{")
        end = raw.rfind("}") + 1
        if start == -1 or end == 0:
            raise ValueError("No JSON found in AI response")

        cleaned = clean_json_string(raw[start:end])
        parsed = json.loads(cleaned)
        return {
            "description":      parsed.get("description", ""),
            "requirements":     parsed.get("requirements", ""),
            "responsibilities": parsed.get("responsibilities", "")
        }

    except json.JSONDecodeError as e:
        print("JSON Error:", str(e))
        return {
            "description": f"We are looking for a talented {request.title} to join {request.company}.",
            "requirements": "Bachelor's degree in a relevant field. 2+ years of experience. Strong communication skills.",
            "responsibilities": "Collaborate with teams. Deliver quality work. Report progress to management."
        }
    except Exception as e:
        print("AI Error:", str(e))
        raise HTTPException(status_code=500, detail=str(e))


# ================= JOB ROUTES =================

@app.get("/api/jobs/")
def get_jobs(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user.role == UserRole.HR:
        jobs = db.query(Job).filter(Job.recruiter_id == current_user.id).order_by(Job.created_at.desc()).all()
    else:
        jobs = db.query(Job).filter(Job.status == JobStatus.OPEN).order_by(Job.created_at.desc()).all()

    result = []
    for job in jobs:
        recruiter = db.query(User).filter(User.id == job.recruiter_id).first()
        already_applied = False
        if current_user.role == UserRole.CANDIDATE:
            already_applied = db.query(Application).filter(
                Application.candidate_id == current_user.id,
                Application.job_id == job.id
            ).first() is not None

        result.append({
            "id": job.id, "title": job.title, "company": job.company,
            "location": job.location, "job_type": job.job_type.value,
            "experience_required": job.experience_required, "salary_range": job.salary_range,
            "description": job.description, "requirements": job.requirements,
            "responsibilities": job.responsibilities, "status": job.status.value,
            "created_at": job.created_at.isoformat() if job.created_at else None,
            "recruiter_name": recruiter.full_name if recruiter else "Unknown",
            "recruiter_id": job.recruiter_id,
            "already_applied": already_applied
        })
    return result


@app.post("/api/jobs/")
def create_job(job_data: JobCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_hr_user)):
    try:
        job_type_enum = JobType(job_data.job_type)
    except ValueError:
        raise HTTPException(status_code=400, detail=f"Invalid job type. Must be one of: {[jt.value for jt in JobType]}")
    try:
        new_job = Job(
            title=job_data.title, company=job_data.company, location=job_data.location,
            job_type=job_type_enum, experience_required=job_data.experience_required,
            salary_range=job_data.salary_range, description=job_data.description,
            requirements=job_data.requirements, responsibilities=job_data.responsibilities,
            status=JobStatus.OPEN, recruiter_id=current_user.id, created_at=datetime.utcnow()
        )
        db.add(new_job)
        db.commit()
        db.refresh(new_job)
        return {
            "message": "Job posted successfully",
            "job": {
                "id": new_job.id, "title": new_job.title, "company": new_job.company,
                "location": new_job.location, "job_type": new_job.job_type.value,
                "experience_required": new_job.experience_required, "salary_range": new_job.salary_range,
                "description": new_job.description, "requirements": new_job.requirements,
                "responsibilities": new_job.responsibilities, "status": new_job.status.value,
                "created_at": new_job.created_at.isoformat() if new_job.created_at else None,
                "recruiter_name": current_user.full_name, "recruiter_id": new_job.recruiter_id
            }
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to create job: {str(e)}")


@app.get("/api/jobs/{job_id}")
def get_job_detail(job_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    if current_user.role == UserRole.HR and job.recruiter_id != current_user.id:
        raise HTTPException(status_code=403, detail="Permission denied")
    if current_user.role == UserRole.CANDIDATE and job.status != JobStatus.OPEN:
        raise HTTPException(status_code=403, detail="Job not available")
    recruiter = db.query(User).filter(User.id == job.recruiter_id).first()
    return {
        "id": job.id, "title": job.title, "company": job.company,
        "location": job.location, "job_type": job.job_type.value,
        "experience_required": job.experience_required, "salary_range": job.salary_range,
        "description": job.description, "requirements": job.requirements,
        "responsibilities": job.responsibilities, "status": job.status.value,
        "created_at": job.created_at.isoformat() if job.created_at else None,
        "recruiter_name": recruiter.full_name if recruiter else "Unknown",
        "recruiter_id": job.recruiter_id
    }


# ================= ATS APPLICATION ROUTES =================

@app.post("/api/applications/apply")
async def apply_for_job(
    job_id: int = Form(...),
    cover_letter: Optional[str] = Form(None),
    resume: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_candidate)
):
    job = db.query(Job).filter(Job.id == job_id, Job.status == JobStatus.OPEN).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found or already closed")

    existing = db.query(Application).filter(
        Application.candidate_id == current_user.id,
        Application.job_id == job_id
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="You have already applied for this job")

    if not resume.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF resumes are accepted")

    filename  = f"{current_user.id}_{job_id}_{uuid.uuid4().hex[:8]}.pdf"
    file_path = os.path.join(UPLOAD_DIR, filename)
    content   = await resume.read()
    with open(file_path, "wb") as f:
        f.write(content)

    resume_text = extract_text_from_pdf(file_path)
    if not resume_text.strip():
        resume_text = f"Resume uploaded by {current_user.full_name}"

    ats_result = calculate_ats_score(resume_text, job)

    application = Application(
        candidate_id=current_user.id,
        job_id=job_id,
        resume_path=file_path,
        cover_letter=cover_letter,
        status=ApplicationStatus.PENDING,
        ats_score=ats_result["ats_score"],
        ats_feedback=ats_result["ats_feedback"],
        applied_at=datetime.utcnow()
    )
    db.add(application)
    db.commit()
    db.refresh(application)

    return {
        "message": "Application submitted successfully!",
        "application_id": application.id,
        "ats_score": application.ats_score,
        "ats_feedback": application.ats_feedback,
        "matched_skills": ats_result["matched_skills"],
        "missing_skills": ats_result["missing_skills"],
        "recommendations": ats_result["recommendations"],
        "status": application.status.value
    }


@app.get("/api/applications/my")
def get_my_applications(db: Session = Depends(get_db), current_user: User = Depends(get_current_candidate)):
    apps = db.query(Application).filter(
        Application.candidate_id == current_user.id
    ).order_by(Application.applied_at.desc()).all()

    result = []
    for app in apps:
        job = db.query(Job).filter(Job.id == app.job_id).first()
        result.append({
            "application_id":    app.id,
            "job_id":            app.job_id,
            "job_title":         job.title          if job else "Unknown",
            "company":           job.company         if job else "Unknown",
            "location":          job.location        if job else "Unknown",
            "job_type":          job.job_type.value  if job else "Unknown",
            "applied_at":        app.applied_at.isoformat() if app.applied_at else None,
            "status":            app.status.value,
            "ats_score":         app.ats_score,
            "ats_feedback":      app.ats_feedback,
            "interview_date":    app.interview_date,
            "interview_time":    app.interview_time,
            "meet_link":         app.meet_link,
            "ai_score":          app.ai_score,
            "ai_recommendation": app.ai_recommendation,
            "assessment_result": {
                "score":  app.assessment_result.score,
                "passed": app.assessment_result.passed
            } if app.assessment_result else None,
        })
    return result


@app.get("/api/applications/job/{job_id}")
def get_job_applicants(job_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_hr_user)):
    job = db.query(Job).filter(Job.id == job_id, Job.recruiter_id == current_user.id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found or access denied")

    apps = db.query(Application).filter(
        Application.job_id == job_id
    ).order_by(Application.ats_score.desc()).all()

    result = []
    for app in apps:
        candidate = db.query(User).filter(User.id == app.candidate_id).first()
        result.append({
            "application_id":    app.id,
            "candidate_id":      app.candidate_id,
            "candidate_name":    candidate.full_name if candidate else "Unknown",
            "candidate_email":   candidate.email     if candidate else "Unknown",
            "candidate_phone":   candidate.phone     if candidate else None,
            "applied_at":        app.applied_at.isoformat() if app.applied_at else None,
            "status":            app.status.value,
            "ats_score":         app.ats_score,
            "ats_feedback":      app.ats_feedback,
            "resume_url":        f"http://localhost:8000/{app.resume_path}",
            "cover_letter":      app.cover_letter,
            "interview_date":    app.interview_date,
            "interview_time":    app.interview_time,
            "meet_link":         app.meet_link,
            "ai_score":          app.ai_score,
            "ai_recommendation": app.ai_recommendation,
            "assessment_result": {
                "score":  app.assessment_result.score,
                "passed": app.assessment_result.passed
            } if app.assessment_result else None,
        })
    return result


@app.patch("/api/applications/{application_id}/status")
def update_application_status(
    application_id: int,
    status_data: StatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_hr_user)
):
    from routes.notifications import create_notification

    application = db.query(Application).filter(Application.id == application_id).first()
    if not application:
        raise HTTPException(status_code=404, detail="Application not found")

    job = db.query(Job).filter(
        Job.id == application.job_id,
        Job.recruiter_id == current_user.id
    ).first()
    if not job:
        raise HTTPException(status_code=403, detail="Permission denied")

    try:
        new_status = ApplicationStatus(status_data.status)
    except ValueError:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid status. Must be one of: {[s.value for s in ApplicationStatus]}"
        )

    if new_status == ApplicationStatus.INTERVIEW:
        if not status_data.interview_date or not status_data.interview_time:
            raise HTTPException(
                status_code=400,
                detail="interview_date and interview_time are required"
            )

    application.status = new_status
    application.updated_at = datetime.utcnow()

    # Generate Jitsi meet link when status is interview
    if new_status == ApplicationStatus.INTERVIEW:
        room = f"recruitiq-{application.job_id}-{application.candidate_id}-{uuid.uuid4().hex[:8]}"
        application.meet_link       = f"https://meet.jit.si/{room}"
        application.interview_date  = status_data.interview_date
        application.interview_time  = status_data.interview_time
        application.interview_notes = status_data.interview_notes

    db.commit()

    candidate = db.query(User).filter(User.id == application.candidate_id).first()

    if candidate:
        # Send emails
        if new_status == ApplicationStatus.SHORTLISTED:
            Thread(target=send_shortlist_email, args=(
                candidate.email, candidate.full_name, job.title, job.company
            )).start()

        elif new_status == ApplicationStatus.INTERVIEW:
            Thread(target=send_interview_email, args=(
                candidate.email, candidate.full_name, job.title, job.company,
                status_data.interview_date, status_data.interview_time,
                status_data.interview_notes or ""
            )).start()

        elif new_status == ApplicationStatus.HIRED:
            Thread(target=send_hired_email, args=(
                candidate.email, candidate.full_name, job.title, job.company
            )).start()

        elif new_status == ApplicationStatus.REJECTED:
            Thread(target=send_rejected_email, args=(
                candidate.email, candidate.full_name, job.title, job.company
            )).start()

        # In-app notifications
        if new_status == ApplicationStatus.SHORTLISTED:
            create_notification(
                db, candidate.id,
                "⭐ You've been Shortlisted!",
                f"Congratulations! You have been shortlisted for {job.title} at {job.company}."
            )
        elif new_status == ApplicationStatus.INTERVIEW:
            create_notification(
                db, candidate.id,
                "📅 Interview Scheduled!",
                f"Your interview for {job.title} at {job.company} is on {status_data.interview_date} at {status_data.interview_time}. Check your email for the Jitsi meet link."
            )
        elif new_status == ApplicationStatus.HIRED:
            create_notification(
                db, candidate.id,
                "🎉 Congratulations! You're Hired!",
                f"You have been selected for {job.title} at {job.company}. HR will contact you soon."
            )
        elif new_status == ApplicationStatus.REJECTED:
            create_notification(
                db, candidate.id,
                "❌ Application Update",
                f"Thank you for applying for {job.title} at {job.company}. Unfortunately you were not selected this time."
            )

    return {
        "message": f"Status updated to {new_status.value}",
        "status": new_status.value,
        "meet_link": application.meet_link if new_status == ApplicationStatus.INTERVIEW else None,
        "email_sent": candidate is not None and new_status in [ApplicationStatus.SHORTLISTED, ApplicationStatus.INTERVIEW]
    }