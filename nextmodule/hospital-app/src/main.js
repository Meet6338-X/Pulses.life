// ============================================================
// Pulses.life Hospital Panel — Main Entry Point
// Hospital selector → status board → map → incoming alert → dispatch
// Pune-Centric with Leaflet Map + Real-time Ambulance Tracking
// ============================================================

// ---- Configuration ----
const BACKEND_URL = 'http://localhost:3000';

// ---- State ----
let selectedHospitalId = null;
let selectedHospital = null;
let currentCase = null;
let hospitalData = null;
let caseHistory = [];
let map = null;
let hospitalMarkers = {};
let ambulanceMarker = null;
let patientMarker = null;
let routeLine = null;
let allHospitals = [];

// ---- Pune Landmarks for map context ----
const PUNE_CENTER = { lat: 18.5204, lng: 73.8567 };
const PUNE_BOUNDS = [[18.42, 73.76], [18.63, 73.98]];

// ---- Custom Map Icons ----
function createIcon(emoji, size, className) {
  return L.divIcon({
    html: `<div class="map-icon ${className || ''}">${emoji}</div>`,
    className: 'custom-map-icon',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2]
  });
}

const hospitalIcon = createIcon('🏥', 36, 'hospital-icon');
const selectedHospitalIcon = createIcon('🏥', 44, 'selected-hospital-icon');
const ambulanceIcon = createIcon('🚑', 40, 'ambulance-icon');
const patientIcon = createIcon('🆘', 36, 'patient-icon');

// ---- Socket.io Connection ----
const socket = io(BACKEND_URL);

socket.on('connect', () => {
  console.log('✅ Hospital panel connected:', socket.id);
  updateLiveIndicator(true);
});

socket.on('disconnect', () => {
  updateLiveIndicator(false);
});

function updateLiveIndicator(connected) {
  const indicator = document.querySelector('.live-indicator');
  if (!indicator) return;
  const dot = indicator.querySelector('.live-dot');
  const label = indicator.querySelector('span');
  if (dot && label) {
    dot.style.background = connected ? 'var(--success)' : 'var(--critical)';
    label.textContent = connected ? 'LIVE' : 'OFFLINE';
    label.style.color = connected ? 'var(--success)' : 'var(--critical)';
  }
}

// ---- Initialize ----
document.addEventListener('DOMContentLoaded', () => {
  loadHospitals();
  setupEventListeners();
});

// ---- Load hospitals for selector ----
async function loadHospitals() {
  try {
    const res = await fetch(`${BACKEND_URL}/api/hospitals`);
    const data = await res.json();
    hospitalData = data.hospitals;
    allHospitals = data.hospitals;
    renderSelector(data.hospitals);
  } catch (err) {
    console.error('Failed to load hospitals:', err);
    setTimeout(loadHospitals, 2000);
    document.getElementById('selectorGrid').innerHTML = `
      <div style="grid-column:1/-1;text-align:center;color:var(--text-muted);padding:20px;">
        ⏳ Connecting to server... Make sure backend is running on ${BACKEND_URL}
      </div>
    `;
  }
}

// ---- Render hospital selector ----
function renderSelector(hospitals) {
  const grid = document.getElementById('selectorGrid');
  grid.innerHTML = '';

  hospitals.forEach(h => {
    const card = document.createElement('div');
    card.className = 'selector-card';
    const loadColor = h.currentLoad > 70 ? '#dc2626' : h.currentLoad > 50 ? '#d97706' : '#059669';
    card.innerHTML = `
      <div class="selector-card-name">${h.name}</div>
      <div class="selector-card-info">${h.bedsAvailable}/${h.bedsTotal} beds • ${h.ambulances.length} ambulances</div>
      <div class="selector-card-load">
        <div class="load-bar"><div class="load-fill" style="width:${h.currentLoad}%;background:${loadColor}"></div></div>
        <span class="load-text" style="color:${loadColor}">${h.currentLoad}% load</span>
      </div>
    `;
    card.addEventListener('click', () => selectHospital(h));
    grid.appendChild(card);
  });
}

// ---- Select a hospital ----
function selectHospital(hospital) {
  selectedHospitalId = hospital.hospitalId;
  selectedHospital = hospital;

  // Join hospital socket room
  socket.emit('join:hospital', { hospitalId: selectedHospitalId });

  // Hide selector, show main panel
  document.getElementById('hospitalSelector').style.display = 'none';
  document.getElementById('mainPanel').classList.remove('hidden');

  // Update header
  document.getElementById('panelHospitalName').textContent = hospital.name;

  // Update stats
  updateStats(hospital);

  // Render ambulance list
  renderAmbulanceList(hospital.ambulances);

  // Initialize map
  setTimeout(() => initMap(hospital), 200);

  console.log(`🏥 Selected hospital: ${hospital.name} (${hospital.hospitalId})`);
}

// ---- Initialize Leaflet Map ----
function initMap(hospital) {
  if (map) {
    map.remove();
    map = null;
  }

  map = L.map('hospitalMap', {
    center: [PUNE_CENTER.lat, PUNE_CENTER.lng],
    zoom: 13,
    zoomControl: true,
    attributionControl: false
  });

  // Use a clean, modern tile layer
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 18,
    attribution: '© OpenStreetMap'
  }).addTo(map);

  // Add all hospitals as markers
  allHospitals.forEach(h => {
    const isSelected = h.hospitalId === selectedHospitalId;
    const icon = isSelected ? selectedHospitalIcon : hospitalIcon;
    const marker = L.marker([h.coordinates.lat, h.coordinates.lng], { icon })
      .addTo(map)
      .bindPopup(`
        <div style="font-family:Inter,sans-serif;min-width:180px;">
          <div style="font-weight:800;font-size:13px;margin-bottom:6px;">${h.name}</div>
          <div style="font-size:11px;color:#64748b;">
            🛏️ ${h.bedsAvailable}/${h.bedsTotal} beds<br/>
            🚑 ${h.ambulances.length} ambulances<br/>
            👨‍⚕️ ${h.specialistsOnDuty.join(', ')}
          </div>
        </div>
      `);

    if (isSelected) {
      marker.openPopup();
    }

    hospitalMarkers[h.hospitalId] = marker;
  });

  // Fit map to show all hospitals
  const allCoords = allHospitals.map(h => [h.coordinates.lat, h.coordinates.lng]);
  if (allCoords.length > 0) {
    map.fitBounds(allCoords, { padding: [30, 30] });
  }

  // Add Pune boundary circle for context
  L.circle([PUNE_CENTER.lat, PUNE_CENTER.lng], {
    radius: 8000,
    color: '#2563eb',
    fillColor: '#2563eb',
    fillOpacity: 0.03,
    weight: 1,
    dashArray: '5, 10',
    opacity: 0.3
  }).addTo(map);
}

// ---- Update stats ----
function updateStats(hospital) {
  const bedEl = document.getElementById('statBeds');
  const caseEl = document.getElementById('statCases');
  const ambEl = document.getElementById('statAmbulances');
  
  if (bedEl) bedEl.textContent = hospital.bedsAvailable;
  if (caseEl) caseEl.textContent = hospital.activeCases;
  
  const readyAmbulances = hospital.ambulances.filter(a => a.status === 'AVAILABLE').length;
  if (ambEl) ambEl.textContent = readyAmbulances;
}

// ---- Render ambulance list ----
function renderAmbulanceList(ambulances) {
  const list = document.getElementById('ambulanceList');
  list.innerHTML = '';

  ambulances.forEach(amb => {
    const row = document.createElement('div');
    row.className = 'ambulance-row';
    row.id = `amb-row-${amb.ambulanceId}`;

    const statusClass = amb.status === 'AVAILABLE' ? 'status-available' :
                        amb.status === 'DISPATCHED' ? 'status-enroute' : 'status-dispatched';
    const statusText = amb.status === 'DISPATCHED' ? 'EN ROUTE' : amb.status;

    row.innerHTML = `
      <div class="ambulance-row-left">
        <div class="ambulance-driver">👤 ${amb.driverName}</div>
        <div class="ambulance-vehicle">${amb.vehicleNumber}</div>
      </div>
      <div class="ambulance-status-chip ${statusClass}" id="amb-status-${amb.ambulanceId}">
        ${statusText}
      </div>
    `;
    list.appendChild(row);
  });
}

// ---- Setup socket event listeners ----
function setupEventListeners() {
  // Incoming case assigned to this hospital
  socket.on('case:assigned', (caseData) => {
    console.log('🚨 Incoming case:', caseData);
    currentCase = caseData;
    showIncomingAlert(caseData);
  });

  // Hospital data update
  socket.on('hospital:update', (data) => {
    if (data.hospitals && selectedHospitalId) {
      const updated = data.hospitals.find(h => h.hospitalId === selectedHospitalId);
      if (updated) {
        selectedHospital = updated;
        updateStats(updated);
        renderAmbulanceList(updated.ambulances);
      }
      // Also update allHospitals for map
      allHospitals = data.hospitals;
    }
    if (data.hospital && data.hospital.hospitalId === selectedHospitalId) {
      selectedHospital = data.hospital;
      updateStats(data.hospital);
      renderAmbulanceList(data.hospital.ambulances);
    }
  });

  // Ambulance location updates — show on map
  socket.on('ambulance:locationUpdate', (data) => {
    if (map && data.currentLocation) {
      updateAmbulanceOnMap(data);
    }
  });

  // Ambulance arrived
  socket.on('ambulance:arrived', (data) => {
    console.log('🎉 Ambulance arrived for case:', data.caseId);
    if (ambulanceMarker) {
      ambulanceMarker.setIcon(createIcon('✅', 40, 'arrived-icon'));
      ambulanceMarker.bindPopup('<b>Ambulance Arrived!</b>').openPopup();
    }
    // Add to case history
    addCaseToHistory(data.caseId, 'ARRIVED');
  });

  // Setup dispatch button
  const dispatchBtn = document.getElementById('dispatchBtn');
  const rejectBtn = document.getElementById('rejectBtn');
  
  if (dispatchBtn) {
    dispatchBtn.addEventListener('click', handleDispatch);
  }
  if (rejectBtn) {
    rejectBtn.addEventListener('click', handleReject);
  }
}

// ---- Update ambulance marker on map ----
function updateAmbulanceOnMap(data) {
  const { currentLocation, progress, etaMinutes, driverName, vehicleNumber } = data;

  if (ambulanceMarker) {
    ambulanceMarker.setLatLng([currentLocation.lat, currentLocation.lng]);
  } else {
    ambulanceMarker = L.marker([currentLocation.lat, currentLocation.lng], {
      icon: ambulanceIcon,
      zIndexOffset: 1000
    }).addTo(map);
  }

  ambulanceMarker.bindPopup(`
    <div style="font-family:Inter,sans-serif;min-width:160px;">
      <div style="font-weight:800;font-size:13px;margin-bottom:4px;">🚑 ${vehicleNumber || ''}</div>
      <div style="font-size:11px;color:#64748b;">
        Driver: ${driverName || 'N/A'}<br/>
        Progress: ${progress}%<br/>
        ETA: ${etaMinutes} min
      </div>
      <div style="margin-top:6px;height:4px;background:#e2e8f0;border-radius:2px;overflow:hidden;">
        <div style="height:100%;width:${progress}%;background:linear-gradient(90deg,#2563eb,#059669);border-radius:2px;"></div>
      </div>
    </div>
  `);

  // Update the route line
  if (routeLine && patientMarker) {
    const patientLatLng = patientMarker.getLatLng();
    routeLine.setLatLngs([
      [currentLocation.lat, currentLocation.lng],
      [patientLatLng.lat, patientLatLng.lng]
    ]);
  }
}

// ---- Play emergency alert sound ----
function playAlertSound() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    [800, 600, 800, 600].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = freq;
      osc.type = 'square';
      gain.gain.value = 0.12;
      const start = ctx.currentTime + i * 0.25;
      osc.start(start);
      osc.stop(start + 0.2);
    });
  } catch (e) { /* audio not available */ }
}

// ---- Show incoming alert ----
function showIncomingAlert(caseData) {
  const alert = document.getElementById('incomingAlert');
  const overlay = document.getElementById('dimOverlay');

  // Play alert sound
  playAlertSound();

  // Set alert content
  const severityEl = document.getElementById('alertSeverity');
  if (severityEl) {
    severityEl.textContent = caseData.severity;
    severityEl.className = 'alert-severity severity-' + (caseData.severity || 'MODERATE').toLowerCase();
    if (caseData.severity === 'CRITICAL') severityEl.style.textShadow = '0 0 20px rgba(255,255,255,0.5)';
  }
  
  document.getElementById('alertNeeds').innerHTML = `<strong>Needs:</strong> ${(caseData.predictedNeeds || []).join(', ')}`;
  document.getElementById('alertSpecialist').innerHTML = `<strong>Specialist Required:</strong> ${caseData.specialistRequired || 'General'}`;
  document.getElementById('alertSummary').innerHTML = `<strong>Summary:</strong> ${caseData.summaryForHospital || 'Emergency case requiring immediate attention'}`;
  
  // Show patient location
  const locEl = document.getElementById('alertLocation');
  if (locEl && caseData.patientLocation) {
    locEl.innerHTML = `<strong>📍 Location:</strong> ${caseData.patientLocation.addressText || `${caseData.patientLocation.lat.toFixed(4)}, ${caseData.patientLocation.lng.toFixed(4)}`}`;
  }

  // Show patient on map
  if (map && caseData.patientLocation) {
    showPatientOnMap(caseData.patientLocation);
  }

  // Show alert and dim background
  alert.classList.remove('hidden');
  overlay.classList.remove('hidden');
}

// ---- Show patient marker on map ----
function showPatientOnMap(location) {
  // Remove old patient marker
  if (patientMarker) {
    map.removeLayer(patientMarker);
  }
  if (routeLine) {
    map.removeLayer(routeLine);
  }

  // Add patient marker
  patientMarker = L.marker([location.lat, location.lng], {
    icon: patientIcon,
    zIndexOffset: 900
  }).addTo(map).bindPopup(`
    <div style="font-family:Inter,sans-serif;">
      <div style="font-weight:800;font-size:13px;color:#dc2626;">🆘 Patient Location</div>
      <div style="font-size:11px;color:#64748b;margin-top:4px;">
        ${location.addressText || `${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}`}
      </div>
    </div>
  `).openPopup();

  // Draw line from hospital to patient
  if (selectedHospital) {
    routeLine = L.polyline([
      [selectedHospital.coordinates.lat, selectedHospital.coordinates.lng],
      [location.lat, location.lng]
    ], {
      color: '#dc2626',
      weight: 3,
      dashArray: '8, 12',
      opacity: 0.7
    }).addTo(map);

    // Fit map to show both hospital and patient
    map.fitBounds([
      [selectedHospital.coordinates.lat, selectedHospital.coordinates.lng],
      [location.lat, location.lng]
    ], { padding: [60, 60] });
  }
}

// ---- Handle dispatch ----
function handleDispatch() {
  if (!currentCase || !selectedHospital) {
    console.warn('No current case or hospital selected');
    return;
  }

  // Find first available ambulance
  const ambulance = selectedHospital.ambulances.find(a => a.status === 'AVAILABLE');
  if (!ambulance) {
    const alertEl = document.getElementById('alertSummary');
    if (alertEl) alertEl.innerHTML = '<strong style="color:#f59e0b;">⚠️ No ambulances available! Reject to re-route.</strong>';
    return;
  }

  console.log(`🚑 Dispatching ambulance ${ambulance.ambulanceId} for case ${currentCase.caseId}`);

  // Emit dispatch event to backend
  socket.emit('ambulance:dispatched', {
    caseId: currentCase.caseId,
    ambulanceId: ambulance.ambulanceId,
    hospitalId: selectedHospitalId
  });

  // Hide alert
  document.getElementById('incomingAlert').classList.add('hidden');

  // Show dispatched confirmation
  const confirm = document.getElementById('dispatchedConfirm');
  const confirmSub = document.getElementById('dispatchedSub');
  if (confirmSub) {
    confirmSub.textContent = `${ambulance.vehicleNumber} • Driver: ${ambulance.driverName}`;
  }
  confirm.classList.remove('hidden');

  // Update ambulance status in UI
  const statusEl = document.getElementById(`amb-status-${ambulance.ambulanceId}`);
  if (statusEl) {
    statusEl.className = 'ambulance-status-chip status-enroute';
    statusEl.textContent = 'EN ROUTE';
  }

  // Show ambulance on map starting from hospital
  if (map && selectedHospital) {
    // Place initial ambulance marker at hospital
    if (ambulanceMarker) {
      map.removeLayer(ambulanceMarker);
    }
    ambulanceMarker = L.marker(
      [selectedHospital.coordinates.lat, selectedHospital.coordinates.lng],
      { icon: ambulanceIcon, zIndexOffset: 1000 }
    ).addTo(map).bindPopup(`
      <div style="font-family:Inter,sans-serif;">
        <div style="font-weight:800;font-size:13px;">🚑 ${ambulance.vehicleNumber}</div>
        <div style="font-size:11px;color:#64748b;">Driver: ${ambulance.driverName}<br/>Status: Dispatched</div>
      </div>
    `);

    // Update route line from ambulance to patient
    if (routeLine) {
      map.removeLayer(routeLine);
    }
    if (currentCase.patientLocation) {
      routeLine = L.polyline([
        [selectedHospital.coordinates.lat, selectedHospital.coordinates.lng],
        [currentCase.patientLocation.lat, currentCase.patientLocation.lng]
      ], {
        color: '#2563eb',
        weight: 3,
        dashArray: '8, 12',
        opacity: 0.8
      }).addTo(map);
    }
  }

  // Add case to history
  addCaseToHistory(currentCase.caseId, 'DISPATCHED', currentCase);

  // Hide confirmation after 3 seconds
  setTimeout(() => {
    confirm.classList.add('hidden');
    document.getElementById('dimOverlay').classList.add('hidden');
  }, 3000);

  console.log(`✅ Dispatched ambulance ${ambulance.ambulanceId} for case ${currentCase.caseId}`);
}

// ---- Handle reject ----
function handleReject() {
  if (!currentCase) return;

  // Emit rejection
  socket.emit('case:rejected', {
    caseId: currentCase.caseId,
    hospitalId: selectedHospitalId
  });

  // Hide alert
  document.getElementById('incomingAlert').classList.add('hidden');
  document.getElementById('dimOverlay').classList.add('hidden');

  // Remove patient marker
  if (patientMarker) {
    map.removeLayer(patientMarker);
    patientMarker = null;
  }
  if (routeLine) {
    map.removeLayer(routeLine);
    routeLine = null;
  }

  addCaseToHistory(currentCase.caseId, 'REJECTED', currentCase);
  currentCase = null;
  console.log('❌ Case rejected, re-routing...');
}

// ---- Add case to history panel ----
function addCaseToHistory(caseId, status, caseData) {
  const historyEl = document.getElementById('caseHistory');
  
  // Remove empty state
  const emptyEl = historyEl.querySelector('.case-history-empty');
  if (emptyEl) emptyEl.remove();

  const entry = document.createElement('div');
  entry.className = 'case-entry';

  const statusClass = status === 'DISPATCHED' ? 'entry-dispatched' :
                      status === 'ARRIVED' ? 'entry-arrived' :
                      status === 'REJECTED' ? 'entry-rejected' : '';

  const statusIcon = status === 'DISPATCHED' ? '🚑' :
                     status === 'ARRIVED' ? '✅' :
                     status === 'REJECTED' ? '❌' : '📋';

  const time = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  const severity = caseData?.severity || '—';

  entry.innerHTML = `
    <div class="case-entry-left">
      <div class="case-entry-icon">${statusIcon}</div>
      <div>
        <div class="case-entry-id">${caseId.substring(0, 16)}...</div>
        <div class="case-entry-time">${time} • ${severity}</div>
      </div>
    </div>
    <div class="case-entry-status ${statusClass}">${status}</div>
  `;

  historyEl.prepend(entry);
  caseHistory.push({ caseId, status, timestamp: Date.now() });
}
