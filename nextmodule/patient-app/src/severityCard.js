// ============================================================
// MediRoute Patient App — Severity Card Module
// Displays AI severity analysis with animated bar
// ============================================================

let severityScreen = null;
let severityBadge = null;
let severityBar = null;
let severityNeeds = null;
let severitySpecialist = null;
let severityStatus = null;
let assignmentCard = null;

export function initSeverityCard() {
  severityScreen = document.getElementById('severityScreen');
  severityBadge = document.getElementById('severityBadge');
  severityBar = document.getElementById('severityBar');
  severityNeeds = document.getElementById('severityNeeds');
  severitySpecialist = document.getElementById('severitySpecialist');
  severityStatus = document.getElementById('severityStatus');
  assignmentCard = document.getElementById('assignmentCard');
}

/**
 * Show severity analysis with animated bar fill
 */
export function showSeverity(severityData) {
  const { severity, predictedNeeds, specialistRequired } = severityData;

  // Set badge
  severityBadge.textContent = severity;
  severityBadge.className = 'severity-badge ' + severity.toLowerCase();

  // Set bar
  severityBar.className = 'severity-bar ' + severity.toLowerCase();
  const widths = { CRITICAL: '95%', MODERATE: '60%', LOW: '30%' };
  setTimeout(() => {
    severityBar.style.width = widths[severity] || '50%';
  }, 100);

  // Set needs tags
  severityNeeds.innerHTML = '';
  predictedNeeds.forEach(need => {
    const tag = document.createElement('span');
    tag.className = 'need-tag';
    tag.textContent = need;
    severityNeeds.appendChild(tag);
  });

  // Set specialist
  severitySpecialist.innerHTML = `Required specialist: <strong>${specialistRequired}</strong>`;

  // Show connecting status
  severityStatus.innerHTML = `
    <div class="connecting-pulse"></div>
    <span>Connecting to dispatch network...</span>
  `;
}

/**
 * Show hospital assignment after routing
 */
export function showAssignment(caseData) {
  // Update status to assigned
  severityStatus.innerHTML = `
    <span style="color: var(--success);">✅ Hospital assigned successfully</span>
  `;

  // Show assignment card
  assignmentCard.classList.remove('hidden');

  const hospital = caseData.assignedHospital;
  if (!hospital) return;

  document.getElementById('assignedHospitalName').textContent = hospital.name;
  document.getElementById('assignedDistance').textContent = `${hospital.distanceKm} km away • ~${Math.ceil(hospital.distanceKm * 2)} min drive`;
  document.getElementById('assignedSpecialist').textContent = `${caseData.specialistRequired} confirmed on duty`;
  document.getElementById('assignedBeds').textContent = `${hospital.bedsAvailable} beds available`;

  // Routing reason
  const reason = document.getElementById('assignmentReason');
  const topScore = caseData.routingScores?.[0];
  if (topScore) {
    reason.textContent = `Selected because: Specialist match (${topScore.specialistScore}/30), Distance score (${topScore.distanceScore}/30), Bed availability (${topScore.bedScore}/25), Load score (${topScore.loadScore}/15). Total: ${topScore.totalScore}/100`;
  } else {
    reason.textContent = 'Selected as the optimal hospital based on specialist availability, proximity, and bed capacity.';
  }

  // Ambulance info
  const ambInfo = caseData.assignedAmbulance;
  if (ambInfo) {
    document.getElementById('ambulanceDetails').innerHTML = `
      <div style="display:flex; flex-direction:column; gap:6px; font-size:13px; color:var(--text-secondary);">
        <span>🚑 ${ambInfo.vehicleNumber}</span>
        <span>👤 Driver: ${ambInfo.driverName}</span>
        <span>📞 ${ambInfo.driverPhone || 'N/A'}</span>
      </div>
    `;
  }
}
