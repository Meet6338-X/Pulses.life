# 🚑 MediRoute — Real-Time Emergency Dispatch System

> **Built on top of Pulses.life** — extending India's multilingual voice health companion into a full emergency routing & ambulance dispatch platform.

![Status](https://img.shields.io/badge/status-hackathon%20build-orange)
![Stack](https://img.shields.io/badge/stack-Node.js%20%7C%20Socket.io%20%7C%20Leaflet.js-blue)
![Screens](https://img.shields.io/badge/screens-3%20devices-green)

---

## 🎯 What Is This?

MediRoute is a **3-screen real-time emergency dispatch system** where:

1. **Device 1 (Patient's Phone)** — A patient speaks their symptoms via voice/text. AI extracts severity, and a live ambulance tracking map appears after dispatch.
2. **Device 2 (Admin Dashboard)** — A command center showing live case queue, city map with hospital markers & moving ambulances, and hospital capacity grid.
3. **Device 3 (Hospital Panel)** — A hospital's view showing incoming case alerts with a one-tap dispatch button.

All three screens are connected through **one backend** with genuine **WebSocket (Socket.io) sync** — events on one device appear instantly on the others.

---

## 🏗️ Architecture

```
┌─────────────────┐     WebSocket      ┌─────────────────────┐     WebSocket      ┌──────────────────┐
│   Device 1      │◄──────────────────►│   Backend Server     │◄──────────────────►│   Device 3       │
│   Patient App   │   case:new         │   Node.js + Express  │   case:assigned    │   Hospital Panel │
│   (Mobile)      │   ambulance:       │   Socket.io          │   ambulance:       │   (Tablet)       │
│                 │   locationUpdate   │   Routing Engine     │   dispatched       │                  │
└─────────────────┘                    └──────────┬──────────┘                    └──────────────────┘
                                                   │
                                                   │ WebSocket
                                                   │ case:assigned
                                                   ▼
                                       ┌─────────────────────┐
                                       │   Device 2          │
                                       │   Admin Dashboard   │
                                       │   (Laptop)          │
                                       └─────────────────────┘
```

---

## 📁 Project Structure

```
mediroute/
├── README.md                ← You are here
├── package.json             ← Root workspace config
│
├── shared/                  ← Shared data models & constants
│   ├── README.md
│   ├── caseSchema.js        ← Case, Hospital, Ambulance schemas
│   ├── socketEvents.js      ← Socket event name constants
│   └── hospitalData.json    ← 6 Mumbai hospitals with real coordinates
│
├── backend/                 ← Node.js + Express + Socket.io server
│   ├── README.md
│   ├── package.json
│   ├── index.js             ← Server entry point
│   ├── routingEngine.js     ← Hospital scoring algorithm (100-point scale)
│   ├── severityParser.js    ← AI severity extraction (keyword-based)
│   └── ambulanceSimulator.js← Simulates ambulance movement along route
│
├── patient-app/             ← Device 1 — Patient's mobile browser
│   ├── README.md
│   ├── package.json
│   ├── index.html
│   └── src/
│       ├── main.js          ← App initialization & socket connection
│       ├── chat.js          ← Voice/text chat with bot
│       ├── severityCard.js  ← Severity output after AI analysis
│       ├── trackingMap.js   ← Live Leaflet.js ambulance tracking
│       └── style.css        ← Dark theme, glassmorphism, animations
│
├── admin-app/               ← Device 2 — Admin command center
│   ├── README.md
│   ├── package.json
│   ├── index.html
│   └── src/
│       ├── main.js          ← App init, joins admin socket room
│       ├── caseQueue.js     ← Left column — live case cards
│       ├── cityMap.js       ← Center — Leaflet map with hospitals & ambulances
│       ├── hospitalGrid.js  ← Right column — hospital capacity cards
│       ├── explainerDrawer.js ← Routing decision breakdown panel
│       ├── metricsBar.js    ← Top bar — live operational metrics
│       └── style.css        ← Command center dark theme
│
└── hospital-app/            ← Device 3 — Hospital tablet/laptop
    ├── README.md
    ├── package.json
    ├── index.html
    └── src/
        ├── main.js          ← App init, joins hospital socket room
        ├── statusBoard.js   ← Hospital stats & ambulance list
        ├── incomingAlert.js ← Red alert banner for incoming cases
        ├── dispatchButton.js← DISPATCH / CANNOT ACCEPT buttons
        └── style.css        ← Dark theme with large touch targets
```

---

## 🔄 Socket Event Flow

| Event | Direction | Payload | Purpose |
|-------|-----------|---------|---------|
| `case:new` | Patient → Server | Full case object | Patient submits emergency |
| `case:assigned` | Server → Admin + Hospital | Case + assigned hospital + scores | Routing decision made |
| `ambulance:dispatched` | Hospital → Server | Ambulance ID + case ID | Hospital dispatches ambulance |
| `ambulance:locationUpdate` | Server → Patient + Admin | lat, lng, ETA | Live ambulance tracking |
| `case:rejected` | Hospital → Server | Case ID + hospital ID | Hospital cannot accept, re-route |

---

## 🧠 Routing Engine (How Hospital Selection Works)

Each hospital gets scored on a **100-point scale**:

| Factor | Weight | Logic |
|--------|--------|-------|
| **Distance** | 30 pts | Closer = higher score (Haversine formula) |
| **Bed Availability** | 25 pts | More free beds = higher score |
| **Specialist Match** | 30 pts | Required specialist on duty = full points |
| **Current Load** | 15 pts | Lower load percentage = higher score |

The hospital with the **highest total score** gets the case. All scores are stored and displayed in the Admin Dashboard's Explainer Drawer for full transparency.

---

## 🚀 How to Run

### Quick Start (All Apps)
```bash
# Install all dependencies
npm run install:all

# Start backend server (port 3000)
npm run start:backend

# In separate terminals:
npm run start:patient    # Patient app on port 5173
npm run start:admin      # Admin dashboard on port 5174
npm run start:hospital   # Hospital panel on port 5175
```

### Individual Apps
```bash
# Backend only
cd backend && npm install && node index.js

# Patient app only
cd patient-app && npm install && npx vite --port 5173

# Admin dashboard only
cd admin-app && npm install && npx vite --port 5174

# Hospital panel only
cd hospital-app && npm install && npx vite --port 5175
```

---

## 🎬 Demo Flow (90 seconds)

1. **Patient speaks** into Device 1 → describes chest pain in Hindi/English
2. **AI extracts** severity (CRITICAL), needs (ICU, Cardiologist), and creates a case
3. **Routing engine** scores all 6 hospitals → picks best match (not just nearest!)
4. **Admin dashboard** (Device 2) shows new case card + routing explanation
5. **Hospital panel** (Device 3) receives alert → taps DISPATCH
6. **Patient sees** ambulance moving on map with live ETA countdown
7. **Total time**: Under 90 seconds, fully automated

---

## 🛠️ Tech Stack

| Component | Technology |
|-----------|------------|
| Backend | Node.js, Express, Socket.io |
| Maps | Leaflet.js + CartoDB Dark Tiles |
| Frontend | Vanilla JS + Vite (lightweight, no React overhead) |
| Styling | Custom CSS (dark theme, glassmorphism, animations) |
| Voice | Web Speech API (browser-native) |
| AI Severity | Keyword-based NLP (swappable for OpenAI/Groq) |
| Data | In-memory store (swappable for Firebase Firestore) |

---

## 🔮 What Can Be Swapped In

| Current (Demo) | Production Ready |
|----------------|-----------------|
| In-memory data store | Firebase Firestore |
| Keyword severity parser | OpenAI GPT-4 / Groq structured output |
| Simulated ambulance path | Google Maps Directions API |
| Web Speech API | Bhashini ASR for 22 Indian languages |
| Mock hospital data | Real hospital APIs / AIKosh integration |

---

## 📊 Build Progress

| Stage | Status | Description |
|-------|--------|-------------|
| 1. Shared Layer | ✅ Complete | Data models, socket events, hospital data |
| 2. Backend | ✅ Complete | Server, routing engine, severity parser, ambulance sim |
| 3. Patient App | ✅ Complete | Chat, severity card, tracking map |
| 4. Admin Dashboard | ✅ Complete | Case queue, city map, hospital grid, explainer |
| 5. Hospital Panel | ✅ Complete | Status board, alert banner, dispatch button |
| 6. Integration | ✅ Complete | End-to-end WebSocket flow verified |

---

## 👥 Team

Built for hackathon by the Pulses.life team — extending emergency healthcare access for 500 million Indians who cannot use English healthcare apps.

---

## 📄 License

MIT — Built for impact, open for contribution.
