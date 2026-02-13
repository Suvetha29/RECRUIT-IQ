from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from datetime import timedelta, datetime
from typing import List, Optional
from pydantic import BaseModel, EmailStr

from database import engine, get_db, Base
from models import User, UserRole, Job, JobStatus, JobType

from groq import Groq

import os
from dotenv import load_dotenv
import json

# Load environment variables
load_dotenv()

# Configure Groq
GROQ_API_KEY = os.getenv("GROQ_API_KEY")

if not GROQ_API_KEY:
    raise ValueError("GROQ_API_KEY not found in .env file")

client = Groq(api_key=GROQ_API_KEY)

# Create tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="AI Recruitment Platform")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Auth Config
SECRET_KEY = os.getenv("SECRET_KEY", "fallback-secret")
ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 30))

from passlib.context import CryptContext
from jose import jwt, JWTError
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()

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

# ================= Auth Helpers =================

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
):
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        email = payload.get("sub")
        if email is None:
            raise HTTPException(status_code=401, detail="Invalid token")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")

    return user

def get_current_hr_user(current_user: User = Depends(get_current_user)):
    if current_user.role.value != "hr":
        raise HTTPException(status_code=403, detail="HR access required")
    return current_user

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
        hashed_password=get_password_hash(user_data.password),
        role=user_data.role,
        phone=user_data.phone
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    token = create_access_token({"sub": new_user.email})
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": new_user.id,
            "email": new_user.email,
            "full_name": new_user.full_name,
            "role": new_user.role.value
        }
    }

@app.post("/api/auth/login", response_model=Token)
def login(user_data: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == user_data.email).first()

    if not user or not verify_password(user_data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    token = create_access_token({"sub": user.email})
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "email": user.email,
            "full_name": user.full_name,
            "role": user.role.value
        }
    }

# ================= AI JOB GENERATION =================
# ⚠️⚠️⚠️ AI FEATURE - NOT TOUCHED ⚠️⚠️⚠️
@app.post("/api/jobs/generate")
def generate_job_content(
    request: JobGenerateRequest,
    current_user: User = Depends(get_current_hr_user)
):
    try:
        prompt = f"""
Generate a professional job description for a {request.title} position at {request.company}.

Return ONLY valid JSON in this format:

{{
  "description": "2-3 paragraphs",
  "requirements": "• Requirement 1\\n• Requirement 2",
  "responsibilities": "• Responsibility 1\\n• Responsibility 2"
}}
"""

        response = client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[
                {"role": "user", "content": prompt}
            ],
            temperature=0.3
        )

        raw = response.choices[0].message.content.strip()

        # Extract JSON safely
        start = raw.find("{")
        end = raw.rfind("}") + 1

        if start == -1 or end == -1:
            raise ValueError("Invalid JSON response from AI")

        clean_json = raw[start:end]

        return json.loads(clean_json)

    except Exception as e:
        print("AI Error:", str(e))
        raise HTTPException(status_code=500, detail=str(e))

# ================= FIXED JOB ROUTES =================

@app.get("/api/jobs/")
def get_jobs(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get jobs based on user role:
    - HR: sees only their posted jobs
    - Candidate: sees all OPEN jobs
    """
    # For HR: show their posted jobs only
    if current_user.role == UserRole.HR:
        jobs = db.query(Job).filter(Job.recruiter_id == current_user.id).order_by(Job.created_at.desc()).all()
    else:
        # For candidates: show all open jobs
        jobs = db.query(Job).filter(Job.status == JobStatus.OPEN).order_by(Job.created_at.desc()).all()

    result = []
    for job in jobs:
        # Get the recruiter info for display
        recruiter = db.query(User).filter(User.id == job.recruiter_id).first()
        job_dict = {
            "id": job.id,
            "title": job.title,
            "company": job.company,
            "location": job.location,
            "job_type": job.job_type.value,
            "experience_required": job.experience_required,
            "salary_range": job.salary_range,
            "description": job.description,
            "requirements": job.requirements,
            "responsibilities": job.responsibilities,
            "status": job.status.value,
            "created_at": job.created_at.isoformat() if job.created_at else None,
            "recruiter_name": recruiter.full_name if recruiter else "Unknown",
            "recruiter_id": job.recruiter_id
        }
        result.append(job_dict)

    return result

@app.post("/api/jobs/")
def create_job(
    job_data: JobCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_hr_user)
):
    """
    Create a new job posting
    """
    try:
        # Validate job_type
        try:
            job_type_enum = JobType(job_data.job_type)
        except ValueError:
            raise HTTPException(status_code=400, detail=f"Invalid job type. Must be one of: {[jt.value for jt in JobType]}")

        # Create new job with CORRECT field names
        new_job = Job(
            title=job_data.title,
            company=job_data.company,
            location=job_data.location,
            job_type=job_type_enum,
            experience_required=job_data.experience_required,
            salary_range=job_data.salary_range,
            description=job_data.description,
            requirements=job_data.requirements,
            responsibilities=job_data.responsibilities,
            status=JobStatus.OPEN,  # FIXED: Use OPEN instead of ACTIVE
            recruiter_id=current_user.id,  # FIXED: Use recruiter_id not posted_by
            created_at=datetime.utcnow()
        )

        db.add(new_job)
        db.commit()
        db.refresh(new_job)

        # Return the created job with full details
        return {
            "message": "Job posted successfully",
            "job": {
                "id": new_job.id,
                "title": new_job.title,
                "company": new_job.company,
                "location": new_job.location,
                "job_type": new_job.job_type.value,
                "experience_required": new_job.experience_required,
                "salary_range": new_job.salary_range,
                "description": new_job.description,
                "requirements": new_job.requirements,
                "responsibilities": new_job.responsibilities,
                "status": new_job.status.value,
                "created_at": new_job.created_at.isoformat() if new_job.created_at else None,
                "recruiter_name": current_user.full_name,
                "recruiter_id": new_job.recruiter_id
            }
        }
    except Exception as e:
        print(f"Error creating job: {str(e)}")
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to create job: {str(e)}")

# Optional: Add a job detail endpoint
@app.get("/api/jobs/{job_id}")
def get_job_detail(
    job_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get detailed information about a specific job"""
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    # Check permissions
    if current_user.role == UserRole.HR and job.recruiter_id != current_user.id:
        raise HTTPException(status_code=403, detail="You don't have permission to view this job")
    
    if current_user.role == UserRole.CANDIDATE and job.status != JobStatus.OPEN:
        raise HTTPException(status_code=403, detail="This job is not available")
    
    recruiter = db.query(User).filter(User.id == job.recruiter_id).first()
    
    return {
        "id": job.id,
        "title": job.title,
        "company": job.company,
        "location": job.location,
        "job_type": job.job_type.value,
        "experience_required": job.experience_required,
        "salary_range": job.salary_range,
        "description": job.description,
        "requirements": job.requirements,
        "responsibilities": job.responsibilities,
        "status": job.status.value,
        "created_at": job.created_at.isoformat() if job.created_at else None,
        "recruiter_name": recruiter.full_name if recruiter else "Unknown",
        "recruiter_id": job.recruiter_id
    } 