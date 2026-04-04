// ============================================================
// MediRoute Admin — Metrics Bar Module (Top Strip)
// Live-updating operational metrics
// ============================================================

let metricCases = null;
let metricAvgTime = null;
let metricHospitals = null;
let totalAssignmentTime = 0;
let assignmentCount = 0;

export function initMetricsBar() {
  metricCases = document.getElementById('metricCases');
  metricAvgTime = document.getElementById('metricAvgTime');
  metricHospitals = document.getElementById('metricHospitals');
}

export function updateMetrics(totalCases, lastAssignmentTime, activeHospitals) {
  // Animate case count
  if (metricCases) {
    animateValue(metricCases, parseInt(metricCases.textContent) || 0, totalCases, 500);
  }

  // Calculate average
  if (lastAssignmentTime > 0) {
    totalAssignmentTime += lastAssignmentTime;
    assignmentCount++;
  }
  const avg = assignmentCount > 0 ? Math.round(totalAssignmentTime / assignmentCount * 10) / 10 : 0;
  
  if (metricAvgTime) {
    metricAvgTime.innerHTML = `${avg}<span class="metric-unit">s</span>`;
  }

  if (metricHospitals) {
    metricHospitals.textContent = activeHospitals;
  }
}

function animateValue(el, start, end, duration) {
  if (start === end) return;
  const range = end - start;
  const increment = range > 0 ? 1 : -1;
  const stepTime = Math.abs(Math.floor(duration / range));
  let current = start;

  const timer = setInterval(() => {
    current += increment;
    el.textContent = current;
    if (current === end) clearInterval(timer);
  }, stepTime);
}
