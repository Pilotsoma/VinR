"""Email service for sending notifications and password resets."""

import smtplib
from email.message import EmailMessage
from app.core.config import get_settings

settings = get_settings()

def send_password_reset_email(to_email: str, token: str) -> None:
    """Send a password reset email."""
    if not settings.SMTP_HOST:
        print(f"SMTP not configured. Would have sent reset token {token} to {to_email}")
        return

    reset_url = f"{settings.FRONTEND_URL}/reset-password?token={token}"
    
    msg = EmailMessage()
    msg.set_content(
        f"You requested a password reset.\\n\\n"
        f"Click the link below to reset your password:\\n{reset_url}\\n\\n"
        f"If you did not request this, please ignore this email."
    )
    msg["Subject"] = "Password Reset - VinR"
    msg["From"] = settings.EMAILS_FROM_EMAIL
    msg["To"] = to_email

    try:
        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
            if settings.SMTP_PORT == 587:
                server.starttls()
            if settings.SMTP_USER and settings.SMTP_PASSWORD:
                server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
            server.send_message(msg)
    except Exception as e:
        print(f"Failed to send email: {e}")
