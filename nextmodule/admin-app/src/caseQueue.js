// ============================================================
// Pulses.life Admin — Case Queue Module (Left Column)
// Live case cards with severity colors and time counters
// ============================================================

let caseQueue = null;
let emptyState = null;
let caseCountEl = null;
let caseCards = {};
let caseTimers = {};
let count = 0;

export function initCaseQueue() {
  caseQueue = document.getElementById('caseQueue');
  emptyState = document.getElementById('emptyState');
  caseCountEl = document.getElementById('caseCount');
}

export function addCaseCard(caseData, onClickExplainer) {
  // Hide empty state
  if (emptyState) emptyState.style.display = 'none';

  // Prevent duplicates
  if (caseCards[caseData.caseId]) return;

  count++;
  if (caseCountEl) caseCountEl.textContent = count;

  const card = document.createElement('div');
  card.className = `case-card ${caseData.severity.toLowerCase()}`;
  card.id = `case-${caseData.caseId}`;

  const shortId = caseData.caseId.substring(0, 12);
  const hospital = caseData.assignedHospital;

  card.innerHTML = `
    <div class="case-card-header">
      <span class="case-id">${shortId}...</span>
      <span class="case-severity-badge ${caseData.severity.toLowerCase()}">${caseData.severity}</span>
    </div>
    <div class="case-location">📍 ${caseData.patientLocation?.addressText || 'Pune, MH'}</div>
    ${hospital ? `<div class="case-hospital">→ ${hospital.name}</div>` : ''}
    <div class="case-needs">
      ${caseData.predictedNeeds.map(n => `<span class="case-need-chip">${n}</span>`).join('')}
    </div>
    <div class="case-footer">
      <span class="case-time" id="timer-${caseData.caseId}">0s ago</span>
      <span class="case-status-badge assigned">ASSIGNED</span>
    </div>
  `;

  card.addEventListener('click', () => {
    if (onClickExplainer) onClickExplainer();
  });

  // Prepend to queue
  caseQueue.insertBefore(card, caseQueue.firstChild);
  caseCards[caseData.caseId] = card;

  // Start live timer
  const startTime = Date.now();
  caseTimers[caseData.caseId] = setInterval(() => {
    const elapsed = Math.round((Date.now() - startTime) / 1000);
    const timerEl = document.getElementById(`timer-${caseData.caseId}`);
    if (timerEl) timerEl.textContent = `${elapsed}s ago`;
  }, 1000);
}

export function updateCaseStatus(caseId, status) {
  const card = caseCards[caseId];
  if (!card) return;

  if (status === 'DISPATCHED') {
    card.classList.add('dispatched');
    const badge = card.querySelector('.case-status-badge');
    if (badge) {
      badge.className = 'case-status-badge dispatched';
      badge.textContent = '✓ DISPATCHED';
    }
  } else if (status === 'ARRIVED') {
    const badge = card.querySelector('.case-status-badge');
    if (badge) {
      badge.className = 'case-status-badge dispatched';
      badge.textContent = '✓ ARRIVED';
    }
    // Stop timer
    if (caseTimers[caseId]) {
      clearInterval(caseTimers[caseId]);
    }
  }
}
