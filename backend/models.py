from sqlalchemy import Column, Integer, String, Enum as SQLEnum, Text, ForeignKey, DateTime, Float
from sqlalchemy.orm import relationship
from database import Base
import enum
from datetime import datetime


class UserRole(enum.Enum):
    HR = "hr"
    CANDIDATE = "candidate"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    full_name = Column(String, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(SQLEnum(UserRole), nullable=False)
    phone = Column(String, nullable=True)
    resume_url = Column(String, nullable=True)

    jobs = relationship("Job", back_populates="recruiter")
    applications = relationship("Application", back_populates="candidate")


class JobType(enum.Enum):
    FULL_TIME = "full_time"
    PART_TIME = "part_time"
    CONTRACT = "contract"
    INTERNSHIP = "internship"


class JobStatus(enum.Enum):
    OPEN = "open"
    CLOSED = "closed"


class Job(Base):
    __tablename__ = "jobs"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False, index=True)
    company = Column(String, nullable=False)
    location = Column(String, nullable=False)
    job_type = Column(SQLEnum(JobType), nullable=False)
    experience_required = Column(String, nullable=False)
    salary_range = Column(String, nullable=True)
    description = Column(Text, nullable=False)
    requirements = Column(Text, nullable=False)
    responsibilities = Column(Text, nullable=False)
    status = Column(SQLEnum(JobStatus), default=JobStatus.OPEN)
    recruiter_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    recruiter = relationship("User", back_populates="jobs")
    applications = relationship("Application", back_populates="job")


# ─────────────────────────────────────────────────────────────
#  APPLICATION STATUS
#  Tracks the candidate's stage in the hiring pipeline.
#
#  Flow:
#    PENDING → UNDER_REVIEW → SHORTLISTED → INTERVIEW → HIRED
#                                        ↘ REJECTED
# ─────────────────────────────────────────────────────────────
class ApplicationStatus(enum.Enum):
    PENDING      = "pending"       # Submitted, not yet reviewed
    UNDER_REVIEW = "under_review"  # HR is reviewing
    SHORTLISTED  = "shortlisted"   # Passed initial screening
    INTERVIEW    = "interview"     # Interview scheduled
    REJECTED     = "rejected"      # Not moving forward
    HIRED        = "hired"         # Offer accepted


# ─────────────────────────────────────────────────────────────
#  APPLICATIONS TABLE
#
#  One row = one candidate applying to one job.
#
#  candidate_id  → FK to users (the candidate)
#  job_id        → FK to jobs  (the job they applied to)
#  resume_path   → local path: uploads/resumes/<filename>
#  cover_letter  → optional text written by candidate
#  status        → current pipeline stage (ApplicationStatus)
#  ats_score     → AI match score 0–100
#  ats_feedback  → AI explanation (strengths, gaps)
#  applied_at    → when the application was submitted
#  updated_at    → when HR last changed the status
# ─────────────────────────────────────────────────────────────
class Application(Base):
    __tablename__ = "applications"

    id           = Column(Integer, primary_key=True, index=True)
    candidate_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    job_id       = Column(Integer, ForeignKey("jobs.id"),  nullable=False)
    resume_path  = Column(String,  nullable=False)
    cover_letter = Column(Text,    nullable=True)
    status       = Column(SQLEnum(ApplicationStatus), default=ApplicationStatus.PENDING)
    ats_score    = Column(Float,   nullable=True)
    ats_feedback = Column(Text,    nullable=True)
    applied_at   = Column(DateTime, default=datetime.utcnow)
    updated_at   = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    candidate = relationship("User", back_populates="applications")
    job       = relationship("Job",  back_populates="applications")
