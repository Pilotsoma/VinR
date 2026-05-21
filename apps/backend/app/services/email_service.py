"""Email service for sending password reset emails."""

import smtplib
from email.message import EmailMessage
from app.core.config import get_settings

settings = get_settings()


def send_password_reset_email(to_email: str, token: str) -> None:
    """
    Send a password reset email.

    If SMTP credentials are not configured, prints the reset link to the
    terminal so the flow can still be tested without an email provider.
    """
    reset_url = f"{settings.FRONTEND_URL}/reset-password?token={token}"

    # ── No credentials configured → log to terminal for testing ──────────────
    if not settings.SMTP_USER or not settings.SMTP_PASSWORD:
        print("\n" + "="*60)
        print("📧  PASSWORD RESET (no SMTP configured — dev mode)")
        print(f"   To:    {to_email}")
        print(f"   Link:  {reset_url}")
        print("   Copy the link above and open it in your browser.")
        print("="*60 + "\n")
        return

    # ── Send real email ───────────────────────────────────────────────────────
    msg = EmailMessage()
    msg.set_content(
        f"Hi,\n\n"
        f"You requested a password reset for your VinR account.\n\n"
        f"Click the link below to reset your password (expires in 1 hour):\n"
        f"{reset_url}\n\n"
        f"If you did not request this, you can safely ignore this email.\n\n"
        f"— The VinR Team"
    )
    msg.add_alternative(f"""
    <div style="font-family:sans-serif;max-width:480px;margin:auto;padding:32px;background:#05040E;color:#ECEAF6;border-radius:16px;">
        <h2 style="color:#D4AF37;margin-bottom:8px;">Reset your password</h2>
        <p style="color:rgba(236,234,246,0.7);margin-bottom:24px;">
            Click the button below to choose a new password. This link expires in 1 hour.
        </p>
        <a href="{reset_url}" style="display:inline-block;background:#D4AF37;color:#05040E;font-weight:700;
           padding:14px 28px;border-radius:12px;text-decoration:none;font-size:16px;">
            Reset Password →
        </a>
        <p style="color:rgba(236,234,246,0.4);font-size:12px;margin-top:24px;">
            If you didn't request this, ignore this email.
        </p>
    </div>
    """, subtype='html')

    msg["Subject"] = "Reset your VinR password"
    msg["From"]    = settings.EMAILS_FROM_EMAIL
    msg["To"]      = to_email

    try:
        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=10) as server:
            if settings.SMTP_PORT == 587:
                server.starttls()
            server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
            server.send_message(msg)
        print(f"✅ Password reset email sent to {to_email}")
    except Exception as e:
        print(f"❌ Failed to send email to {to_email}: {e}")
        # Don't raise — the token is already saved in the DB.
        # The user can retry; in dev mode the link was printed above.
