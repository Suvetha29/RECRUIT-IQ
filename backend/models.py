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
    
    # Relationship
    jobs = relationship("Job", back_populates="recruiter")

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
    experience_required = Column(String, nullable=False)  # e.g., "2-4 years"
    salary_range = Column(String, nullable=True)  # e.g., "$80k - $100k"
    description = Column(Text, nullable=False)
    requirements = Column(Text, nullable=False)
    responsibilities = Column(Text, nullable=False)
    status = Column(SQLEnum(JobStatus), default=JobStatus.OPEN)
    
    # Foreign key to HR who posted the job
    recruiter_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationship
    recruiter = relationship("User", back_populates="jobs")