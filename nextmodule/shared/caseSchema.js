// ============================================================
// Pulses.life — Shared Data Models
// This file is the CONTRACT between all 4 apps.
// Do NOT change field names without updating all consumers.
// ============================================================

// --- Enums ---

const SEVERITY = {
  LOW: 'LOW',
  MODERATE: 'MODERATE',
  CRITICAL: 'CRITICAL'
};

const CASE_STATUS = {
  PENDING: 'PENDING',
  ASSIGNED: 'ASSIGNED',
  DISPATCHED: 'DISPATCHED',
  ARRIVED: 'ARRIVED'
};

const AMBULANCE_STATUS = {
  AVAILABLE: 'AVAILABLE',
  DISPATCHED: 'DISPATCHED',
  RETURNING: 'RETURNING'
};

// --- Factory Functions ---

/**
 * Create a new Case object
 * @param {Object} params
 * @returns {Object} Case object
 */
function createCase({
  caseId,
  patientLocation = { lat: 0, lng: 0, addressText: '' },
  symptoms = '',
  severity = SEVERITY.MODERATE,
  predictedNeeds = [],
  specialistRequired = 'General',
  assignedHospital = null,
  assignedAmbulance = null,
  routingScores = []
}) {
  return {
    caseId,
    patientLocation,
    symptoms,
    severity,
    predictedNeeds,
    specialistRequired,
    status: CASE_STATUS.PENDING,
    assignedHospital,
    assignedAmbulance,
    routingScores,
    timestamp: new Date().toISOString()
  };
}

/**
 * Hospital object shape (reference)
 * {
 *   hospitalId: string,
 *   name: string,
 *   coordinates: { lat, lng },
 *   bedsAvailable: number,
 *   bedsTotal: number,
 *   specialistsOnDuty: string[],
 *   currentLoad: number (0-100),
 *   ambulances: AmbulanceObject[],
 *   activeCases: number
 * }
 */

/**
 * Ambulance object shape (reference)
 * {
 *   ambulanceId: string,
 *   driverName: string,
 *   driverPhone: string,
 *   vehicleNumber: string,
 *   status: AMBULANCE_STATUS,
 *   currentLocation: { lat, lng },
 *   assignedCaseId: string | null
 * }
 */

// --- Severity color mapping ---
const SEVERITY_COLORS = {
  LOW: { bg: '#10b981', text: '#ffffff', glow: 'rgba(16, 185, 129, 0.4)' },
  MODERATE: { bg: '#f59e0b', text: '#ffffff', glow: 'rgba(245, 158, 11, 0.4)' },
  CRITICAL: { bg: '#ef4444', text: '#ffffff', glow: 'rgba(239, 68, 68, 0.4)' }
};

// Export for both Node.js and browser
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { SEVERITY, CASE_STATUS, AMBULANCE_STATUS, createCase, SEVERITY_COLORS };
}
