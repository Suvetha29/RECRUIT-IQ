from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from database import get_db
from models import Application, ApplicationStatus, Job, User
from routes.auth_deps import get_current_hr_user
from groq import Groq
from threading import Thread
from routes.email_service import send_offer_letter_email
import os, uuid, json, re
from datetime import datetime
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.units import inch
from fastapi.responses import FileResponse

router = APIRouter()

GROQ_API_KEY = os.getenv("GROQ_API_KEY")
client = Groq(api_key=GROQ_API_KEY)

UPLOAD_DIR = "uploads/recordings"
os.makedirs(UPLOAD_DIR, exist_ok=True)

OFFERS_DIR = "uploads/offer_letters"
os.makedirs(OFFERS_DIR, exist_ok=True)


# ── HR uploads recording → Whisper transcribes → LLaMA evaluates ──
@router.post("/api/evaluation/upload")
async def upload_and_evaluate(
    application_id: int = Form(...),
    recording: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_hr_user)
):
    application = db.query(Application).filter(
        Application.id == application_id
    ).first()
    if not application:
        raise HTTPException(status_code=404, detail="Application not found")

    # Save recording
    ext = recording.filename.split(".")[-1]
    filename = f"recording_{application_id}_{uuid.uuid4().hex[:8]}.{ext}"
    file_path = os.path.join(UPLOAD_DIR, filename)
    content = await recording.read()
    with open(file_path, "wb") as f:
        f.write(content)

    application.recording_path = file_path
    db.commit()

    # Transcribe with Groq Whisper
    try:
        with open(file_path, "rb") as audio_file:
            transcription = client.audio.transcriptions.create(
                file=(filename, audio_file.read()),
                model="whisper-large-v3",
            )
        transcript = transcription.text
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Transcription failed: {str(e)}")

    # Evaluate with LLaMA
    job = db.query(Job).filter(Job.id == application.job_id).first()
    candidate = db.query(User).filter(User.id == application.candidate_id).first()

    eval_prompt = f"""
You are an expert HR evaluator. Evaluate this interview transcript for the position of {job.title}.

Job Requirements: {job.requirements}

Interview Transcript:
{transcript}

Provide evaluation in this exact JSON format:
{{
    "score": <number 0-100>,
    "recommendation": "hire" or "reject",
    "strengths": "<key strengths shown>",
    "weaknesses": "<areas of improvement>",
    "summary": "<2-3 sentence summary>"
}}
Return only JSON, no extra text.
"""

    try:
        response = client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[
                {"role": "system", "content": "You are an HR evaluator. Return only valid JSON."},
                {"role": "user", "content": eval_prompt}
            ],
            temperature=0.1,
            max_tokens=500
        )
        raw = response.choices[0].message.content.strip()
        raw = re.sub(r"```json|```", "", raw).strip()
        evaluation = json.loads(raw)
    except Exception as e:
        evaluation = {
            "score": 50,
            "recommendation": "review",
            "strengths": "Could not evaluate automatically",
            "weaknesses": "Manual review required",
            "summary": "AI evaluation failed. Please review manually."
        }

    # Save to database
    application.transcript = transcript
    application.ai_score = evaluation.get("score", 50)
    application.ai_recommendation = evaluation.get("recommendation", "review")

    db.commit()

    return {
        "message": "Evaluation complete",
        "transcript": transcript,
        "ai_score": application.ai_score,
        "recommendation": application.ai_recommendation,
        "strengths": evaluation.get("strengths"),
        "weaknesses": evaluation.get("weaknesses"),
        "summary": evaluation.get("summary")
    }


# ── Generate Offer Letter PDF + Send Email ──
@router.post("/api/evaluation/offer-letter/{application_id}")
def generate_offer_letter(
    application_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_hr_user)
):
    from routes.notifications import create_notification

    application = db.query(Application).filter(
        Application.id == application_id
    ).first()
    if not application:
        raise HTTPException(status_code=404, detail="Application not found")

    job = db.query(Job).filter(Job.id == application.job_id).first()
    candidate = db.query(User).filter(User.id == application.candidate_id).first()

    # Generate PDF
    filename = f"offer_letter_{application_id}_{uuid.uuid4().hex[:6]}.pdf"
    filepath = os.path.join(OFFERS_DIR, filename)

    doc = SimpleDocTemplate(filepath, pagesize=A4)
    styles = getSampleStyleSheet()
    story = []

    # Title
    story.append(Paragraph(f"{job.company}", styles["Title"]))
    story.append(Spacer(1, 0.2 * inch))
    story.append(Paragraph("OFFER LETTER", styles["Heading1"]))
    story.append(Spacer(1, 0.3 * inch))

    # Date
    story.append(Paragraph(f"Date: {datetime.utcnow().strftime('%B %d, %Y')}", styles["Normal"]))
    story.append(Spacer(1, 0.2 * inch))

    # Candidate name
    story.append(Paragraph(f"Dear {candidate.full_name},", styles["Normal"]))
    story.append(Spacer(1, 0.2 * inch))

    # Body
    body = f"""
    We are pleased to offer you the position of <b>{job.title}</b> at <b>{job.company}</b>.
    After careful consideration of your application and interview performance, we believe you will be
    a valuable addition to our team.
    """
    story.append(Paragraph(body, styles["Normal"]))
    story.append(Spacer(1, 0.3 * inch))

    # Details table
    data = [
        ["Position", job.title],
        ["Company", job.company],
        ["Location", job.location],
        ["Job Type", job.job_type.value.replace("_", " ").title()],
        ["Salary Range", job.salary_range or "As per discussion"],
        ["Start Date", "Immediate / As agreed"],
    ]
    table = Table(data, colWidths=[2 * inch, 4 * inch])
    table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (0, -1), colors.HexColor("#0D9488")),
        ("TEXTCOLOR", (0, 0), (0, -1), colors.white),
        ("FONTNAME", (0, 0), (-1, -1), "Helvetica"),
        ("FONTSIZE", (0, 0), (-1, -1), 11),
        ("ROWBACKGROUNDS", (1, 0), (-1, -1), [colors.white, colors.HexColor("#F1F5F9")]),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#E2E8F0")),
        ("PADDING", (0, 0), (-1, -1), 8),
    ]))
    story.append(table)
    story.append(Spacer(1, 0.3 * inch))

    # Closing
    story.append(Paragraph("Please confirm your acceptance by replying to this email within 3 business days.", styles["Normal"]))
    story.append(Spacer(1, 0.4 * inch))
    story.append(Paragraph("We look forward to welcoming you to the team!", styles["Normal"]))
    story.append(Spacer(1, 0.5 * inch))
    story.append(Paragraph("Warm regards,", styles["Normal"]))
    story.append(Paragraph(f"<b>HR Team — {job.company}</b>", styles["Normal"]))

    doc.build(story)

    # Send offer letter email with PDF attachment
    try:
        if candidate and job:
            Thread(target=send_offer_letter_email, args=(
                candidate.email,
                candidate.full_name,
                job.title,
                job.company,
                filepath
            )).start()

            # In-app notification
            create_notification(
                db,
                candidate.id,
                "📄 Offer Letter Sent!",
                f"Your offer letter for {job.title} at {job.company} has been sent to your email. Please check your inbox."
            )
    except Exception as e:
        print(f"Offer letter email error: {e}")

    # Also return PDF for HR to download
    return FileResponse(
        filepath,
        media_type="application/pdf",
        filename=f"Offer_Letter_{candidate.full_name.replace(' ', '_')}.pdf"
    )