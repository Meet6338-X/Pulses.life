// ============================================================
// Pulses.life Patient App — Demo Mode
// One-click demo that simulates the full emergency flow
// for hackathon presentation (90 seconds)
// Pune City Centric — all locations are in Pune
// ============================================================

const DEMO_SCENARIOS = [
  {
    name: 'Cardiac',
    messages: [
      'मेरे सीने में बहुत तेज दर्द है, सांस नहीं आ रही - My chest is hurting badly and I cannot breathe',
      'I am near Fergusson College Road, Deccan area, Pune',
      'It started about 30 minutes ago, getting worse'
    ],
    symptoms: 'severe chest pain, difficulty breathing, cardiac symptoms, heart attack, seene mein dard',
    location: { lat: 18.5196, lng: 73.8411, addressText: 'Fergusson College Road, Deccan, Pune' }
  },
  {
    name: 'Accident',
    messages: [
      'There has been a serious road accident near the highway — a man is bleeding heavily',
      'We are on Pune-Mumbai Expressway near Hinjewadi, Pune',
      'It just happened 5 minutes ago, he is unconscious'
    ],
    symptoms: 'road accident, severe bleeding, unconscious, trauma, head injury, hadsa',
    location: { lat: 18.5912, lng: 73.7389, addressText: 'Hinjewadi IT Park, Pune' }
  },
  {
    name: 'Stroke',
    messages: [
      'My grandmother had a stroke, she suddenly cannot move her left side and cannot speak properly',
      'We are at home near Sinhagad Road, Pune',
      'It happened just 10 minutes ago - she fell down suddenly'
    ],
    symptoms: 'stroke, paralysis, cannot speak, sudden collapse, brain, behosh, lakwa',
    location: { lat: 18.4832, lng: 73.8384, addressText: 'Sinhagad Road, Pune' }
  }
];

let demoActive = false;
let activeScenario = null;

/**
 * Get the location for the currently active demo scenario
 * Returns null if no demo is active
 */
export function getActiveDemoLocation() {
  return activeScenario ? activeScenario.location : null;
}

export function createDemoButton(chatMessages, chatInput, onComplete) {
  // Create demo panel
  const panel = document.createElement('div');
  panel.className = 'demo-panel';
  panel.id = 'demoPanel';
  panel.innerHTML = `
    <div class="demo-panel-header">
      <span class="demo-badge">DEMO MODE</span>
      <span class="demo-hint">Tap a scenario for one-click demo</span>
    </div>
    <div class="demo-scenarios">
      ${DEMO_SCENARIOS.map((s, i) => `
        <button class="demo-scenario-btn" data-index="${i}">
          <span class="demo-scenario-icon">${i === 0 ? '❤️' : i === 1 ? '🚗' : '🧠'}</span>
          <span class="demo-scenario-name">${s.name}</span>
        </button>
      `).join('')}
    </div>
  `;

  // Insert before chat input
  const chatInputArea = document.querySelector('.chat-input-area');
  chatInputArea.parentNode.insertBefore(panel, chatInputArea);

  // Attach click handlers
  panel.querySelectorAll('.demo-scenario-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      if (demoActive) return;
      demoActive = true;
      const idx = parseInt(btn.dataset.index);
      activeScenario = DEMO_SCENARIOS[idx];
      panel.style.display = 'none';
      runDemoScenario(DEMO_SCENARIOS[idx], chatMessages, chatInput, onComplete);
    });
  });
}

async function runDemoScenario(scenario, chatMessages, chatInput, onComplete) {
  const steps = scenario.messages;

  for (let i = 0; i < steps.length; i++) {
    // Wait for bot to finish previous message
    await wait(1500);

    // Simulate typing effect
    await simulateTyping(chatInput, steps[i]);

    // Trigger send
    const sendBtn = document.getElementById('sendBtn');
    sendBtn.click();

    // Wait between messages (give chat module time to show typing + bot reply)
    if (i < steps.length - 1) {
      await wait(2200);
    }
  }

  // The chat module's triggerSeverity will fire after the 3rd message
  // and call onComplete which sends the case to the server
}

function simulateTyping(input, text) {
  return new Promise(resolve => {
    input.value = '';
    let i = 0;
    const speed = 20; // ms per character (slightly faster)

    const typeInterval = setInterval(() => {
      if (i < text.length) {
        input.value += text[i];
        i++;
      } else {
        clearInterval(typeInterval);
        resolve();
      }
    }, speed);
  });
}

function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
