from pydantic import BaseModel
from typing import Optional
from datetime import datetime

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

class JobResponse(BaseModel):
    id: int
    title: str
    company: str
    location: str
    job_type: str
    experience_required: str
    salary_range: Optional[str]
    description: str
    requirements: str
    responsibilities: str
    status: str
    recruiter_id: int
    recruiter_name: str
    created_at: datetime
    
    class Config:
        from_attributes = True 