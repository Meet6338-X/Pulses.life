// ============================================================
// MediRoute — Routing Engine
// Scores each hospital on a 100-point scale to find the 
// optimal match for an emergency case.
// ============================================================

/**
 * Haversine distance between two lat/lng points in kilometers
 */
function haversineDistance(lat1, lng1, lat2, lng2) {
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Score a single hospital for a given case
 * Returns detailed breakdown for explainability
 */
function scoreHospital(hospital, patientLocation, specialistRequired) {
  const scores = {
    hospitalId: hospital.hospitalId,
    hospitalName: hospital.name,
    distance: 0,
    distanceKm: 0,
    distanceScore: 0,
    bedScore: 0,
    specialistScore: 0,
    loadScore: 0,
    totalScore: 0,
    hasSpecialist: false,
    isAvailable: true
  };

  // --- Distance Score (0-30 points) ---
  // Closer = higher score. Max distance we consider is 30km.
  const dist = haversineDistance(
    patientLocation.lat, patientLocation.lng,
    hospital.coordinates.lat, hospital.coordinates.lng
  );
  scores.distanceKm = Math.round(dist * 10) / 10;
  scores.distanceScore = Math.max(0, Math.round(30 * (1 - dist / 30)));

  // --- Bed Availability Score (0-25 points) ---
  // More free beds = higher score
  if (hospital.bedsAvailable <= 0) {
    scores.bedScore = 0;
    scores.isAvailable = false;
  } else {
    const bedRatio = hospital.bedsAvailable / hospital.bedsTotal;
    scores.bedScore = Math.round(25 * bedRatio);
  }

  // --- Specialist Match Score (0-30 points) ---
  // Full points if required specialist is on duty
  const specialistsLower = hospital.specialistsOnDuty.map(s => s.toLowerCase());
  const requiredLower = (specialistRequired || 'general').toLowerCase();
  scores.hasSpecialist = specialistsLower.includes(requiredLower);
  scores.specialistScore = scores.hasSpecialist ? 30 : 0;

  // Partial points for "General" if they have any specialist
  if (!scores.hasSpecialist && specialistsLower.includes('general')) {
    scores.specialistScore = 10;
  }

  // --- Current Load Score (0-15 points) ---
  // Lower load = higher score
  scores.loadScore = Math.round(15 * (1 - hospital.currentLoad / 100));

  // --- Total ---
  scores.totalScore = scores.distanceScore + scores.bedScore + scores.specialistScore + scores.loadScore;

  return scores;
}

/**
 * Route a case to the best hospital
 * @param {Array} hospitals - All hospital objects
 * @param {Object} patientLocation - { lat, lng }
 * @param {string} specialistRequired - Required specialist type
 * @param {string|null} excludeHospitalId - Hospital to exclude (for re-routing)
 * @returns {{ bestHospital, allScores }} - Winner + full breakdown
 */
function routeCase(hospitals, patientLocation, specialistRequired, excludeHospitalId = null) {
  let candidates = hospitals;
  
  // Exclude rejected hospital if re-routing
  if (excludeHospitalId) {
    candidates = hospitals.filter(h => h.hospitalId !== excludeHospitalId);
  }

  // Score all hospitals
  const allScores = candidates.map(h => scoreHospital(h, patientLocation, specialistRequired));

  // Sort by total score descending, then by distance ascending for ties
  allScores.sort((a, b) => {
    if (b.totalScore !== a.totalScore) return b.totalScore - a.totalScore;
    return a.distanceKm - b.distanceKm;
  });

  // Winner is the top scorer with available beds
  const winner = allScores.find(s => s.isAvailable) || allScores[0];
  const bestHospital = candidates.find(h => h.hospitalId === winner.hospitalId);

  return {
    bestHospital,
    allScores,
    winnerScore: winner
  };
}

module.exports = { routeCase, haversineDistance, scoreHospital };
