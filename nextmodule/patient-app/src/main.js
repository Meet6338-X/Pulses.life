// ============================================================
// MediRoute Patient App — Main Entry Point
// Orchestrates chat → severity → tracking flow
// ============================================================

import { initChat, handleUserMessage, initVoiceRecognition } from './chat.js';
import { initSeverityCard, showSeverity, showAssignment } from './severityCard.js';
import { initTrackingMap, updateAmbulancePosition, showArrived } from './trackingMap.js';
import { createDemoButton, getActiveDemoLocation } from './demoMode.js';

// ---- Configuration ----
const BACKEND_URL = 'http://localhost:3000';

// ---- Socket.io Connection ----
const socket = io(BACKEND_URL);

socket.on('connect', () => {
  console.log('✅ Connected to MediRoute backend:', socket.id);
  updateConnectionUI(true);
});

socket.on('disconnect', () => {
  console.log('❎ Disconnected from backend');
  updateConnectionUI(false);
});

socket.on('connect_error', () => {
  updateConnectionUI(false);
});

function updateConnectionUI(connected) {
  const dot = document.getElementById('connDot');
  const label = document.getElementById('connLabel');
  if (dot && label) {
    if (connected) {
      dot.className = 'conn-dot';
      label.className = 'conn-label';
      label.textContent = 'LIVE';
    } else {
      dot.className = 'conn-dot disconnected';
      label.className = 'conn-label disconnected';
      label.textContent = 'OFFLINE';
    }
  }
}

// ---- State ----
let currentCaseId = null;
let patientLocation = null;

// ---- Get user's actual location ----
function getPatientLocation() {
  return new Promise((resolve) => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          resolve({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            addressText: `${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`
          });
        },
        () => {
          // Fallback: Pune center
          resolve({ lat: 18.5204, lng: 73.8567, addressText: 'Pune, Maharashtra' });
        },
        { timeout: 5000 }
      );
    } else {
      resolve({ lat: 18.5204, lng: 73.8567, addressText: 'Pune, Maharashtra' });
    }
  });
}

// ---- Screen Management ----
function showScreen(screenId) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  const screen = document.getElementById(screenId);
  if (screen) screen.classList.add('active');
}

// ---- Initialize ----
document.addEventListener('DOMContentLoaded', async () => {
  // Get location early
  patientLocation = await getPatientLocation();

  // Initialize severity card elements
  initSeverityCard();

  // Initialize chat
  const chatMessages = document.getElementById('chatMessages');
  const chatInput = document.getElementById('chatInput');
  const sendBtn = document.getElementById('sendBtn');
  const voiceBtn = document.getElementById('voiceBtn');

  initChat(chatMessages, chatInput, onConversationComplete);
  initVoiceRecognition(voiceBtn, chatInput);

  // Initialize demo mode (for hackathon presentation)
  createDemoButton(chatMessages, chatInput, onConversationComplete);

  // Send button
  sendBtn.addEventListener('click', () => {
    const text = chatInput.value.trim();
    if (text) {
      handleUserMessage(text);
      chatInput.value = '';
    }
  });

  // Enter key
  chatInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendBtn.click();
    }
  });

  // ---- Socket Event: case:assigned ----
  socket.on('case:assigned', (caseData) => {
    console.log('📋 Case assigned:', caseData);
    currentCaseId = caseData.caseId;
    showAssignment(caseData);

    // After 3 seconds, show tracking map
    setTimeout(() => {
      showScreen('trackingScreen');
      
      if (caseData.assignedHospital) {
        const mapPatientLocation = caseData.patientLocation || patientLocation;
        initTrackingMap(
          mapPatientLocation,
          caseData.assignedHospital.coordinates,
          caseData.assignedHospital.name
        );
      }
    }, 3000);
  });

  // ---- Socket Event: case:update (dispatch) ----
  socket.on('case:update', (data) => {
    console.log('🚑 Case update:', data);
    if (data.status === 'DISPATCHED') {
      const trackingStatus = document.getElementById('trackingStatus');
      if (trackingStatus) trackingStatus.textContent = `Ambulance dispatched! ETA: ${data.estimatedTimeMinutes} min`;

      const driverInfo = document.getElementById('driverInfo');
      if (driverInfo && data.ambulance) {
        driverInfo.innerHTML = `🚑 ${data.ambulance.vehicleNumber} • Driver: ${data.ambulance.driverName}`;
      }
    }
  });

  // ---- Socket Event: ambulance:locationUpdate ----
  socket.on('ambulance:locationUpdate', (data) => {
    if (currentCaseId && data.caseId === currentCaseId) {
      updateAmbulancePosition(
        data.currentLocation.lat,
        data.currentLocation.lng,
        data.progress,
        data.etaMinutes
      );
    }
  });

  // ---- Socket Event: ambulance:arrived ----
  socket.on('ambulance:arrived', (data) => {
    console.log('🎉 Ambulance arrived!');
    if (data.caseId === currentCaseId) {
      showArrived();
    }
  });
});

// ---- Conversation Complete Handler ----
async function onConversationComplete(symptomsText) {
  console.log('🧠 Processing symptoms:', symptomsText);

  // Switch to severity screen
  showScreen('severityScreen');

  // Generate a case ID
  currentCaseId = 'case-' + Date.now() + '-' + Math.random().toString(36).substr(2, 6);

  // Show severity analysis
  const localSeverity = extractLocalSeverity(symptomsText);
  showSeverity(localSeverity);

  // Check if demo mode provided a specific location
  const demoLocation = getActiveDemoLocation();
  const caseLocation = demoLocation || patientLocation;
  if (demoLocation) patientLocation = demoLocation;

  // Fire the case to the server
  socket.emit('case:new', {
    caseId: currentCaseId,
    patientLocation: caseLocation,
    symptoms: symptomsText
  });
}

// ---- Local severity extraction (mirrors backend for instant UI) ----
function extractLocalSeverity(text) {
  const t = text.toLowerCase();
  
  if (t.includes('chest') || t.includes('heart') || t.includes('cardiac') || t.includes('seene') || t.includes('dil')) {
    return { severity: 'CRITICAL', predictedNeeds: ['ICU', 'Cardiologist', 'Ventilator'], specialistRequired: 'Cardiologist' };
  }
  if (t.includes('stroke') || t.includes('brain') || t.includes('seizure') || t.includes('behosh') || t.includes('dimag')) {
    return { severity: 'CRITICAL', predictedNeeds: ['ICU', 'Neurologist', 'Ventilator'], specialistRequired: 'Neurologist' };
  }
  if (t.includes('accident') || t.includes('crash') || t.includes('bleeding') || t.includes('hadsa')) {
    return { severity: 'CRITICAL', predictedNeeds: ['ICU', 'Trauma Surgeon'], specialistRequired: 'Trauma Surgeon' };
  }
  if (t.includes('fracture') || t.includes('broken') || t.includes('haddi') || t.includes('toot')) {
    return { severity: 'MODERATE', predictedNeeds: ['Orthopedic', 'General'], specialistRequired: 'Orthopedic' };
  }
  if (t.includes('breath') || t.includes('asthma') || t.includes('saans') || t.includes('oxygen')) {
    return { severity: 'CRITICAL', predictedNeeds: ['ICU', 'Ventilator', 'General'], specialistRequired: 'General' };
  }
  if (t.includes('fever') || t.includes('cough') || t.includes('cold') || t.includes('bukhar')) {
    return { severity: 'LOW', predictedNeeds: ['General'], specialistRequired: 'General' };
  }
  return { severity: 'MODERATE', predictedNeeds: ['General'], specialistRequired: 'General' };
}
