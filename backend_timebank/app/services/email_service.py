import os
import smtplib
from email.message import EmailMessage
from fastapi import HTTPException

SMTP_EMAIL = os.getenv("SMTP_EMAIL")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD") or os.getenv("GMAIL_APP_PWD")


def _require_env(name: str) -> str:
    value = os.getenv(name)
    if not value:
        raise HTTPException(
            status_code=500,
            detail=f"Missing required environment variable: {name}",
        )
    return value


def send_password_reset_email(to_email: str, token: str):
    """Send a password reset email to the user."""
    if not SMTP_EMAIL or not SMTP_PASSWORD:
        raise HTTPException(
            status_code=500,
            detail="Email configuration is missing from environment variables."
        )

    frontend_url = _require_env("FRONTEND_URL")
    reset_link = f"{frontend_url}/reset-password?token={token}"

    msg = EmailMessage()
    msg["Subject"] = "Time Bank - Password Reset Request"
    msg["From"] = SMTP_EMAIL
    msg["To"] = to_email

    msg.set_content(f"""\
Hi,

We received a request to reset your password for your Time Bank account.

Please click the link below to reset your password:
{reset_link}

If you did not request a password reset, please ignore this email.

Thanks,
The Time Bank Team
""")

    try:
        # Use SMTP_SSL for standard secure connection (port 465)
        with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
            server.login(SMTP_EMAIL, SMTP_PASSWORD)
            server.send_message(msg)
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to send email: {str(e)}"
        )

def _send_email_safe(msg: EmailMessage):
    if not SMTP_EMAIL or not SMTP_PASSWORD:
        print("Warning: SMTP configuration missing, email not sent.")
        return
    try:
        with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
            server.login(SMTP_EMAIL, SMTP_PASSWORD)
            server.send_message(msg)
    except Exception as e:
        print(f"Failed to send notification email: {str(e)}")

def send_service_requested_email(provider_email: str, provider_name: str, requester_name: str, service_title: str):
    msg = EmailMessage()
    msg["Subject"] = "Time Bank - New Service Request!"
    msg["From"] = SMTP_EMAIL
    msg["To"] = provider_email
    msg.set_content(f"""\
Hi {provider_name},

Great news! {requester_name} has just requested your service: "{service_title}".

Log in to Time Bank to accept or reject this request.

Thanks,
The Time Bank Team
""")
    _send_email_safe(msg)

def send_service_completed_email(requester_email: str, requester_name: str, service_title: str):
    msg = EmailMessage()
    msg["Subject"] = "Time Bank - Service Completed!"
    msg["From"] = SMTP_EMAIL
    msg["To"] = requester_email
    msg.set_content(f"""\
Hi {requester_name},

The service you requested: "{service_title}" has been marked as completed!
The time credits have been transferred.

Don't forget to log in and leave a review for the provider.

Thanks,
The Time Bank Team
""")
    _send_email_safe(msg)

def send_service_reviewed_email(provider_email: str, provider_name: str, requester_name: str, service_title: str, rating: int, review_text: str):
    msg = EmailMessage()
    msg["Subject"] = "Time Bank - New Review Received!"
    msg["From"] = SMTP_EMAIL
    msg["To"] = provider_email
    
    review_content = review_text if review_text else "No written review provided."
    msg.set_content(f"""\
Hi {provider_name},

You just received a new review from {requester_name} for your service: "{service_title}".

Rating: {rating}/5
Review: "{review_content}"

Keep up the great work!

Thanks,
The Time Bank Team
""")
    _send_email_safe(msg)
