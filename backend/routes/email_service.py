import smtplib
import os
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from dotenv import load_dotenv

load_dotenv()

SMTP_HOST     = os.getenv("SMTP_HOST", "smtp.gmail.com")
SMTP_PORT     = int(os.getenv("SMTP_PORT", 587))
SMTP_USER     = os.getenv("SMTP_USER")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD")


def send_shortlist_email(candidate_email: str, candidate_name: str, job_title: str, company: str):
    """Send shortlisting congratulations email to candidate."""
    subject = f"🎉 You've been Shortlisted! – {job_title} at {company}"
    body = f"""
    <html>
    <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea, #764ba2); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0;">🎉 Congratulations!</h1>
        </div>
        <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 12px 12px; border: 1px solid #e0e0e0;">
            <p style="font-size: 16px;">Dear <strong>{candidate_name}</strong>,</p>
            <p style="font-size: 15px; color: #333;">
                We are pleased to inform you that you have been <strong style="color: #28a745;">shortlisted</strong> 
                for the position of <strong>{job_title}</strong> at <strong>{company}</strong>.
            </p>
            <div style="background: #fff; border-left: 4px solid #667eea; padding: 15px; margin: 20px 0; border-radius: 4px;">
                <p style="margin: 0; color: #555;">Our HR team will be in touch shortly with further details about the next steps in the hiring process.</p>
            </div>
            <p style="color: #888; font-size: 13px;">Best regards,<br><strong>HR Team – {company}</strong></p>
        </div>
    </body>
    </html>
    """
    _send_email(candidate_email, subject, body)


def send_interview_email(
    candidate_email: str,
    candidate_name: str,
    job_title: str,
    company: str,
    interview_date: str,
    interview_time: str,
    interview_notes: str = ""
):
    """Send interview scheduled email with date and time to candidate."""
    subject = f"📅 Interview Scheduled – {job_title} at {company}"
    body = f"""
    <html>
    <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #f093fb, #f5576c); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0;">📅 Interview Scheduled</h1>
        </div>
        <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 12px 12px; border: 1px solid #e0e0e0;">
            <p style="font-size: 16px;">Dear <strong>{candidate_name}</strong>,</p>
            <p style="font-size: 15px; color: #333;">
                We are excited to invite you for an interview for the position of 
                <strong>{job_title}</strong> at <strong>{company}</strong>.
            </p>

            <div style="background: white; border-radius: 8px; padding: 20px; margin: 20px 0; border: 1px solid #e0e0e0;">
                <h3 style="margin: 0 0 15px 0; color: #333;">📋 Interview Details</h3>
                <table style="width: 100%; border-collapse: collapse;">
                    <tr>
                        <td style="padding: 8px 0; color: #666; width: 40%;">📅 Date</td>
                        <td style="padding: 8px 0; font-weight: bold; color: #333;">{interview_date}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 0; color: #666;">⏰ Time</td>
                        <td style="padding: 8px 0; font-weight: bold; color: #333;">{interview_time}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 0; color: #666;">🏢 Company</td>
                        <td style="padding: 8px 0; font-weight: bold; color: #333;">{company}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 0; color: #666;">💼 Position</td>
                        <td style="padding: 8px 0; font-weight: bold; color: #333;">{job_title}</td>
                    </tr>
                </table>
                {f'<p style="margin-top: 15px; padding: 10px; background: #f0f4ff; border-radius: 6px; color: #555;"><strong>Notes:</strong> {interview_notes}</p>' if interview_notes else ''}
            </div>

            <p style="color: #555;">Please confirm your availability by replying to this email.</p>
            <p style="color: #888; font-size: 13px; margin-top: 20px;">Best regards,<br><strong>HR Team – {company}</strong></p>
        </div>
    </body>
    </html>
    """
    _send_email(candidate_email, subject, body)


def _send_email(to_email: str, subject: str, html_body: str):
    """Internal helper to send email via SMTP."""
    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"]    = SMTP_USER
        msg["To"]      = to_email

        msg.attach(MIMEText(html_body, "html"))

        with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
            server.ehlo()
            server.starttls()
            server.login(SMTP_USER, SMTP_PASSWORD)
            server.sendmail(SMTP_USER, to_email, msg.as_string())

        print(f"✅ Email sent to {to_email}")
    except Exception as e:
        print(f"❌ Failed to send email to {to_email}: {e}") 