import sys
from twilio.rest import Client
from src.config import config

# Your Twilio credentials from .env
account_sid = config.TWILIO_ACCOUNT_SID
auth_token = config.TWILIO_AUTH_TOKEN
sandbox_number = config.TWILIO_SANDBOX_NUMBER

if not account_sid or not auth_token:
    print("Error: TWILIO_ACCOUNT_SID or TWILIO_AUTH_TOKEN not set in .env")
    sys.exit(1)

client = Client(account_sid, auth_token)

def update_webhook(webhook_url: str):
    # Find the WhatsApp Messaging Service
    # Note: In a free sandbox, you might not have a messaging service.
    # This script tries to find one with 'whatsapp' in the name.
    services = client.messaging.v1.services.list()
    whatsapp_service = None
    for service in services:
        if 'whatsapp' in service.friendly_name.lower():
            whatsapp_service = service
            break

    if not whatsapp_service:
        print("WhatsApp Messaging Service not found in Twilio account.")
        print(f"Please manually set the webhook to: {webhook_url}")
        print("At: https://console.twilio.com/us1/develop/sms/settings/whatsapp-sandbox")
        return

    service_sid = whatsapp_service.sid
    print(f"Found Messaging Service: {service_sid}")

    # Find the Alpha Sender for the sandbox number
    alpha_senders = client.messaging.v1.services(service_sid).alpha_senders.list()
    alpha_sender = None
    for sender in alpha_senders:
        if sender.address == f'whatsapp:{sandbox_number}':
            alpha_sender = sender
            break

    if not alpha_sender:
        print(f"Alpha Sender for {sandbox_number} not found in service {service_sid}.")
        return

    sender_sid = alpha_sender.sid
    print(f"Found Alpha Sender: {sender_sid}")

    # Update the webhook
    client.messaging.v1.services(service_sid).alpha_senders(sender_sid).update(
        inbound_webhook_url=webhook_url,
        inbound_webhook_method='POST'
    )

    print("✅ Webhook updated successfully via Messaging Service!")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python tools/set_webhook.py <ngrok_url>")
        sys.exit(1)
    
    target_url = sys.argv[1]
    update_webhook(target_url)
