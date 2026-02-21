import os
import uuid
import shutil
from pathlib import Path
from fastapi import UploadFile, HTTPException

# Configure upload directory
UPLOAD_DIR = Path("uploads/resumes")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

ALLOWED_EXTENSIONS = {'.pdf', '.docx', '.doc'}

async def save_upload_file(upload_file: UploadFile, candidate_id: str) -> str:
    """Save uploaded file and return the file path"""
    
    # Validate file extension
    file_extension = os.path.splitext(upload_file.filename)[1].lower()
    if file_extension not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400, 
            detail=f"File type not allowed. Allowed types: {', '.join(ALLOWED_EXTENSIONS)}"
        )
    
    # Generate unique filename
    filename = f"{candidate_id}_{uuid.uuid4()}{file_extension}"
    file_path = UPLOAD_DIR / filename
    
    try:
        # Save file
        content = await upload_file.read()
        with open(file_path, "wb") as f:
            f.write(content)
        
        # Return relative path for database
        return f"resumes/{filename}"
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save file: {str(e)}")