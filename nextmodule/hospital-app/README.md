# 🏥 Hospital Panel — Device 3 (Hospital Tablet/Laptop)

## Status: ✅ Complete

The hospital-facing interface for receiving emergency case alerts and dispatching ambulances.

## How to Run

```bash
cd hospital-app
npm install
npx vite --port 5175 --host
# Opens on http://localhost:5175
```

## Screens

### Screen 1: Hospital Selector
- Grid of 6 Mumbai hospitals to choose from
- Shows bed count and ambulance count per hospital
- Click to select and join that hospital's socket room

### Screen 2: Status Board (Default)
- Hospital name in header with LIVE indicator
- Three stat boxes: Beds Available, Active Cases, Ambulances Ready
- Ambulance fleet list with driver name, vehicle number, status chip

### Screen 3: Incoming Alert
- Full-width red alert banner slides down from top
- Severity level displayed large and bold
- Care needs, specialist required, summary shown
- Background dims to 40% opacity
- Two large buttons: DISPATCH (green) and CANNOT ACCEPT (red)

### Screen 4: Dispatch Confirmation
- Green checkmark with circular SVG draw animation
- "AMBULANCE DISPATCHED" text
- Auto-hides after 3 seconds
- Ambulance status updates to EN ROUTE

## Socket Events Used

| Event | Direction | Purpose |
|-------|-----------|---------|
| `join:hospital` | Emit to server | Join hospital-specific socket room |
| `case:assigned` | Receive from server | Incoming case alert for this hospital |
| `ambulance:dispatched` | Emit to server | Dispatch ambulance for case |
| `case:rejected` | Emit to server | Cannot accept, triggers re-routing |
| `hospital:update` | Receive from server | Updated hospital data |

## What's Done
- [x] Hospital selector with all 6 hospitals
- [x] Status board with live stats
- [x] Ambulance fleet list
- [x] Incoming alert banner with pulse animation
- [x] DISPATCH button with checkmark draw animation
- [x] CANNOT ACCEPT with re-routing
- [x] 40% dim overlay for focus
- [x] Large touch-friendly buttons
- [x] Live status chip updates

## What Could Be Added
- [ ] Audio alert for incoming cases
- [ ] ETA display for incoming patient
- [ ] Case history log
- [ ] Multiple simultaneous cases
