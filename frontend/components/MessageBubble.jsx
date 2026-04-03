'use client';

import { playAudioBase64 } from '../lib/api';

function formatTime(date) {
  return date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
}

// Guard against CSV null-sentinel "0" values leaking into the UI
function cleanVal(val) {
  if (!val || val.trim() === '0') return '';
  return val.trim();
}

function locationLabel(h) {
  const city = cleanVal(h.city);
  const state = cleanVal(h.state);
  if (city && state) return `${city}, ${state}`;
  if (city) return city;
  if (state) return state;
  return 'India';
}

export default function MessageBubble({ message }) {
  const { role, content, timestamp, audioBase64, hospitals } = message;
  const isUser = role === 'user';
  const isAI = role === 'ai';

  const handlePlayTTS = () => {
    if (audioBase64) {
      playAudioBase64(audioBase64, 'audio/wav');
    }
  };

  return (
    <div className={`message-row ${isUser ? 'user' : 'ai'}`}>
      {/* Avatar */}
      <div className={`avatar ${isUser ? 'user' : 'ai'}`}>
        {isUser ? '👤' : '🩺'}
      </div>

      <div className="message-bubble">
        <div className="bubble-content">
          {content}
        </div>

        <div className="bubble-meta">
          <span className="timestamp">{formatTime(new Date(timestamp))}</span>

          {isAI && (
            <span className="disclaimer-badge" title="AI-generated response. Not a substitute for professional medical advice.">
              ⚠️ Disclaimer
            </span>
          )}

          {isAI && audioBase64 && (
            <button
              className="tts-btn"
              onClick={handlePlayTTS}
              title="Play voice response"
              id={`tts-${timestamp}`}
            >
              🔊
            </button>
          )}
        </div>

        {/* Hospital cards inline with AI messages */}
        {isAI && hospitals && hospitals.length > 0 && (
          <div className="hospitals-section">
            <div className="hospitals-label">🏥 Nearby Hospitals</div>
            {hospitals.map((h) => (
              <div key={h.id || h.name} className="hospital-card">
                <div className="hospital-header">
                  <div className="hospital-name">{h.name}</div>
                  <div className="hospital-badges">
                    {h.emergency && <span className="badge emergency">🚑 ER</span>}
                    {h.cghs && <span className="badge cghs">CGHS</span>}
                  </div>
                </div>
                {h.mapsUrl ? (
                  <a href={h.mapsUrl} target="_blank" rel="noopener noreferrer" className="hospital-location" style={{ textDecoration: 'none' }}>
                    <span>📍</span>
                    <span style={{ textDecoration: 'underline' }}>{locationLabel(h)}</span>
                    {h._distanceKm != null && <span className="hospital-distance">{h._distanceKm} km</span>}
                  </a>
                ) : (
                  <div className="hospital-location">
                    <span>📍</span>
                    <span>{locationLabel(h)}</span>
                    {h._distanceKm != null && <span className="hospital-distance">{h._distanceKm} km</span>}
                  </div>
                )}
                {h.services && h.services.length > 0 && (
                  <div className="hospital-services">
                    {h.services.slice(0, 4).map((s) => (
                      <span key={s} className="service-chip">{s}</span>
                    ))}
                  </div>
                )}
                <div className="hospital-footer">
                  {h.phone && (
                    <div className="hospital-phone"><span>📞</span><span>{h.phone}</span></div>
                  )}
                  {h.mapsUrl && (
                    <a href={h.mapsUrl} target="_blank" rel="noopener noreferrer" className="directions-btn">
                      🗺️ Directions
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function TypingIndicator() {
  return (
    <div className="typing-row">
      <div className="avatar ai">🩺</div>
      <div className="typing-bubble">
        <div className="typing-dot" />
        <div className="typing-dot" />
        <div className="typing-dot" />
      </div>
    </div>
  );
}
