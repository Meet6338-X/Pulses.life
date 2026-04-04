# 📊 Admin Dashboard — Device 2 (Command Center)

## Status: ✅ Complete

The full dispatcher view — live case queue, city map with hospitals and ambulances, hospital capacity grid, and routing explainer drawer.

## How to Run

```bash
cd admin-app
npm install
npx vite --port 5174 --host
# Opens on http://localhost:5174
```

## Layout

```
┌─────────────────────────────────────────────────────────────┐
│  🔴 Pulses.life COMMAND CENTER  │  Cases: 3  │  Avg: 0.2s  │ LIVE │
├──────────┬───────────────────────────────────┬──────────────┤
│          │                                   │              │
│  Case    │       City Map                    │  Hospital    │
│  Queue   │       (Leaflet.js dark tiles)     │  Grid        │
│  280px   │       hospitals + ambulances       │  280px       │
│          │                                   │              │
│  ┌────┐  │       [H] Lilavati               │  ┌────────┐  │
│  │CRIT│  │       [H] Kokilaben     🚑       │  │Lilavati│  │
│  │    │  │       [H] Hinduja                 │  │5/12 bed│  │
│  └────┘  │       [📍 Patient]                │  │████░░░░│  │
│  ┌────┐  │                                   │  └────────┘  │
│  │MOD │  │                                   │  ┌────────┐  │
│  └────┘  │                                   │  │KEM     │  │
│          │                                   │  │10/20   │  │
│          │                                   │  └────────┘  │
└──────────┴───────────────────────────────────┴──────────────┘
```

## Components

| Component | File | Purpose |
|-----------|------|---------|
| Metrics Bar | `metricsBar.js` | Top strip with live case count, avg time, hospitals active |
| Case Queue | `caseQueue.js` | Left column — live case cards with severity borders |
| City Map | `cityMap.js` | Center — Leaflet map with hospitals, ambulances, patients |
| Hospital Grid | `hospitalGrid.js` | Right column — hospital capacity cards with load bars |
| Explainer Drawer | `explainerDrawer.js` | Score breakdown table for routing decisions |

## What's Done
- [x] Three-column layout (280px / flex / 280px)
- [x] Live metrics bar with animated counters
- [x] Case queue with severity color-coded borders
- [x] Live timer on each case card
- [x] Leaflet dark map with all hospital markers
- [x] Sonar pulse animation on assigned hospital
- [x] Ambulance markers with route lines
- [x] Hospital capacity cards with load bars
- [x] Specialist chips (green=on-duty, gray=off)
- [x] Flash notifications on assignment
- [x] Routing explainer drawer with score table
- [x] Auto-opens explainer on new case

## What Could Be Added
- [ ] Recharts for load visualization
- [ ] Case filtering by severity
- [ ] Sound alerts for CRITICAL cases
- [ ] Full-screen map toggle
