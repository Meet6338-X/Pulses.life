'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
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
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              // Custom components for better styling
              h1: ({children}) => <h1 style={{fontSize: '1.5em', fontWeight: 'bold', margin: '0.5em 0'}}>{children}</h1>,
              h2: ({children}) => <h2 style={{fontSize: '1.3em', fontWeight: 'bold', margin: '0.4em 0'}}>{children}</h2>,
              h3: ({children}) => <h3 style={{fontSize: '1.2em', fontWeight: 'bold', margin: '0.3em 0'}}>{children}</h3>,
              ul: ({children}) => <ul style={{margin: '0.5em 0', paddingLeft: '1.5em'}}>{children}</ul>,
              ol: ({children}) => <ol style={{margin: '0.5em 0', paddingLeft: '1.5em'}}>{children}</ol>,
              li: ({children}) => <li style={{margin: '0.2em 0'}}>{children}</li>,
              p: ({children}) => <p style={{margin: '0.3em 0'}}>{children}</p>,
              strong: ({children}) => <strong style={{fontWeight: 'bold'}}>{children}</strong>,
              em: ({children}) => <em style={{fontStyle: 'italic'}}>{children}</em>,
              code: ({children}) => <code style={{
                backgroundColor: '#f1f1f1',
                padding: '0.1em 0.3em',
                borderRadius: '3px',
                fontFamily: 'monospace'
              }}>{children}</code>,
              pre: ({children}) => <pre style={{
                backgroundColor: '#f1f1f1',
                padding: '0.5em',
                borderRadius: '5px',
                overflow: 'auto',
                margin: '0.5em 0'
              }}>{children}</pre>,
              blockquote: ({children}) => <blockquote style={{
                borderLeft: '4px solid #ddd',
                paddingLeft: '1em',
                margin: '0.5em 0',
                color: '#666'
              }}>{children}</blockquote>
            }}
          >
            {content}
          </ReactMarkdown>
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
