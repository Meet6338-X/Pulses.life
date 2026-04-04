from fastapi import APIRouter, Form
from fastapi.responses import PlainTextResponse
from twilio.twiml.messaging_response import MessagingResponse
from src.core.bot import handle_message

router = APIRouter()

@router.post("/webhook", response_class=PlainTextResponse)
async def whatsapp_webhook(
    From: str = Form(...),
    Body: str = Form(...),
    ProfileName: str = Form(default="User"),
):
    """
    Twilio calls this endpoint when a WhatsApp message arrives.
    """
    user_number = From          # e.g. whatsapp:+919876543210
    user_message = Body.strip()
    user_name = ProfileName

    try:
        print(f"[{user_number}] {user_name}: {user_message}")
    except UnicodeEncodeError:
        print(f"[{user_number}] New incoming message (emoji/special chars filtered)")

    reply = handle_message(user_number, user_message, user_name)

    resp = MessagingResponse()
    resp.message(reply)
    return str(resp)

@router.get("/")
def health_check():
    return {"status": "Pulses.life bot is running"}
