// ============================================================
// Pulses.life — Ambulance Simulator
// Simulates ambulance movement from hospital to patient 
// location by interpolating coordinates every 2 seconds.
// For demo: accelerated to arrive in ~30 seconds for wow factor.
// ============================================================

const activeSimulations = new Map();

/**
 * Start simulating ambulance movement
 * @param {Object} io - Socket.io server instance
 * @param {string} caseId - Case being served
 * @param {Object} ambulance - Ambulance object with currentLocation
 * @param {Object} hospitalCoords - Hospital { lat, lng }
 * @param {Object} patientCoords - Patient { lat, lng }
 */
function startSimulation(io, caseId, ambulance, hospitalCoords, patientCoords) {
  const INTERVAL_MS = 1000;     // Update every 1 second (faster for demo)
  
  // Calculate total distance
  const totalDistance = haversineDistance(
    hospitalCoords.lat, hospitalCoords.lng,
    patientCoords.lat, patientCoords.lng
  );
  
  // For demo: always arrive in ~25 seconds regardless of distance
  const DEMO_DURATION_SEC = 25;
  const totalSteps = Math.ceil(DEMO_DURATION_SEC / (INTERVAL_MS / 1000));
  
  // Back-calculate speed for realistic display
  const effectiveSpeedKmh = Math.round((totalDistance / DEMO_DURATION_SEC) * 3600);
  
  let currentStep = 0;
  
  console.log(`🚑 Simulation: ${totalDistance.toFixed(1)}km, ${totalSteps} steps, ~${DEMO_DURATION_SEC}s`);
  
  const intervalId = setInterval(() => {
    currentStep++;
    const progress = Math.min(currentStep / totalSteps, 1);
    
    // Ease-in-out interpolation for more realistic movement
    const easedProgress = progress < 0.5
      ? 2 * progress * progress
      : 1 - Math.pow(-2 * progress + 2, 2) / 2;
    
    // Interpolation between hospital and patient with easing
    const currentLat = hospitalCoords.lat + (patientCoords.lat - hospitalCoords.lat) * easedProgress;
    const currentLng = hospitalCoords.lng + (patientCoords.lng - hospitalCoords.lng) * easedProgress;
    
    // Remaining distance and ETA
    const remainingDistance = totalDistance * (1 - progress);
    const remainingSteps = totalSteps - currentStep;
    const etaSeconds = Math.round(remainingSteps * (INTERVAL_MS / 1000));
    const etaMinutes = Math.max(0, Math.ceil(etaSeconds / 60));
    
    const locationUpdate = {
      caseId,
      ambulanceId: ambulance.ambulanceId,
      currentLocation: { lat: currentLat, lng: currentLng },
      progress: Math.round(progress * 100),
      remainingDistanceKm: Math.round(remainingDistance * 10) / 10,
      etaSeconds,
      etaMinutes,
      driverName: ambulance.driverName,
      vehicleNumber: ambulance.vehicleNumber
    };
    
    // Emit to all connected clients
    io.emit('ambulance:locationUpdate', locationUpdate);
    
    // Check if arrived
    if (progress >= 1) {
      clearInterval(intervalId);
      activeSimulations.delete(caseId);
      
      console.log(`🎉 Ambulance arrived for case ${caseId}`);
      
      // Emit arrived event
      io.emit('ambulance:arrived', {
        caseId,
        ambulanceId: ambulance.ambulanceId,
        arrivedAt: new Date().toISOString()
      });
    }
  }, INTERVAL_MS);
  
  // Store reference so we can cancel if needed
  activeSimulations.set(caseId, intervalId);
  
  // Return initial ETA
  return {
    totalDistanceKm: Math.round(totalDistance * 10) / 10,
    estimatedTimeMinutes: Math.ceil(DEMO_DURATION_SEC / 60),
    totalSteps
  };
}

/**
 * Stop an active simulation
 */
function stopSimulation(caseId) {
  const intervalId = activeSimulations.get(caseId);
  if (intervalId) {
    clearInterval(intervalId);
    activeSimulations.delete(caseId);
  }
}

/**
 * Haversine distance (duplicated here for self-containment)
 */
function haversineDistance(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

module.exports = { startSimulation, stopSimulation };
