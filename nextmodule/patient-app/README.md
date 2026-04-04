# 📱 Patient App — Device 1 (Mobile Browser)

## Status: ✅ Complete

The patient-facing mobile interface where emergencies start. Voice/text input → AI severity analysis → hospital assignment → live ambulance tracking.

## How to Run

```bash
cd patient-app
npm install
npx vite --port 5173 --host
# Opens on http://localhost:5173
```

## Screens

### Screen 1: Chat Interface
- Bot-guided conversation in Hindi/English
- Voice input via Web Speech API (tap mic icon)
- Text input with send button
- 3-step conversation: symptoms → location → duration → dispatch

### Screen 2: Severity Analysis
- Animated severity bar (CRITICAL/MODERATE/LOW with color coding)
- Predicted care needs as colored tags (ICU, Cardiologist, etc.)
- Pulsing "Connecting to dispatch..." status
- Assignment card slides in when hospital is assigned
- Shows hospital name, distance, specialist, beds, routing explanation

### Screen 3: Live Tracking Map
- Leaflet.js with CartoDB dark tiles
- Pulsing blue dot = patient location
- Red H marker = assigned hospital
- White ambulance icon = ambulance (updates every 2 seconds)
- ETA countdown in top-left
- Progress bar at bottom
- Driver info display

## Socket Events Used

| Event | Direction | Purpose |
|-------|-----------|---------|
| `case:new` | Emit to server | Submit emergency case |
| `case:assigned` | Receive from server | Hospital assigned, show assignment card |
| `case:update` | Receive from server | Ambulance dispatched notification |
| `ambulance:locationUpdate` | Receive from server | Move ambulance marker + update ETA |
| `ambulance:arrived` | Receive from server | Show arrival celebration |

## Files

| File | Purpose |
|------|---------|
| `src/main.js` | App init, socket connection, screen flow |
| `src/chat.js` | Bot conversation flow + voice recognition |
| `src/severityCard.js` | Severity display + assignment card |
| `src/trackingMap.js` | Leaflet map with live ambulance tracking |
| `src/style.css` | Full dark theme CSS |

## What's Done
- [x] 3-screen flow (chat → severity → tracking)
- [x] Voice input with Web Speech API
- [x] Animated severity bar
- [x] Hospital assignment card with routing explanation
- [x] Live Leaflet map with ambulance tracking
- [x] ETA countdown
- [x] Mobile-optimized layout
- [x] Bilingual support (Hindi/English)

## What Could Be Added
- [ ] Bhashini ASR for 22 Indian languages
- [ ] OpenAI/Groq structured output for severity
- [ ] Real location geocoding (address text)
- [ ] Push notifications
