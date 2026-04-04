'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import LanguageSelector from './LanguageSelector';
import MessageBubble, { TypingIndicator } from './MessageBubble';
import VoiceRecorder from './VoiceRecorder';
import EmergencyAlert from './EmergencyAlert';
import { sendMessage, sendEmergency, playAudioBase64 } from '../lib/api';

// Dynamically import map component to avoid SSR issues
const MapModal = dynamic(() => import('./MapModal'), { ssr: false });

const SUGGESTIONS = [
  { icon: '🤒', text: 'I have a fever and headache' },
  { icon: '🏥', text: 'Find nearest hospital' },
  { icon: '💉', text: 'What are dengue symptoms?' },
  { icon: '💊', text: 'How to manage diabetes?' },
  { icon: '🫀', text: 'Chest pain – what to do?' },
  { icon: '🩺', text: 'What is Ayushman Bharat?' },
];

const PLACEHOLDERS = {
  en: 'Ask about symptoms, medications, or find hospitals…',
  hi: 'लक्षण, दवाई या अस्पताल के बारे में पूछें…',
  mr: 'लक्षणे, औषधे किंवा रुग्णालय शोधा…',
  ta: 'அறிகுறிகள், மருத்துவமனை பற்றி கேளுங்கள்…',
};

export default function ChatInterface() {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [language, setLanguage] = useState('en');
  const [isLoading, setIsLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [emergency, setEmergency] = useState(null);
  const [location, setLocation] = useState(null);
  const [locationActive, setLocationActive] = useState(false);
  const [error, setError] = useState(null);
  const [isMapOpen, setIsMapOpen] = useState(false);
  const currentAudioRef = useRef(null);

  const chatAreaRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (chatAreaRef.current) {
      chatAreaRef.current.scrollTop = chatAreaRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const addMessage = useCallback((role, content, extras = {}) => {
    setMessages((prev) => [...prev, {
      id: Date.now() + Math.random(),
      role,
      content,
      timestamp: Date.now(),
      ...extras,
    }]);
  }, []);

  const handleSend = useCallback(async (textOverride = null, audioBase64 = null) => {
    const text = textOverride || inputText.trim();
    if (!text && !audioBase64) return;
    if (isLoading) return;

    setInputText('');
    setError(null);

    // Add user message
    addMessage('user', text || '🎤 Voice message');
    setIsLoading(true);

    try {
      const result = await sendMessage({
        message: audioBase64 ? undefined : text,
        audioBase64: audioBase64 || undefined,
        language,
        lat: location?.lat,
        lon: location?.lon,
      });

      if (result.type === 'emergency') {
        setEmergency({
          severity: result.severity,
          hospitals: result.hospitals || [],
        });
      }

      addMessage('ai', result.response, {
        audioBase64: result.audioBase64,
        hospitals: result.type === 'hospital' ? result.hospitals : [],
      });

      // Auto-play TTS voice response
      if (result.audioBase64) {
        setIsSpeaking(true);
        // Stop any currently playing audio
        if (currentAudioRef.current) {
          currentAudioRef.current.pause();
        }
        const audio = await playAudioBase64(result.audioBase64, 'audio/wav');
        currentAudioRef.current = audio;
        if (audio) {
          audio.onended = () => setIsSpeaking(false);
          audio.onerror = () => setIsSpeaking(false);
        } else {
          setIsSpeaking(false);
        }
      }
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
      addMessage('ai', '⚠️ I encountered an error. Please check your connection and try again.\n\n⚠️ Medical Disclaimer: This information is for general guidance only and does not constitute medical advice. Always consult a qualified healthcare professional.');
    } finally {
      setIsLoading(false);
    }
  }, [inputText, language, location, isLoading, addMessage]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleVoiceReady = useCallback(async (base64) => {
    setIsLoading(true);
    try {
      const result = await sendMessage({
        audioBase64: base64,
        language,
        lat: location?.lat,
        lon: location?.lon,
      });

      // Show transcript as user message
      addMessage('user', result.originalText || '🎤 Voice message');

      if (result.type === 'emergency') {
        setEmergency({ severity: result.severity, hospitals: result.hospitals || [] });
      }

      addMessage('ai', result.response, {
        audioBase64: result.audioBase64,
        hospitals: result.type === 'hospital' ? result.hospitals : [],
      });

      // Auto-play TTS voice response
      if (result.audioBase64) {
        setIsSpeaking(true);
        if (currentAudioRef.current) {
          currentAudioRef.current.pause();
        }
        const audio = await playAudioBase64(result.audioBase64, 'audio/wav');
        currentAudioRef.current = audio;
        if (audio) {
          audio.onended = () => setIsSpeaking(false);
          audio.onerror = () => setIsSpeaking(false);
        } else {
          setIsSpeaking(false);
        }
      }
    } catch (err) {
      setError(err.message);
      addMessage('ai', '⚠️ Could not process voice message. Please try again.\n\n⚠️ Medical Disclaimer: This information is for general guidance only.');
    } finally {
      setIsLoading(false);
    }
  }, [language, location, addMessage]);

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({ lat: pos.coords.latitude, lon: pos.coords.longitude });
        setLocationActive(true);
      },
      () => setError('Could not get location. Please enable location access.')
    );
  };

  const handleSuggestion = (text) => {
    setInputText(text);
    inputRef.current?.focus();
  };

  return (
    <div className="app-container">
      {/* Header */}
      <header className="header">
        <div className="header-logo">
          <div className="logo-icon" aria-hidden="true">🩺</div>
          <div>
            <span className="logo-text">Pulses.life</span>
            <span className="logo-tagline">AI Health Assistant</span>
          </div>
        </div>
        <div className="header-actions">
          <LanguageSelector language={language} onChange={setLanguage} />
        </div>
      </header>

      {/* Chat area */}
      <main className="chat-area" ref={chatAreaRef} id="chat-area" role="log" aria-live="polite">
        {/* Emergency alert (sticky above messages) */}
        {emergency && (
          <EmergencyAlert
            severity={emergency.severity}
            hospitals={emergency.hospitals}
            onDismiss={() => setEmergency(null)}
          />
        )}

        {messages.length === 0 && !isLoading ? (
          /* Welcome screen */
          <div className="welcome-screen">
            <div className="welcome-icon" aria-hidden="true">🩺</div>
            <h1 className="welcome-title">Pulses.life</h1>
            <p className="welcome-subtitle">
              Your voice-first AI health assistant. Ask in Hindi, Marathi, Tamil, or English.
              I can help with symptoms, medications, and finding hospitals near you.
            </p>
            <div className="suggestion-chips" role="list">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s.text}
                  className="chip"
                  role="listitem"
                  onClick={() => handleSend(s.text)}
                >
                  <span>{s.icon}</span>{s.text}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            {messages.map((msg) => (
              <MessageBubble key={msg.id} message={msg} />
            ))}
            {isLoading && <TypingIndicator />}
          </>
        )}
      </main>

      {/* Input area */}
      <footer className="input-area">
        {error && (
          <div style={{
            background: 'rgba(244, 63, 94, 0.08)',
            border: '1px solid rgba(244, 63, 94, 0.25)',
            borderRadius: 10,
            padding: '10px 14px',
            fontSize: 13,
            color: '#fda4af',
          }}>
            ⚠️ {error}
          </div>
        )}

        <div className="input-row">
          <textarea
            ref={inputRef}
            className="text-input"
            id="chat-input"
            placeholder={PLACEHOLDERS[language] || PLACEHOLDERS.en}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
            disabled={isLoading}
            aria-label="Type your message"
          />

          <div className="input-actions">
            <button
              className="action-btn map"
              onClick={() => setIsMapOpen(true)}
              title="View hospital map"
              aria-label="Open hospital map"
            >
              🗺️
            </button>

            <VoiceRecorder
              language={language}
              onAudioReady={handleVoiceReady}
              onError={(msg) => setError(msg)}
            />

            <button
              className="action-btn send"
              id="send-btn"
              onClick={() => handleSend()}
              disabled={isLoading || !inputText.trim()}
              aria-label="Send message"
            >
              {isLoading ? <span className="processing-spinner" /> : '➤'}
            </button>
          </div>
        </div>

        <div className="status-bar">
          <div className="status-indicator">
            <div className="status-dot" style={isSpeaking ? { background: 'var(--accent-violet)', boxShadow: '0 0 8px var(--accent-violet)' } : {}} />
            <span>
              {isSpeaking ? '🔊 Speaking…' : 'Pulses AI · Powered by Groq + Sarvam'}
            </span>
          </div>
          <button
            className={`location-btn ${locationActive ? 'active' : ''}`}
            id="location-btn"
            onClick={handleGetLocation}
            title={locationActive ? `Location active (${location?.lat?.toFixed(3)}, ${location?.lon?.toFixed(3)})` : 'Share location for nearby hospitals'}
          >
            {locationActive ? '📍 Location On' : '📍 Share Location'}
          </button>
        </div>
      </footer>

      <MapModal
        isOpen={isMapOpen}
        onClose={() => setIsMapOpen(false)}
      />
    </div>
  );
}
