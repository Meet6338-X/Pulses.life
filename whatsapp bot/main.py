"""
Pulses.life — WhatsApp Bot (Modular Refactor)
Main entry point for the FastAPI server.
"""

import uvicorn
from fastapi import FastAPI
from src.api.webhook import router as webhook_router
from src.config import config

app = FastAPI(title="Pulses.life WhatsApp Bot")

# Include routes
app.include_router(webhook_router)

if __name__ == "__main__":
    print(f"Starting Pulses.life Bot on {config.HOST}:{config.PORT}")
    uvicorn.run("main:app", host=config.HOST, port=config.PORT, reload=True)
