import os
import smtplib
from email.message import EmailMessage
from fastapi import HTTPException

SMTP_EMAIL = os.getenv("SMTP_EMAIL")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD")


def send_password_reset_email(to_email: str, token: str):
    """Send a password reset email to the user."""
    if not SMTP_EMAIL or not SMTP_PASSWORD:
        raise HTTPException(
            status_code=500,
            detail="Email configuration is missing from environment variables."
        )

    frontend_url = os.getenv("FRONTEND_URL", "http://localhost:3000")
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
