from sqlalchemy import Column, Integer, String, Enum as SQLEnum, Text, ForeignKey, DateTime, Float, Boolean, JSON
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
    assessment = relationship("Assessment", back_populates="job", uselist=False)


class ApplicationStatus(enum.Enum):
    PENDING      = "pending"
    UNDER_REVIEW = "under_review"
    SHORTLISTED  = "shortlisted"
    INTERVIEW    = "interview"
    ASSESSMENT   = "assessment"
    REJECTED     = "rejected"
    HIRED        = "hired"


class Application(Base):
    __tablename__ = "applications"

    id             = Column(Integer, primary_key=True, index=True)
    candidate_id   = Column(Integer, ForeignKey("users.id"), nullable=False)
    job_id         = Column(Integer, ForeignKey("jobs.id"),  nullable=False)
    resume_path    = Column(String,  nullable=False)
    cover_letter   = Column(Text,    nullable=True)
    status         = Column(SQLEnum(ApplicationStatus), default=ApplicationStatus.PENDING)
    ats_score      = Column(Float,   nullable=True)
    ats_feedback   = Column(Text,    nullable=True)

    # ── Interview fields ──
    interview_date  = Column(String,  nullable=True)
    interview_time  = Column(String,  nullable=True)
    interview_notes = Column(Text,    nullable=True)
    meet_link       = Column(String,  nullable=True)

    # ── AI Evaluation fields ──
    recording_path    = Column(String, nullable=True)
    transcript        = Column(Text,   nullable=True)
    ai_score          = Column(Float,  nullable=True)
    ai_recommendation = Column(Text,   nullable=True)

    applied_at  = Column(DateTime, default=datetime.utcnow)
    updated_at  = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    candidate         = relationship("User", back_populates="applications")
    job               = relationship("Job",  back_populates="applications")
    assessment_result = relationship("AssessmentResult", back_populates="application", uselist=False)


# ─────────────────────────────────────────────
# ASSESSMENT TABLE
# HR creates MCQ questions per job
# ─────────────────────────────────────────────
class Assessment(Base):
    __tablename__ = "assessments"

    id            = Column(Integer, primary_key=True, index=True)
    job_id        = Column(Integer, ForeignKey("jobs.id"), nullable=False, unique=True)
    questions     = Column(JSON, nullable=False)
    time_limit    = Column(Integer, default=20)   # minutes
    passing_score = Column(Float, default=60.0)   # percentage
    created_at    = Column(DateTime, default=datetime.utcnow)

    job     = relationship("Job", back_populates="assessment")
    results = relationship("AssessmentResult", back_populates="assessment")


# ─────────────────────────────────────────────
# ASSESSMENT RESULT TABLE
# Candidate's answers and score
# ─────────────────────────────────────────────
class AssessmentResult(Base):
    __tablename__ = "assessment_results"

    id             = Column(Integer, primary_key=True, index=True)
    application_id = Column(Integer, ForeignKey("applications.id"), nullable=False)
    assessment_id  = Column(Integer, ForeignKey("assessments.id"),  nullable=False)
    answers        = Column(JSON,    nullable=False)
    score          = Column(Float,   nullable=True)
    passed         = Column(Boolean, default=False)
    completed_at   = Column(DateTime, default=datetime.utcnow)

    application = relationship("Application", back_populates="assessment_result")
    assessment  = relationship("Assessment",  back_populates="results")

# ─────────────────────────────────────────────
# NOTIFICATION TABLE
# ─────────────────────────────────────────────
class Notification(Base):
    __tablename__ = "notifications"

    id         = Column(Integer, primary_key=True, index=True)
    user_id    = Column(Integer, ForeignKey("users.id"), nullable=False)
    title      = Column(String, nullable=False)
    message    = Column(Text, nullable=False)
    is_read    = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User") 