# 📦 Shared — Data Contract Layer

## Status: ✅ Complete

This folder contains the **shared data models, socket event constants, and mock hospital data** used by all 4 apps (backend, patient, admin, hospital).

## Files

| File | Purpose |
|------|---------|
| `caseSchema.js` | Case, Hospital, Ambulance data models + severity/status enums |
| `socketEvents.js` | All socket event name constants (no raw strings elsewhere!) |
| `hospitalData.json` | 6 real Mumbai hospitals with coordinates, beds, specialists, ambulances |

## Rules

1. **Do NOT change field names** without updating all consumers (backend + 3 frontends)
2. **Do NOT use raw socket event strings** — always import from `socketEvents.js`
3. **Do NOT add hospitals without ambulances** — every hospital needs at least 1

## Data Models

### Case Object
```
caseId, patientLocation, symptoms, severity, predictedNeeds,
specialistRequired, status, assignedHospital, assignedAmbulance,
routingScores, timestamp
```

### Severity Levels
- `LOW` — Green — Minor issues
- `MODERATE` — Amber — Needs attention
- `CRITICAL` — Red — Life threatening

### Case Status Flow
`PENDING → ASSIGNED → DISPATCHED → ARRIVED`

## What's Done
- [x] Case schema with factory function
- [x] Severity & status enums
- [x] Socket event constants (11 events)
- [x] 6 hospitals with 14 ambulances total
- [x] Severity color mapping for UI

## What Could Be Added Later
- [ ] Zod/Joi validation schemas
- [ ] TypeScript interfaces
- [ ] More hospitals outside Mumbai
