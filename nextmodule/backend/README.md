# 🖥️ Backend — Express + Socket.io Server

## Status: ✅ Complete

The backend is the **spine** connecting all 3 devices. It handles case processing, hospital routing, ambulance simulation, and real-time WebSocket communication.

## How to Run

```bash
cd backend
npm install
node index.js
# Server starts on http://localhost:3000
```

## Files

| File | Purpose |
|------|---------|
| `index.js` | Express server + Socket.io setup + all event handlers |
| `routingEngine.js` | Hospital scoring algorithm (100-point scale) |
| `severityParser.js` | Keyword-based severity extraction from symptoms |
| `ambulanceSimulator.js` | Simulates ambulance movement with 2-second position updates |
| `package.json` | Dependencies: express, cors, socket.io, uuid |

## REST Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/hospitals` | Returns all hospital data |
| GET | `/api/cases` | Returns all submitted cases |
| GET | `/api/metrics` | Returns live metrics (total cases, avg time, active hospitals) |
| POST | `/api/case` | Creates a new case (HTTP alternative to socket) |
| GET | `/api/health` | Health check |

## Socket Events

| Event | Direction | Description |
|-------|-----------|-------------|
| `case:new` | Client → Server | Patient submits emergency |
| `case:assigned` | Server → Clients | Routing decision made, case assigned |
| `ambulance:dispatched` | Client → Server | Hospital dispatches ambulance |
| `ambulance:locationUpdate` | Server → Clients | Live ambulance position (every 2s) |
| `ambulance:arrived` | Server → Clients | Ambulance reached patient |
| `case:rejected` | Client → Server | Hospital declines, triggers re-routing |
| `join:admin` | Client → Server | Admin dashboard joins admin room |
| `join:hospital` | Client → Server | Hospital panel joins hospital room |

## Routing Algorithm

Each hospital scored on 100 points:
- **Distance (30pts)**: Haversine formula, closer = higher
- **Bed Availability (25pts)**: More free beds = higher
- **Specialist Match (30pts)**: Required specialist on duty = full points
- **Current Load (15pts)**: Lower load = higher

## What's Done
- [x] Express server with CORS
- [x] Socket.io with room management
- [x] All 4 socket events + rejection re-routing
- [x] Routing engine with score breakdown
- [x] Severity parser (Hindi + English keywords)
- [x] Ambulance movement simulation
- [x] In-memory data store
- [x] REST API endpoints

## What Could Be Added
- [ ] Firebase Firestore persistence
- [ ] OpenAI/Groq API for AI severity parsing
- [ ] Authentication for admin/hospital rooms
- [ ] Rate limiting
