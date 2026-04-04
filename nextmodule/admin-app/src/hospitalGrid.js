// ============================================================
// MediRoute Admin — Hospital Grid Module (Right Column)
// Hospital capacity cards with load bars and specialist chips
// ============================================================

let hospitalGrid = null;
let hospitalCardElements = {};

const ALL_SPECIALISTS = ['Cardiologist', 'Neurologist', 'Trauma Surgeon', 'Orthopedic', 'General'];

export function initHospitalGrid() {
  hospitalGrid = document.getElementById('hospitalGrid');
}

export function updateHospitalCards(hospitals) {
  hospitals.forEach(h => {
    let card = hospitalCardElements[h.hospitalId];
    
    if (!card) {
      // Create new card
      card = document.createElement('div');
      card.className = 'hospital-card';
      card.id = `hcard-${h.hospitalId}`;
      hospitalGrid.appendChild(card);
      hospitalCardElements[h.hospitalId] = card;
    }

    // Determine load color
    const loadClass = h.currentLoad < 60 ? 'load-green' : h.currentLoad < 80 ? 'load-amber' : 'load-red';
    const isFull = h.bedsAvailable <= 0;
    
    if (isFull) card.classList.add('full');
    else card.classList.remove('full');

    // Build specialist chips
    const specialistChips = ALL_SPECIALISTS.map(s => {
      const onDuty = h.specialistsOnDuty.includes(s);
      return `<span class="specialist-chip ${onDuty ? 'on-duty' : 'off-duty'}">${s.substring(0, 4)}</span>`;
    }).join('');

    card.innerHTML = `
      <div class="hospital-name">
        <span>${h.name.length > 22 ? h.name.substring(0, 22) + '…' : h.name}</span>
        ${isFull ? '<span class="hospital-full-label">FULL</span>' : ''}
      </div>
      <div class="hospital-beds">🛏️ ${h.bedsAvailable}/${h.bedsTotal} beds free</div>
      <div class="hospital-load-bar">
        <div class="hospital-load-fill ${loadClass}" style="width: ${h.currentLoad}%"></div>
      </div>
      <div class="hospital-specialists">${specialistChips}</div>
      <div class="hospital-cases">📋 ${h.activeCases} active case${h.activeCases !== 1 ? 's' : ''}</div>
      <div class="hospital-notif-container" id="notif-${h.hospitalId}"></div>
    `;
  });
}

export function flashHospitalCard(hospitalId, caseData) {
  const card = hospitalCardElements[hospitalId];
  if (!card) return;

  // Flash green border
  card.classList.add('flash-green');
  setTimeout(() => card.classList.remove('flash-green'), 3000);

  // Show notification inside card
  const notifContainer = document.getElementById(`notif-${hospitalId}`);
  if (notifContainer) {
    notifContainer.innerHTML = `
      <div class="hospital-notification">
        ⚡ New ${caseData.severity} case assigned — ${caseData.specialistRequired} needed
      </div>
    `;
    setTimeout(() => { notifContainer.innerHTML = ''; }, 5000);
  }
}
