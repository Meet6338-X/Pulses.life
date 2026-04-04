// ============================================================
// Pulses.life Admin — Explainer Drawer Module
// Shows routing decision breakdown with score table
// ============================================================

let drawer = null;
let overlay = null;
let content = null;
let closeBtn = null;

export function initExplainerDrawer() {
  drawer = document.getElementById('explainerDrawer');
  overlay = document.getElementById('explainerOverlay');
  content = document.getElementById('explainerContent');
  closeBtn = document.getElementById('explainerClose');

  closeBtn.addEventListener('click', hideExplainer);
  overlay.addEventListener('click', hideExplainer);
}

export function showExplainer(caseData) {
  if (!caseData.routingScores || caseData.routingScores.length === 0) return;

  const scores = caseData.routingScores;
  const winnerId = caseData.assignedHospital?.hospitalId;

  let tableRows = scores.map(s => {
    const isWinner = s.hospitalId === winnerId;
    return `
      <tr class="${isWinner ? 'winner' : ''}">
        <td>
          ${s.hospitalName.length > 18 ? s.hospitalName.substring(0, 18) + '…' : s.hospitalName}
          ${isWinner ? '<span class="winner-badge">WINNER</span>' : ''}
        </td>
        <td>${s.distanceKm}km</td>
        <td>${s.distanceScore}</td>
        <td>${s.bedScore}</td>
        <td>${s.specialistScore}</td>
        <td>${s.loadScore}</td>
        <td><strong>${s.totalScore}</strong></td>
      </tr>
    `;
  }).join('');

  content.innerHTML = `
    <div style="margin-bottom:16px;">
      <div style="font-size:11px;color:var(--text-muted);text-transform:uppercase;letter-spacing:1px;margin-bottom:6px;">Case</div>
      <div style="font-size:14px;font-weight:600;color:var(--text-primary);">${caseData.caseId.substring(0, 16)}...</div>
      <div style="font-size:12px;color:var(--text-secondary);margin-top:4px;">
        Severity: <span style="color:var(--${caseData.severity.toLowerCase()});font-weight:700;">${caseData.severity}</span> •
        Specialist: <strong>${caseData.specialistRequired}</strong>
      </div>
    </div>

    <div style="font-size:11px;color:var(--text-muted);text-transform:uppercase;letter-spacing:1px;margin-bottom:10px;">
      Score Breakdown (out of 100)
    </div>

    <table class="score-table">
      <thead>
        <tr>
          <th>Hospital</th>
          <th>Dist</th>
          <th>Dist<br/>30</th>
          <th>Bed<br/>25</th>
          <th>Spec<br/>30</th>
          <th>Load<br/>15</th>
          <th>Total</th>
        </tr>
      </thead>
      <tbody>
        ${tableRows}
      </tbody>
    </table>

    <div style="margin-top:20px;padding:12px;background:rgba(16,185,129,0.05);border:1px solid rgba(16,185,129,0.1);border-radius:8px;">
      <div style="font-size:11px;font-weight:700;color:var(--success);margin-bottom:6px;">WHY THIS HOSPITAL?</div>
      <div style="font-size:12px;color:var(--text-secondary);line-height:1.6;">
        ${caseData.assignedHospital?.name || 'N/A'} scored the highest because 
        ${scores.find(s => s.hospitalId === winnerId)?.hasSpecialist
          ? `the required ${caseData.specialistRequired} is currently on duty`
          : 'it has the best overall combination of proximity, bed availability, and load'
        }, 
        with ${caseData.assignedHospital?.bedsAvailable || 0} beds available 
        at ${scores.find(s => s.hospitalId === winnerId)?.distanceKm || '?'}km distance.
      </div>
    </div>
  `;

  drawer.classList.remove('hidden');
  overlay.classList.remove('hidden');
}

function hideExplainer() {
  drawer.classList.add('hidden');
  overlay.classList.add('hidden');
}
