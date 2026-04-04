// ============================================================
// Pulses.life Admin Dashboard — Main Entry Point
// Connects to backend, manages all panels
// ============================================================

import { initCaseQueue, addCaseCard, updateCaseStatus } from './caseQueue.js';
import { initCityMap, addHospitalMarkers, highlightHospital, addAmbulanceMarker, updateAmbulanceMarker, addPatientMarker } from './cityMap.js';
import { initHospitalGrid, updateHospitalCards, flashHospitalCard } from './hospitalGrid.js';
import { initExplainerDrawer, showExplainer } from './explainerDrawer.js';
import { initMetricsBar, updateMetrics } from './metricsBar.js';

// ---- Configuration ----
const BACKEND_URL = 'http://localhost:3000';

// ---- Socket.io Connection ----
const socket = io(BACKEND_URL);

let totalCases = 0;
let hospitalsData = [];

socket.on('connect', () => {
  console.log('✅ Admin connected:', socket.id);
  // Join admin room
  socket.emit('join:admin');
  updateLiveStatus(true);
});

socket.on('disconnect', () => {
  updateLiveStatus(false);
});

function updateLiveStatus(connected) {
  const liveDot = document.querySelector('.live-dot');
  const liveLabel = document.querySelector('.metrics-live span');
  if (liveDot && liveLabel) {
    if (connected) {
      liveDot.style.background = 'var(--critical)';
      liveLabel.textContent = 'LIVE';
    } else {
      liveDot.style.background = 'var(--text-muted)';
      liveLabel.textContent = 'OFFLINE';
    }
  }
}

// ---- Alert Sound ----
function playNewCaseSound() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    // Three ascending tones — attention-grabbing without being annoying
    [440, 554, 660].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = freq;
      osc.type = 'sine';
      gain.gain.value = 0.1;
      const start = ctx.currentTime + i * 0.15;
      osc.start(start);
      osc.stop(start + 0.12);
    });
  } catch (e) { /* audio not available */ }
}

// ---- Initialize on DOM ready ----
document.addEventListener('DOMContentLoaded', () => {
  initCaseQueue();
  initCityMap();
  initHospitalGrid();
  initExplainerDrawer();
  initMetricsBar();

  // ---- Receive initial hospital data ----
  socket.on('hospitals:list', (data) => {
    console.log('🏥 Hospitals received:', data.hospitals.length);
    hospitalsData = data.hospitals;
    addHospitalMarkers(data.hospitals);
    updateHospitalCards(data.hospitals);
  });

  // ---- Receive case history ----
  socket.on('cases:history', (data) => {
    console.log('📜 Case history:', data.cases.length);
    data.cases.forEach(c => {
      addCaseCard(c, () => showExplainer(c));
    });
    totalCases = data.cases.length;
    updateMetrics(totalCases, 0, hospitalsData.filter(h => h.bedsAvailable > 0).length);
  });

  // ---- New case assigned ----
  socket.on('case:assigned', (caseData) => {
    console.log('🚨 New case assigned:', caseData.caseId);
    totalCases++;

    // Play notification sound
    playNewCaseSound();

    // Add to case queue
    addCaseCard(caseData, () => showExplainer(caseData));

    // Highlight hospital on map
    if (caseData.assignedHospital) {
      highlightHospital(caseData.assignedHospital.hospitalId);
      flashHospitalCard(caseData.assignedHospital.hospitalId, caseData);
    }

    // Add patient marker on map
    if (caseData.patientLocation) {
      addPatientMarker(caseData.patientLocation, caseData.caseId);
    }

    // Auto-open explainer
    showExplainer(caseData);

    // Update metrics
    updateMetrics(totalCases, caseData.assignmentTimeSec || 0, hospitalsData.filter(h => h.bedsAvailable > 0).length);
  });

  // ---- Hospital data update ----
  socket.on('hospital:update', (data) => {
    if (data.hospitals) {
      hospitalsData = data.hospitals;
      updateHospitalCards(data.hospitals);
    }
  });

  // ---- Case update (dispatch) ----
  socket.on('case:update', (data) => {
    console.log('🚑 Case update:', data);
    updateCaseStatus(data.caseId, data.status);

    if (data.status === 'DISPATCHED' && data.ambulance) {
      addAmbulanceMarker(
        data.ambulance.ambulanceId,
        data.ambulance.currentLocation,
        data.caseId
      );
    }
  });

  // ---- Ambulance location update ----
  socket.on('ambulance:locationUpdate', (data) => {
    updateAmbulanceMarker(data.ambulanceId, data.currentLocation);
  });

  // ---- Ambulance arrived ----
  socket.on('ambulance:arrived', (data) => {
    updateCaseStatus(data.caseId, 'ARRIVED');
  });
});
