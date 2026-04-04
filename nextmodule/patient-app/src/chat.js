// ============================================================
// MediRoute Patient App — Chat Module
// Voice/text emergency input with simulated bot conversation
// ============================================================

// Bot conversation flow — guides patient through symptom collection
const BOT_FLOW = [
  {
    message: "🚨 Namaste! I'm MediRoute Emergency Assistant.\n\nPlease describe your emergency. You can speak in Hindi or English.\n\nआपकी आपातकालीन स्थिति क्या है?",
    waitForUser: true
  },
  {
    message: "I understand. Can you tell me where you are right now? Share your location or describe it.\n\nआप अभी कहाँ हैं?",
    waitForUser: true
  },
  {
    message: "Thank you. How long have you been experiencing these symptoms?\n\nये लक्षण कब से हैं?",
    waitForUser: true
  },
  {
    message: "Got it. I'm now analyzing your symptoms and finding the best hospital for you...",
    waitForUser: false,
    triggerSeverity: true
  }
];

let currentStep = 0;
let collectedSymptoms = [];
let chatMessages = null;
let chatInput = null;
let onComplete = null;

export function initChat(messagesEl, inputEl, completeCb) {
  chatMessages = messagesEl;
  chatInput = inputEl;
  onComplete = completeCb;
  currentStep = 0;
  collectedSymptoms = [];

  // Show first bot message after a brief delay (with typing indicator)
  setTimeout(() => {
    showTypingThenMessage(BOT_FLOW[0].message);
    currentStep = 0;
  }, 500);
}

export function handleUserMessage(text) {
  if (!text.trim()) return;

  // Add user message
  addMessage(text, 'user');
  collectedSymptoms.push(text);

  currentStep++;

  if (currentStep < BOT_FLOW.length) {
    const step = BOT_FLOW[currentStep];

    // Show typing indicator, then bot message
    showTypingThenMessage(step.message, () => {
      if (step.triggerSeverity) {
        // Conversation complete — trigger severity analysis
        setTimeout(() => {
          addMessage('EMERGENCY DETECTED — INITIATING DISPATCH', 'system');
          if (onComplete) {
            onComplete(collectedSymptoms.join('. '));
          }
        }, 1200);
      }
    });
  }
}

function showTypingThenMessage(text, afterCb) {
  // Add typing indicator
  const typing = document.createElement('div');
  typing.className = 'typing-indicator';
  typing.innerHTML = '<span></span><span></span><span></span>';
  if (chatMessages) {
    chatMessages.appendChild(typing);
    scrollToBottom();
  }

  // After delay, remove typing and show actual message
  setTimeout(() => {
    if (typing.parentNode) typing.parentNode.removeChild(typing);
    addBotMessage(text);
    if (afterCb) afterCb();
  }, 800);
}

function addBotMessage(text) {
  addMessage(text, 'bot');
}

function addMessage(text, type) {
  if (!chatMessages) return;

  const div = document.createElement('div');
  div.className = `chat-message ${type}`;
  div.textContent = text;
  chatMessages.appendChild(div);

  scrollToBottom();
}

function scrollToBottom() {
  if (!chatMessages) return;
  chatMessages.scrollTop = chatMessages.scrollHeight;
  const container = chatMessages.closest('.chat-container');
  if (container) container.scrollTop = container.scrollHeight;
}

// Voice recognition setup
let recognition = null;
let isRecording = false;

export function initVoiceRecognition(voiceBtn, inputEl) {
  if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
    voiceBtn.style.opacity = '0.3';
    voiceBtn.title = 'Voice not supported in this browser';
    return;
  }

  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  recognition = new SpeechRecognition();
  recognition.continuous = false;
  recognition.interimResults = true;
  recognition.lang = 'en-IN'; // English (India) — also picks up Hindi

  recognition.onresult = (event) => {
    let transcript = '';
    for (let i = 0; i < event.results.length; i++) {
      transcript += event.results[i][0].transcript;
    }
    inputEl.value = transcript;
  };

  recognition.onend = () => {
    isRecording = false;
    voiceBtn.classList.remove('recording');
  };

  recognition.onerror = () => {
    isRecording = false;
    voiceBtn.classList.remove('recording');
  };

  voiceBtn.addEventListener('click', () => {
    if (isRecording) {
      recognition.stop();
    } else {
      recognition.start();
      isRecording = true;
      voiceBtn.classList.add('recording');
    }
  });
}
