// ============================================================
// MediRoute — Socket Event Constants
// Every socket event in the system is defined here.
// Do NOT use raw strings for event names anywhere else.
// ============================================================

const SOCKET_EVENTS = {
  // --- Case lifecycle ---
  CASE_NEW: 'case:new',               // Patient → Server: new emergency case
  CASE_ASSIGNED: 'case:assigned',       // Server → Admin + Hospital: case routed
  CASE_REJECTED: 'case:rejected',       // Hospital → Server: cannot accept, re-route
  CASE_UPDATE: 'case:update',           // Server → All: case status changed

  // --- Ambulance lifecycle ---
  AMBULANCE_DISPATCHED: 'ambulance:dispatched',     // Hospital → Server: ambulance sent
  AMBULANCE_LOCATION: 'ambulance:locationUpdate',   // Server → Patient + Admin: live position
  AMBULANCE_ARRIVED: 'ambulance:arrived',           // Server → All: ambulance reached patient

  // --- Room management ---
  JOIN_ADMIN: 'join:admin',             // Admin dashboard joins admin room
  JOIN_HOSPITAL: 'join:hospital',       // Hospital panel joins hospital-specific room

  // --- Hospital data ---
  HOSPITAL_UPDATE: 'hospital:update',   // Server → All: hospital data changed (beds, load)
  HOSPITALS_LIST: 'hospitals:list',     // Server → requester: full hospital list

  // --- Connection ---
  CONNECT: 'connection',
  DISCONNECT: 'disconnect'
};

// Export for both Node.js and browser
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { SOCKET_EVENTS };
}
