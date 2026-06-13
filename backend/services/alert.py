import os
import logging
from typing import List, Dict

# Twilio client for SMS and voice
try:
    from twilio.rest import Client as TwilioClient
except ImportError:
    TwilioClient = None
    logging.warning("Twilio library not installed; alert service will be a no‑op.")

# Email (SMTP) – we will use Gmail SMTP as a free option if configured
import smtplib
from email.message import EmailMessage

# Load credentials from environment
TWILIO_ACCOUNT_SID = os.getenv("TWILIO_ACCOUNT_SID")
TWILIO_AUTH_TOKEN = os.getenv("TWILIO_AUTH_TOKEN")
TWILIO_FROM_NUMBER = os.getenv("TWILIO_FROM_NUMBER")

SMTP_HOST = os.getenv("SMTP_HOST", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER = os.getenv("SMTP_USER")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD")

log = logging.getLogger(__name__)

def _twilio_client():
    if not all([TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM_NUMBER]):
        log.error("Twilio credentials missing.")
        return None
    if TwilioClient is None:
        log.error("Twilio library not available.")
        return None
    return TwilioClient(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)

def send_sms(to_number: str, body: str) -> bool:
    client = _twilio_client()
    if not client:
        return False
    try:
        message = client.messages.create(
            body=body,
            from_=TWILIO_FROM_NUMBER,
            to=to_number,
        )
        log.info(f"SMS sent: {message.sid}")
        return True
    except Exception as e:
        log.exception(f"Failed to send SMS to {to_number}: {e}")
        return False

def make_call(to_number: str, url: str) -> bool:
    """Initiate a voice call that fetches TwiML from `url`.
    The URL should return TwiML instructing what to say; for emergency we can use a simple <Say>.
    """
    client = _twilio_client()
    if not client:
        return False
    try:
        call = client.calls.create(
            url=url,
            to=to_number,
            from_=TWILIO_FROM_NUMBER,
        )
        log.info(f"Call initiated: {call.sid}")
        return True
    except Exception as e:
        log.exception(f"Failed to make call to {to_number}: {e}")
        return False

def send_email(to_email: str, subject: str, body: str) -> bool:
    if not all([SMTP_USER, SMTP_PASSWORD]):
        log.error("SMTP credentials missing.")
        return False
    try:
        msg = EmailMessage()
        msg["Subject"] = subject
        msg["From"] = SMTP_USER
        msg["To"] = to_email
        msg.set_content(body)
        with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
            server.starttls()
            server.login(SMTP_USER, SMTP_PASSWORD)
            server.send_message(msg)
        log.info(f"Email sent to {to_email}")
        return True
    except Exception as e:
        log.exception(f"Failed to send email to {to_email}: {e}")
        return False

def dispatch_emergency_alert(contacts: List[Dict[str, str]], lake_name: str, tier: str, risk_score: float, evacuation_plan: str) -> None:
    """Send SMS, call, and email to each contact.
    `contacts` is a list of dicts: {"phone": "+123456...", "email": "user@example.com"}
    """
    message = f"⚠️ EMERGENCY ALERT: {lake_name} is at {tier} risk (score {risk_score}). Evacuation plan: {evacuation_plan}"
    for c in contacts:
        phone = c.get("phone")
        email = c.get("email")
        if phone:
            send_sms(phone, message)
            twiml_url = "http://twimlets.com/message?Message[0]=Emergency%20alert%20for%20" + lake_name.replace(" ", "%20")
            make_call(phone, twiml_url)
        if email:
            send_email(email, f"Emergency Alert – {lake_name}", message)
