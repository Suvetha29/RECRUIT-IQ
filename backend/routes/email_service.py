import smtplib
import os
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.base import MIMEBase
from email import encoders
from dotenv import load_dotenv


def _send_email(to_email: str, subject: str, html_body: str):
    """Internal helper to send email via SMTP."""
    load_dotenv(override=True)
    smtp_host     = os.getenv("SMTP_HOST", "smtp.gmail.com")
    smtp_port     = int(os.getenv("SMTP_PORT", 587))
    smtp_user     = os.getenv("SMTP_USER")
    smtp_password = os.getenv("SMTP_PASSWORD")

    if not smtp_user or not smtp_password:
        print("❌ SMTP_USER or SMTP_PASSWORD is not set in .env")
        return

    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"]    = smtp_user
        msg["To"]      = to_email
        msg.attach(MIMEText(html_body, "html"))

        with smtplib.SMTP(smtp_host, smtp_port, timeout=10) as server:
            server.ehlo()
            server.starttls()
            server.ehlo()
            server.login(smtp_user, smtp_password)
            server.sendmail(smtp_user, to_email, msg.as_string())

        print(f"✅ Email sent to {to_email}")

    except smtplib.SMTPAuthenticationError:
        print(f"❌ Authentication failed. Check your Gmail App Password in .env")
    except smtplib.SMTPConnectError:
        print(f"❌ Could not connect to {smtp_host}:{smtp_port}")
    except Exception as e:
        print(f"❌ Failed to send email to {to_email}: {e}")


def send_shortlist_email(candidate_email: str, candidate_name: str, job_title: str, company: str):
    subject = f"🎉 You've been Shortlisted! – {job_title} at {company}"
    html = f"""
    <html>
    <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea, #764ba2); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0;">🎉 Congratulations!</h1>
        </div>
        <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 12px 12px; border: 1px solid #e0e0e0;">
            <p style="font-size: 16px;">Dear <strong>{candidate_name}</strong>,</p>
            <p>You have been <strong style="color: #28a745;">shortlisted</strong> for <strong>{job_title}</strong> at <strong>{company}</strong>.</p>
            <p style="color: #888; font-size: 13px;">Best regards,<br><strong>HR Team – {company}</strong></p>
        </div>
    </body>
    </html>
    """
    _send_email(candidate_email, subject, html)


def send_interview_email(
    candidate_email: str,
    candidate_name: str,
    job_title: str,
    company: str,
    interview_date: str,
    interview_time: str,
    interview_notes: str = ""
):
    subject = f"📅 Interview Scheduled – {job_title} at {company}"
    html = f"""
    <html>
    <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #f093fb, #f5576c); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0;">📅 Interview Scheduled</h1>
        </div>
        <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 12px 12px; border: 1px solid #e0e0e0;">
            <p style="font-size: 16px;">Dear <strong>{candidate_name}</strong>,</p>
            <p>You are invited for an interview for <strong>{job_title}</strong> at <strong>{company}</strong>.</p>
            <div style="background: white; border-radius: 8px; padding: 20px; margin: 20px 0; border: 1px solid #e0e0e0;">
                <p>📅 <strong>Date:</strong> {interview_date}</p>
                <p>⏰ <strong>Time:</strong> {interview_time}</p>
                {f'<p>📝 <strong>Notes:</strong> {interview_notes}</p>' if interview_notes else ''}
            </div>
            <p style="color: #888; font-size: 13px;">Best regards,<br><strong>HR Team – {company}</strong></p>
        </div>
    </body>
    </html>
    """
    _send_email(candidate_email, subject, html)


def send_assessment_assigned_email(
    candidate_email: str,
    candidate_name: str,
    job_title: str,
    company: str,
    time_limit: int,
    passing_score: float
):
    subject = f"📝 Skill Assessment Assigned — {job_title} at {company}"
    html = f"""
    <html>
    <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #0D9488, #0369a1); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0;">📝 Assessment Assigned</h1>
        </div>
        <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 12px 12px; border: 1px solid #e0e0e0;">
            <p style="font-size: 16px;">Dear <strong>{candidate_name}</strong>,</p>
            <p>You have been assigned a <strong>Skill Assessment</strong> for <strong>{job_title}</strong> at <strong>{company}</strong>.</p>
            <div style="background: #F0FDF4; border-radius: 8px; padding: 20px; margin: 20px 0;">
                <p>⏱ <strong>Time Limit:</strong> {time_limit} minutes</p>
                <p>🎯 <strong>Passing Score:</strong> {passing_score}%</p>
                <p>📌 Login to your account and click "Take Assessment" to begin.</p>
            </div>
            <div style="background: #FEF9C3; border-radius: 8px; padding: 16px; margin: 20px 0;">
                <p style="margin: 0; color: #854D0E;">⚠️ Once started, the timer cannot be paused!</p>
            </div>
            <p>Good luck! 🍀</p>
            <p style="color: #888; font-size: 13px;">— HR Team, {company}</p>
        </div>
    </body>
    </html>
    """
    _send_email(candidate_email, subject, html)


def send_assessment_result_email(
    hr_email: str,
    hr_name: str,
    candidate_name: str,
    job_title: str,
    score: float,
    passed: bool
):
    subject = f"{'✅ Passed' if passed else '❌ Failed'} — {candidate_name} completed assessment for {job_title}"
    color = "#22C55E" if passed else "#EF4444"
    status = "PASSED ✅" if passed else "FAILED ❌"
    html = f"""
    <html>
    <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: {color}; padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0;">Assessment Result</h1>
        </div>
        <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 12px 12px; border: 1px solid #e0e0e0;">
            <p style="font-size: 16px;">Dear <strong>{hr_name}</strong>,</p>
            <p><strong>{candidate_name}</strong> has completed the assessment for <strong>{job_title}</strong>.</p>
            <div style="background: white; border-radius: 8px; padding: 20px; margin: 20px 0; text-align: center;">
                <h2 style="color: {color}; font-size: 48px; margin: 0;">{score}%</h2>
                <p style="font-size: 20px; font-weight: bold; color: {color};">{status}</p>
            </div>
            <p>Login to your HR dashboard to view full details.</p>
            <p style="color: #888; font-size: 13px;">— RECRUIT-IQ System</p>
        </div>
    </body>
    </html>
    """
    _send_email(hr_email, subject, html)


def send_hired_email(candidate_email: str, candidate_name: str, job_title: str, company: str):
    subject = f"🎉 Congratulations! You're Hired — {job_title} at {company}"
    html = f"""
    <html>
    <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #22C55E, #16A34A); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0;">🎉 You're Hired!</h1>
        </div>
        <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 12px 12px; border: 1px solid #e0e0e0;">
            <p style="font-size: 16px;">Dear <strong>{candidate_name}</strong>,</p>
            <p>We are thrilled to inform you that you have been <strong style="color: #16A34A;">selected</strong> for the position of <strong>{job_title}</strong> at <strong>{company}</strong>.</p>
            <div style="background: #F0FDF4; border-radius: 8px; padding: 20px; margin: 20px 0;">
                <p style="margin: 0;">Our HR team will contact you shortly with the onboarding details and next steps.</p>
            </div>
            <p>Welcome to the team! 🎊</p>
            <p style="color: #888; font-size: 13px;">Best regards,<br><strong>HR Team – {company}</strong></p>
        </div>
    </body>
    </html>
    """
    _send_email(candidate_email, subject, html)


def send_rejected_email(candidate_email: str, candidate_name: str, job_title: str, company: str):
    subject = f"Application Update — {job_title} at {company}"
    html = f"""
    <html>
    <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #64748B, #475569); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0;">Application Update</h1>
        </div>
        <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 12px 12px; border: 1px solid #e0e0e0;">
            <p style="font-size: 16px;">Dear <strong>{candidate_name}</strong>,</p>
            <p>Thank you for applying for <strong>{job_title}</strong> at <strong>{company}</strong> and for the time you invested in our recruitment process.</p>
            <div style="background: #F8FAFC; border-radius: 8px; padding: 20px; margin: 20px 0;">
                <p style="margin: 0; color: #555;">After careful consideration, we regret to inform you that we will not be moving forward with your application at this time.</p>
            </div>
            <p>We encourage you to apply for future openings that match your profile. We wish you all the best! 🍀</p>
            <p style="color: #888; font-size: 13px;">Best regards,<br><strong>HR Team – {company}</strong></p>
        </div>
    </body>
    </html>
    """
    _send_email(candidate_email, subject, html)


def send_offer_letter_email(
    candidate_email: str,
    candidate_name: str,
    job_title: str,
    company: str,
    pdf_path: str
):
    subject = f"🎉 Offer Letter — {job_title} at {company}"
    html = f"""
    <html>
    <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #22C55E, #16A34A); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0;">🎉 Your Offer Letter</h1>
        </div>
        <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 12px 12px; border: 1px solid #e0e0e0;">
            <p style="font-size: 16px;">Dear <strong>{candidate_name}</strong>,</p>
            <p>Congratulations! Please find your official <strong>Offer Letter</strong> for the position of <strong>{job_title}</strong> at <strong>{company}</strong> attached to this email.</p>
            <div style="background: #F0FDF4; border-radius: 8px; padding: 20px; margin: 20px 0;">
                <p style="margin: 0;">Please review the offer letter and contact us if you have any questions.</p>
            </div>
            <p>We look forward to welcoming you to the team! 🎊</p>
            <p style="color: #888; font-size: 13px;">Best regards,<br><strong>HR Team – {company}</strong></p>
        </div>
    </body>
    </html>
    """

    load_dotenv(override=True)
    smtp_host     = os.getenv("SMTP_HOST", "smtp.gmail.com")
    smtp_port     = int(os.getenv("SMTP_PORT", 587))
    smtp_user     = os.getenv("SMTP_USER")
    smtp_password = os.getenv("SMTP_PASSWORD")

    if not smtp_user or not smtp_password:
        print("❌ SMTP credentials not set")
        return

    try:
        msg = MIMEMultipart("mixed")
        msg["Subject"] = subject
        msg["From"]    = smtp_user
        msg["To"]      = candidate_email

        msg.attach(MIMEText(html, "html"))

        # Attach PDF
        with open(pdf_path, "rb") as f:
            part = MIMEBase("application", "octet-stream")
            part.set_payload(f.read())
            encoders.encode_base64(part)
            part.add_header(
                "Content-Disposition",
                f"attachment; filename=Offer_Letter_{candidate_name}.pdf"
            )
            msg.attach(part)

        with smtplib.SMTP(smtp_host, smtp_port, timeout=10) as server:
            server.ehlo()
            server.starttls()
            server.ehlo()
            server.login(smtp_user, smtp_password)
            server.sendmail(smtp_user, candidate_email, msg.as_string())

        print(f"✅ Offer letter email sent to {candidate_email}")

    except Exception as e:
        print(f"❌ Offer letter email error: {e}") 