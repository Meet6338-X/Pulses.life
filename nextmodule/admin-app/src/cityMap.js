// ============================================================
// Pulses.life Admin — City Map Module (Center Column)
// Leaflet.js map with hospital/ambulance/patient markers
// Pune City Centric
// ============================================================

const MAP_TILES = 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';

let map = null;
let hospitalMarkers = {};
let ambulanceMarkers = {};
let patientMarkers = {};
let routeLines = {};

export function initCityMap() {
  map = L.map('cityMap', {
    center: [18.5204, 73.8567], // Pune center
    zoom: 12,
    zoomControl: true,
    attributionControl: false
  });

  L.tileLayer(MAP_TILES, {
    subdomains: 'abcd',
    maxZoom: 19
  }).addTo(map);
}

export function addHospitalMarkers(hospitals) {
  hospitals.forEach(h => {
    const icon = L.divIcon({
      className: 'admin-hospital-marker-wrapper',
      html: `<div class="admin-hospital-marker" id="map-hospital-${h.hospitalId}">H</div>`,
      iconSize: [28, 28],
      iconAnchor: [14, 14]
    });

    const marker = L.marker([h.coordinates.lat, h.coordinates.lng], { icon })
      .addTo(map)
      .bindPopup(`
        <div style="font-family:Inter,sans-serif;font-size:12px;">
          <strong>${h.name}</strong><br/>
          Beds: ${h.bedsAvailable}/${h.bedsTotal}<br/>
          Load: ${h.currentLoad}%<br/>
          Specialists: ${h.specialistsOnDuty.join(', ')}
        </div>
      `);

    hospitalMarkers[h.hospitalId] = marker;
  });
}

export function highlightHospital(hospitalId) {
  const markerEl = document.getElementById(`map-hospital-${hospitalId}`);
  if (markerEl) {
    markerEl.classList.add('assigned');
    // Remove animation after it plays
    setTimeout(() => markerEl.classList.remove('assigned'), 5000);
  }

  // Pan to hospital
  const marker = hospitalMarkers[hospitalId];
  if (marker && map) {
    map.flyTo(marker.getLatLng(), 13, { duration: 1 });
  }
}

export function addPatientMarker(location, caseId) {
  const icon = L.divIcon({
    className: 'admin-patient-marker-wrapper',
    html: '<div class="admin-patient-marker"></div>',
    iconSize: [14, 14],
    iconAnchor: [7, 7]
  });

  const marker = L.marker([location.lat, location.lng], { icon })
    .addTo(map)
    .bindPopup(`📍 Patient (${caseId.substring(0, 8)}...)`);

  patientMarkers[caseId] = marker;
}

export function addAmbulanceMarker(ambulanceId, location, caseId) {
  const icon = L.divIcon({
    className: 'admin-ambulance-marker-wrapper',
    html: '<div class="admin-ambulance-marker">🚑</div>',
    iconSize: [30, 30],
    iconAnchor: [15, 15]
  });

  const marker = L.marker([location.lat, location.lng], { icon })
    .addTo(map)
    .bindPopup(`🚑 Ambulance ${ambulanceId}`);

  ambulanceMarkers[ambulanceId] = { marker, caseId };

  // Draw dashed line from ambulance to patient
  const patientMarker = patientMarkers[caseId];
  if (patientMarker) {
    const line = L.polyline(
      [[location.lat, location.lng], patientMarker.getLatLng()],
      { color: '#2563eb', weight: 2, dashArray: '6, 6', opacity: 0.5 }
    ).addTo(map);
    routeLines[ambulanceId] = line;
  }
}

export function updateAmbulanceMarker(ambulanceId, location) {
  const amb = ambulanceMarkers[ambulanceId];
  if (!amb) return;

  amb.marker.setLatLng([location.lat, location.lng]);

  // Update route line
  const line = routeLines[ambulanceId];
  const patientMarker = patientMarkers[amb.caseId];
  if (line && patientMarker) {
    line.setLatLngs([[location.lat, location.lng], patientMarker.getLatLng()]);
  }
}
