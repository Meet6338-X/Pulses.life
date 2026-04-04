// ============================================================
// MediRoute Patient App — Tracking Map Module
// Leaflet.js with live ambulance position tracking
// ============================================================

let map = null;
let patientMarker = null;
let hospitalMarker = null;
let ambulanceMarker = null;
let routeLine = null;

const MAP_TILES = 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';

/**
 * Initialize the tracking map
 * @param {Object} patientLocation - { lat, lng }
 * @param {Object} hospitalLocation - { lat, lng }
 * @param {string} hospitalName
 */
export function initTrackingMap(patientLocation, hospitalLocation, hospitalName) {
  if (map) {
    map.remove();
    map = null;
  }

  map = L.map('trackingMap', {
    zoomControl: true,
    attributionControl: false
  });

  L.tileLayer(MAP_TILES, {
    subdomains: 'abcd',
    maxZoom: 19
  }).addTo(map);

  // Patient marker — pulsing blue dot
  const patientIcon = L.divIcon({
    className: 'patient-marker-wrapper',
    html: '<div class="patient-marker"></div>',
    iconSize: [20, 20],
    iconAnchor: [10, 10]
  });

  patientMarker = L.marker([patientLocation.lat, patientLocation.lng], {
    icon: patientIcon
  }).addTo(map).bindPopup('📍 Your Location');

  // Hospital marker — red circle with H
  const hospitalIcon = L.divIcon({
    className: 'hospital-marker-wrapper',
    html: '<div class="hospital-marker">H</div>',
    iconSize: [32, 32],
    iconAnchor: [16, 16]
  });

  hospitalMarker = L.marker([hospitalLocation.lat, hospitalLocation.lng], {
    icon: hospitalIcon
  }).addTo(map).bindPopup(`🏥 ${hospitalName}`);

  // Route line (dashed)
  routeLine = L.polyline(
    [[hospitalLocation.lat, hospitalLocation.lng], [patientLocation.lat, patientLocation.lng]],
    {
      color: '#2563eb',
      weight: 3,
      dashArray: '8, 8',
      opacity: 0.5
    }
  ).addTo(map);

  // Fit bounds to show both points
  const bounds = L.latLngBounds(
    [patientLocation.lat, patientLocation.lng],
    [hospitalLocation.lat, hospitalLocation.lng]
  );
  map.fitBounds(bounds.pad(0.3));

  // Ambulance marker — will be placed when dispatch starts
  const ambulanceIcon = L.divIcon({
    className: 'ambulance-marker-wrapper',
    html: '<div class="ambulance-marker">🚑</div>',
    iconSize: [36, 36],
    iconAnchor: [18, 18]
  });

  ambulanceMarker = L.marker([hospitalLocation.lat, hospitalLocation.lng], {
    icon: ambulanceIcon
  }).addTo(map).bindPopup('🚑 Ambulance');
}

/**
 * Update ambulance position on the map
 */
export function updateAmbulancePosition(lat, lng, progress, etaMinutes) {
  if (!ambulanceMarker) return;

  ambulanceMarker.setLatLng([lat, lng]);

  // Update the route line (from ambulance to patient)
  if (routeLine && patientMarker) {
    const patientPos = patientMarker.getLatLng();
    routeLine.setLatLngs([[lat, lng], [patientPos.lat, patientPos.lng]]);
  }

  // Update ETA display
  const etaValue = document.getElementById('etaValue');
  const trackingStatus = document.getElementById('trackingStatus');
  const trackingProgress = document.getElementById('trackingProgress');
  const trackingProgressText = document.getElementById('trackingProgressText');

  if (etaValue) etaValue.textContent = etaMinutes;
  if (trackingStatus) trackingStatus.textContent = `Ambulance en route • ${progress}% complete`;
  if (trackingProgress) trackingProgress.style.width = `${progress}%`;
  if (trackingProgressText) trackingProgressText.textContent = `${progress}%`;

  // Keep ambulance in view
  if (map) {
    map.panTo([lat, lng], { animate: true, duration: 1 });
  }
}

/**
 * Show arrived state
 */
export function showArrived() {
  const etaValue = document.getElementById('etaValue');
  const trackingStatus = document.getElementById('trackingStatus');
  const trackingProgress = document.getElementById('trackingProgress');
  const trackingProgressText = document.getElementById('trackingProgressText');

  if (etaValue) etaValue.textContent = '0';
  if (trackingStatus) {
    trackingStatus.textContent = '🎉 Ambulance has arrived!';
    trackingStatus.style.color = 'var(--success)';
  }
  if (trackingProgress) trackingProgress.style.width = '100%';
  if (trackingProgressText) trackingProgressText.textContent = '100%';

  // Update ambulance marker popup
  if (ambulanceMarker) {
    ambulanceMarker.bindPopup('🚑 Ambulance Arrived!').openPopup();
  }

  // Show a fullscreen arrived overlay
  const trackingScreen = document.getElementById('trackingScreen');
  if (trackingScreen) {
    const overlay = document.createElement('div');
    overlay.className = 'arrived-overlay';
    overlay.innerHTML = `
      <div class="arrived-icon">🚑</div>
      <div class="arrived-text">AMBULANCE ARRIVED</div>
      <div class="arrived-sub">Help is here. Stay calm.</div>
    `;
    trackingScreen.appendChild(overlay);
  }
}
