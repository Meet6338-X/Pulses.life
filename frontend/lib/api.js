const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5002';

let currentSessionId = null;

/**
 * Send a chat message (text or audio) to the backend
 */
export async function sendMessage({ message, audioBase64, language, lat, lon }) {
  const body = { language: language || 'en' };
  if (currentSessionId) body.sessionId = currentSessionId;
  if (message) body.message = message;
  if (audioBase64) body.audioBase64 = audioBase64;
  if (lat) body.lat = lat;
  if (lon) body.lon = lon;

  const res = await fetch(`${API_URL}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Network error' }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }

  const data = await res.json();
  if (data.sessionId) {
    currentSessionId = data.sessionId;
  }
  return data;
}

/**
 * Search for hospitals
 */
export async function findHospitals({ query, lat, lon, language }) {
  const res = await fetch(`${API_URL}/api/hospital`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, lat, lon, language: language || 'en' }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Network error' }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }

  return res.json();
}

/**
 * Trigger emergency alert
 */
export async function sendEmergency({ message, lat, lon, language }) {
  const res = await fetch(`${API_URL}/api/emergency`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, lat, lon, language: language || 'en' }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Network error' }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }

  return res.json();
}

/**
 * Convert Blob (from MediaRecorder) to base64
 */
export function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}



let currentPlayingAudio = null;

/**
 * Play base64 audio in browser.
 * Returns the Audio element so callers can track/stop playback.
 * Handles browser autoplay policy gracefully.
 */
export async function playAudioBase64(base64, mimeType = 'audio/wav') {
  if (!base64) return null;
  try {
    if (currentPlayingAudio) {
      currentPlayingAudio.pause();
    }
    const audio = new Audio(`data:${mimeType};base64,${base64}`);
    currentPlayingAudio = audio;
    audio.volume = 1.0;
    await audio.play();   // must await — play() returns a Promise
    return audio;
  } catch (e) {
    // NotAllowedError = browser blocked autoplay (rare after user interaction)
    if (e.name !== 'NotAllowedError') {
      console.error('TTS playback error:', e);
    }
    return null;
  }
}

export function stopAudioPlayback() {
  if (currentPlayingAudio) {
    currentPlayingAudio.pause();
    currentPlayingAudio.currentTime = 0;
    currentPlayingAudio = null;
  }
}

// ─── DigiLocker API helpers ────────────────────────────────────────────────────

/**
 * Get the DigiLocker OAuth login URL to redirect the user.
 */
export async function getDigiLockerLoginUrl() {
  const res = await fetch(`${API_URL}/api/digilocker/login`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Network error' }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  return res.json(); // { authUrl, state }
}

/**
 * Instant demo — fetches mock DigiLocker data and pre-filled form.
 * Used for hackathon demos (no real OAuth needed).
 */
export async function fetchDigiLockerDemo() {
  const res = await fetch(`${API_URL}/api/digilocker/demo`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Network error' }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  return res.json();
}

/**
 * Generate a pre-filled emergency admission form and dispatch to nearby hospital.
 * @param {object} payload - { fallbackProfile, emergencyReason, contact, ... }
 */
export async function autoFillEmergencyForm(payload) {
  const res = await fetch(`${API_URL}/api/emergency/auto-fill`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Network error' }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  return res.json();
}
