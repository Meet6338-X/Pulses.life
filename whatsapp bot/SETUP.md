# Pulses.life — WhatsApp Bot Setup Guide
## Twilio Free Sandbox + FastAPI + ngrok

---

## 📁 Files in this project

```
pulses-life-bot/
├── main.py          ← FastAPI app (Twilio webhook receiver)
├── bot_logic.py     ← All triage logic, language detection, messages
├── requirements.txt ← Python dependencies
└── SETUP.md         ← This file
```

---

## ✅ STEP 1 — Install Python dependencies

```bash
pip install -r requirements.txt
```

---

## ✅ STEP 2 — Create a FREE Twilio account

1. Go to → **https://www.twilio.com/try-twilio**
2. Sign up with your email (no credit card needed for free trial)
3. Verify your phone number during signup

### Get your credentials (save these):
- Dashboard → Account Info → **Account SID**
- Dashboard → Account Info → **Auth Token**

---

## ✅ STEP 3 — Activate WhatsApp Sandbox

1. In Twilio Console → **Messaging** → **Try it out** → **Send a WhatsApp message**
2. You'll see a sandbox number like `+1 415 523 8886`
3. Send the join code shown (e.g., `join sail-example`) to that number on WhatsApp
4. ✅ You're now connected to the sandbox

> **Note:** Anyone who wants to test the bot must send this same join code first.
> Free sandbox supports up to 5 phone numbers for testing.

---

## ✅ STEP 4 — Download & run ngrok (free public URL)

ngrok creates a public HTTPS URL that points to your local machine.

### Download:
→ **https://ngrok.com/download** (free account required)

### Run (in a separate terminal):
```bash
ngrok http 8000
```

You'll see output like:
```
Forwarding    https://abc123.ngrok-free.app → http://localhost:8000
```

📋 **Copy your ngrok URL** — you need it in Step 5.

---

## ✅ STEP 5 — Set the Webhook URL in Twilio

1. Twilio Console → **Messaging** → **Try it out** → **WhatsApp** → **Sandbox settings**
2. In the field **"When a message comes in"**, paste:
   ```
   https://YOUR-NGROK-URL.ngrok-free.app/webhook
   ```
   (e.g., `https://abc123.ngrok-free.app/webhook`)
3. Set HTTP method to **POST**
4. Click **Save**

---

## ✅ STEP 6 — Run the bot

```bash
python main.py
```

You should see:
```
INFO:     Uvicorn running on http://0.0.0.0:8000
INFO:     Application startup complete.
```

---

## ✅ STEP 7 — Test on WhatsApp

Send any of these to the Twilio sandbox number on WhatsApp:

| Message | Expected Response |
|---------|------------------|
| `hi` | Welcome menu |
| `I have fever` | Fever triage guidance |
| `chest pain` | 🚨 Emergency alert + 108 |
| `बुखार है` | Hindi fever guidance |
| `मला ताप आहे` | Marathi → Hindi fever guidance |
| `hospital` | Hospital finder guide |
| `reset` | Start over |

---

## 🧪 Supported Symptoms (v1)

| Symptom | Languages Detected |
|---------|-------------------|
| Fever | EN, HI, MR, TA, BN, TE |
| Cough | EN, HI, MR, TA, BN, TE |
| Headache | EN, HI, MR, TA, BN, TE |
| Stomach pain / Vomiting | EN, HI, MR, TA, BN, TE |

## 🚨 Emergency Keywords Detected (→ triggers 108 alert)

- Chest pain / छाती दर्द / छाती दुखते / மார்பு வலி / বুকে ব্যথা
- Heart attack / दिल का दौरा / হার্ট অ্যাটাক
- Unconscious / बेहोश / মযক্কম
- Difficulty breathing / सांस नहीं / শ্বাস নিতে পারছি না

---

## 🔧 Troubleshooting

| Problem | Fix |
|---------|-----|
| Twilio says "webhook failed" | Check ngrok is running; verify URL ends with `/webhook` |
| ngrok URL expired | Free ngrok URLs change on restart — update Twilio webhook each time |
| Bot not replying | Check terminal for Python errors; ensure `python main.py` is running |
| "join code" message | User hasn't joined sandbox yet — they must send the join code first |

---

## 🚀 Upgrading for the Hackathon Demo

After the basic bot works, add these layers (from your architecture):

### 1. Add Bhashini ASR (voice input)
```python
# In main.py, handle MediaUrl0 form field for voice messages
# Send audio to Bhashini IndicASR API → get transcript → pass to bot_logic
```

### 2. Add Groq LLM (smarter responses)
```bash
pip install groq
```
```python
from groq import Groq
client = Groq(api_key="YOUR_GROQ_KEY")  # Free tier: 14,400 req/day
```

### 3. Add ChromaDB + Medical RAG
```bash
pip install chromadb sentence-transformers
```
Index NHP India guidelines into ChromaDB, then query before responding.

### 4. Add hospital search (AIKosh data)
Load the National Hospital Directory CSV into ChromaDB.
Query by condition + city to surface nearest hospital.

---

## 📞 Emergency Numbers Reference (India)
- **108** — National Ambulance (Free, 24x7)
- **104** — Health Helpline (Free, multilingual)
- **112** — National Emergency Number

---

## ⚠️ Medical Disclaimer

This bot provides general health information only. It does not diagnose, prescribe, or replace clinical judgment. Always consult a qualified doctor for personal medical advice.
