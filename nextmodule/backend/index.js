// ============================================================
// Pulses.life — Backend Server
// Express + Socket.io server connecting all 3 devices.
// This is the spine of the entire system.
// ============================================================

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const path = require('path');

// Import modules
const { routeCase } = require('./routingEngine');
const { parseSeverity } = require('./severityParser');
const { startSimulation, stopSimulation } = require('./ambulanceSimulator');

// Load shared data
const hospitalDataRaw = require(path.join(__dirname, '..', 'shared', 'hospitalData.json'));

// ============================================================
// In-Memory Data Store (swappable for Firebase)
// ============================================================
const store = {
  hospitals: JSON.parse(JSON.stringify(hospitalDataRaw.hospitals)), // deep clone
  cases: [],
  metrics: {
    totalCasesToday: 0,
    totalAssignmentTimeMs: 0,
    assignmentCount: 0
  }
};

// ============================================================
// Express Setup
// ============================================================
const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);

// ============================================================
// Socket.io Setup
// ============================================================
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// ============================================================
// REST Endpoints
// ============================================================

// GET /api/hospitals — return all hospital data
app.get('/api/hospitals', (req, res) => {
  res.json({ hospitals: store.hospitals });
});

// GET /api/cases — return all cases
app.get('/api/cases', (req, res) => {
  res.json({ cases: store.cases });
});

// GET /api/metrics — return live metrics
app.get('/api/metrics', (req, res) => {
  const avgTime = store.metrics.assignmentCount > 0
    ? Math.round(store.metrics.totalAssignmentTimeMs / store.metrics.assignmentCount / 1000)
    : 0;
  res.json({
    totalCasesToday: store.metrics.totalCasesToday,
    averageAssignmentTimeSec: avgTime,
    hospitalsActive: store.hospitals.filter(h => h.bedsAvailable > 0).length
  });
});

// POST /api/case — create case via HTTP (alternative to socket)
app.post('/api/case', (req, res) => {
  const caseData = processNewCase(req.body);

  // Also broadcast via sockets so all panels update
  io.to('admin').emit('case:assigned', caseData);
  if (caseData.assignedHospital) {
    io.to(`hospital:${caseData.assignedHospital.hospitalId}`).emit('case:assigned', caseData);
  }
  io.emit('hospital:update', { hospitals: store.hospitals });

  res.json(caseData);
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime(), cases: store.cases.length });
});

// ============================================================
// Case Processing Logic
// ============================================================

function processNewCase(payload) {
  const startTime = Date.now();
  const caseId = payload.caseId || uuidv4();

  // 1. Parse severity from symptoms
  const severityData = parseSeverity(payload.symptoms || '');

  // 2. Run routing engine (or use targetHospitalId for direct assignment)
  let bestHospital, allScores, winnerScore;
  if (payload.targetHospitalId) {
    // Force-assign to a specific hospital (for demo/simulation)
    bestHospital = store.hospitals.find(h => h.hospitalId === payload.targetHospitalId);
    const { allScores: scores, winnerScore: ws } = routeCase(
      store.hospitals,
      payload.patientLocation || { lat: 18.5204, lng: 73.8567 },
      severityData.specialistRequired,
      null,
      payload.requireLevel1Trauma || false
    );
    allScores = scores;
    winnerScore = scores.find(s => s.hospitalId === payload.targetHospitalId) || scores[0];
    console.log(`🎯 Force-assigned to hospital: ${bestHospital?.name}`);
  } else {
    const result = routeCase(
      store.hospitals,
      payload.patientLocation || { lat: 18.5204, lng: 73.8567 },
      severityData.specialistRequired,
      null,
      payload.requireLevel1Trauma || false
    );
    bestHospital = result.bestHospital;
    allScores = result.allScores;
    winnerScore = result.winnerScore;
  }

  // 3. Find available ambulance from best hospital
  const hospitalInStore = store.hospitals.find(h => h.hospitalId === bestHospital.hospitalId);
  const availableAmbulance = hospitalInStore
    ? hospitalInStore.ambulances.find(a => a.status === 'AVAILABLE')
    : null;

  // 4. Build the case object
  const caseObj = {
    caseId,
    patientLocation: payload.patientLocation || { lat: 18.5204, lng: 73.8567, addressText: 'Pune, Maharashtra' },
    symptoms: payload.symptoms || '',
    severity: severityData.severity,
    predictedNeeds: severityData.predictedNeeds,
    specialistRequired: severityData.specialistRequired,
    summaryForHospital: severityData.summaryForHospital,
    requireLevel1Trauma: payload.requireLevel1Trauma || false,
    status: 'ASSIGNED',
    assignedHospital: bestHospital ? {
      hospitalId: bestHospital.hospitalId,
      name: bestHospital.name,
      coordinates: bestHospital.coordinates,
      bedsAvailable: bestHospital.bedsAvailable,
      specialistsOnDuty: bestHospital.specialistsOnDuty,
      distanceKm: winnerScore.distanceKm
    } : null,
    assignedAmbulance: availableAmbulance ? {
      ambulanceId: availableAmbulance.ambulanceId,
      driverName: availableAmbulance.driverName,
      driverPhone: availableAmbulance.driverPhone,
      vehicleNumber: availableAmbulance.vehicleNumber
    } : null,
    routingScores: allScores,
    assignmentTimeSec: Math.round((Date.now() - startTime) / 1000 * 100) / 100,
    timestamp: new Date().toISOString()
  };

  // 5. Update store
  store.cases.unshift(caseObj);
  store.metrics.totalCasesToday++;
  store.metrics.totalAssignmentTimeMs += (Date.now() - startTime);
  store.metrics.assignmentCount++;

  // Update hospital beds
  if (hospitalInStore) {
    hospitalInStore.bedsAvailable = Math.max(0, hospitalInStore.bedsAvailable - 1);
    hospitalInStore.activeCases++;
    hospitalInStore.currentLoad = Math.min(100, Math.round((1 - hospitalInStore.bedsAvailable / hospitalInStore.bedsTotal) * 100));
  }

  return caseObj;
}

// ============================================================
// Socket.io Event Handlers
// ============================================================

io.on('connection', (socket) => {
  console.log(`✅ Client connected: ${socket.id}`);

  // --- Room Management ---
  socket.on('join:admin', () => {
    socket.join('admin');
    console.log(`📊 Admin joined: ${socket.id}`);
    // Send current state
    socket.emit('hospitals:list', { hospitals: store.hospitals });
    socket.emit('cases:history', { cases: store.cases });
  });

  socket.on('join:hospital', (data) => {
    const { hospitalId } = data;
    socket.join(`hospital:${hospitalId}`);
    console.log(`🏥 Hospital ${hospitalId} joined: ${socket.id}`);
    // Send hospital-specific data
    const hospital = store.hospitals.find(h => h.hospitalId === hospitalId);
    if (hospital) {
      socket.emit('hospital:update', { hospital });
    }
  });

  // --- Event 1: case:new — Patient submits emergency ---
  socket.on('case:new', (payload) => {
    console.log(`🚨 New case received:`, payload.symptoms);

    const caseObj = processNewCase(payload);

    // Emit to admin dashboard
    io.to('admin').emit('case:assigned', caseObj);

    // Emit to assigned hospital
    if (caseObj.assignedHospital) {
      io.to(`hospital:${caseObj.assignedHospital.hospitalId}`).emit('case:assigned', caseObj);
    }

    // Emit back to patient
    socket.emit('case:assigned', caseObj);

    // Emit updated hospital data to everyone
    io.emit('hospital:update', { hospitals: store.hospitals });

    console.log(`✅ Case ${caseObj.caseId} assigned to ${caseObj.assignedHospital?.name}`);
  });

  // --- Event 3: ambulance:dispatched — Hospital dispatches ambulance ---
  socket.on('ambulance:dispatched', (payload) => {
    const { caseId, ambulanceId, hospitalId } = payload;
    console.log(`🚑 Ambulance ${ambulanceId} dispatched for case ${caseId}`);

    // Find the case
    const caseObj = store.cases.find(c => c.caseId === caseId);
    if (!caseObj) return;

    // Update case status
    caseObj.status = 'DISPATCHED';

    // Find and update ambulance status
    const hospital = store.hospitals.find(h => h.hospitalId === hospitalId);
    if (hospital) {
      const ambulance = hospital.ambulances.find(a => a.ambulanceId === ambulanceId);
      if (ambulance) {
        ambulance.status = 'DISPATCHED';
        ambulance.assignedCaseId = caseId;

        // Start ambulance simulation
        const simInfo = startSimulation(
          io,
          caseId,
          ambulance,
          hospital.coordinates,
          caseObj.patientLocation
        );

        // Notify everyone
        io.emit('case:update', {
          caseId,
          status: 'DISPATCHED',
          ambulance: {
            ambulanceId: ambulance.ambulanceId,
            driverName: ambulance.driverName,
            vehicleNumber: ambulance.vehicleNumber,
            currentLocation: hospital.coordinates
          },
          estimatedTimeMinutes: simInfo.estimatedTimeMinutes,
          totalDistanceKm: simInfo.totalDistanceKm
        });

        io.emit('hospital:update', { hospitals: store.hospitals });

        console.log(`✅ Simulation started — ETA: ${simInfo.estimatedTimeMinutes} min`);
      }
    }
  });

  // --- case:rejected — Hospital cannot accept ---
  socket.on('case:rejected', (payload) => {
    const { caseId, hospitalId } = payload;
    console.log(`❌ Case ${caseId} rejected by hospital ${hospitalId}`);

    const caseObj = store.cases.find(c => c.caseId === caseId);
    if (!caseObj) return;

    // Re-route excluding rejected hospital
    const { bestHospital, allScores, winnerScore } = routeCase(
      store.hospitals,
      caseObj.patientLocation,
      caseObj.specialistRequired,
      hospitalId,
      caseObj.requireLevel1Trauma
    );

    // Update case
    const hospitalInStore = store.hospitals.find(h => h.hospitalId === bestHospital.hospitalId);
    const availableAmbulance = hospitalInStore
      ? hospitalInStore.ambulances.find(a => a.status === 'AVAILABLE')
      : null;

    caseObj.assignedHospital = {
      hospitalId: bestHospital.hospitalId,
      name: bestHospital.name,
      coordinates: bestHospital.coordinates,
      bedsAvailable: bestHospital.bedsAvailable,
      specialistsOnDuty: bestHospital.specialistsOnDuty,
      distanceKm: winnerScore.distanceKm
    };
    caseObj.assignedAmbulance = availableAmbulance ? {
      ambulanceId: availableAmbulance.ambulanceId,
      driverName: availableAmbulance.driverName,
      driverPhone: availableAmbulance.driverPhone,
      vehicleNumber: availableAmbulance.vehicleNumber
    } : null;
    caseObj.routingScores = allScores;
    caseObj.status = 'ASSIGNED';

    // Notify new hospital
    io.to(`hospital:${bestHospital.hospitalId}`).emit('case:assigned', caseObj);
    io.to('admin').emit('case:assigned', caseObj);
    io.emit('hospital:update', { hospitals: store.hospitals });

    console.log(`✅ Case ${caseId} re-routed to ${bestHospital.name}`);
  });

  // --- admin:triggerRoadClosure — Emergency road block — re-route en-route ambulances ---
  socket.on('admin:triggerRoadClosure', () => {
    console.log(`🚧 EMERGENCY ROAD CLOSURE TRIGGERED. Re-evaluating active cases...`);
    const dispatchedCases = store.cases.filter(c => c.status === 'DISPATCHED');
    
    dispatchedCases.forEach(caseObj => {
      const currentHospitalId = caseObj.assignedHospital.hospitalId;
      console.log(`Checking case ${caseObj.caseId} (currently going to ${caseObj.assignedHospital.name})...`);
      
      const { bestHospital, allScores, winnerScore } = routeCase(
        store.hospitals,
        caseObj.patientLocation,
        caseObj.specialistRequired,
        currentHospitalId, // Exclude current hospital due to road closure
        caseObj.requireLevel1Trauma
      );

      if (bestHospital && bestHospital.hospitalId !== currentHospitalId) {
        console.log(`🔄 Re-routing case ${caseObj.caseId} to better hospital: ${bestHospital.name}`);
        
        // Find new ambulance
        const hospitalInStore = store.hospitals.find(h => h.hospitalId === bestHospital.hospitalId);
        const availableAmbulance = hospitalInStore
          ? hospitalInStore.ambulances.find(a => a.status === 'AVAILABLE')
          : null;

        if (!availableAmbulance) {
          console.log(`⚠️  Could not find available ambulance at new hospital - keeping current assignment.`);
          return;
        }

        // Free up old ambulance
        const oldHospital = store.hospitals.find(h => h.hospitalId === currentHospitalId);
        if (oldHospital) {
           const oldAmb = oldHospital.ambulances.find(a => a.ambulanceId === caseObj.assignedAmbulance.ambulanceId);
           if (oldAmb) {
             oldAmb.status = 'AVAILABLE';
             oldAmb.assignedCaseId = null;
           }
        }

        // Cancel old simulation
        stopSimulation(caseObj.caseId);

        // Update case
        caseObj.assignedHospital = {
          hospitalId: bestHospital.hospitalId,
          name: bestHospital.name,
          coordinates: bestHospital.coordinates,
          bedsAvailable: bestHospital.bedsAvailable,
          specialistsOnDuty: bestHospital.specialistsOnDuty,
          distanceKm: winnerScore.distanceKm
        };
        caseObj.assignedAmbulance = {
          ambulanceId: availableAmbulance.ambulanceId,
          driverName: availableAmbulance.driverName,
          driverPhone: availableAmbulance.driverPhone,
          vehicleNumber: availableAmbulance.vehicleNumber
        };
        caseObj.routingScores = allScores;

        // Assign new ambulance
        availableAmbulance.status = 'DISPATCHED';
        availableAmbulance.assignedCaseId = caseObj.caseId;

        // Start new simulation from new hospital
        const simInfo = startSimulation(
          io,
          caseObj.caseId,
          availableAmbulance,
          bestHospital.coordinates,
          caseObj.patientLocation
        );

        // Notify UI components
        const updateData = {
          caseId: caseObj.caseId,
          assignedHospital: caseObj.assignedHospital,
          ambulance: {
            ambulanceId: availableAmbulance.ambulanceId,
            driverName: availableAmbulance.driverName,
            vehicleNumber: availableAmbulance.vehicleNumber,
            currentLocation: bestHospital.coordinates
          },
          estimatedTimeMinutes: simInfo.estimatedTimeMinutes,
          totalDistanceKm: simInfo.totalDistanceKm
        };
        
        // Broad event for the patient map to redraw
        io.emit('case:rerouted', updateData);
        // Refresh hospital panels
        io.emit('hospital:update', { hospitals: store.hospitals });
      }
    });
  });

  // --- Disconnect ---
  socket.on('disconnect', () => {
    console.log(`❎ Client disconnected: ${socket.id}`);
  });
});

// ============================================================
// Start Server
// ============================================================
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║   🚑 Pulses.life Backend Server                               ║
║   Running on http://localhost:${PORT}                          ║
║                                                              ║
║   REST Endpoints:                                            ║
║     GET  /api/hospitals  — All hospital data                 ║
║     GET  /api/cases      — All cases                         ║
║     GET  /api/metrics    — Live metrics                      ║
║     POST /api/case       — Create new case                   ║
║                                                              ║
║   Socket Events:                                             ║
║     case:new → case:assigned → ambulance:dispatched          ║
║     → ambulance:locationUpdate → ambulance:arrived           ║
║                                                              ║
║   Hospitals loaded: ${store.hospitals.length}                                    ║
║   Ambulances ready: ${store.hospitals.reduce((t, h) => t + h.ambulances.length, 0)}                                   ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
  `);
});
