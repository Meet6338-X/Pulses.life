import React, { useState, useEffect, useRef } from 'react';
import { Send, Activity, User, Bot, AlertCircle } from 'lucide-react';

const ChatInterface = ({ messages, isTyping, onSendMessage, mapVisible }) => {
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (inputValue.trim() && !isTyping) {
      onSendMessage(inputValue);
      setInputValue('');
    }
  };

  // Pre-process text to separate out standard responses and bold important elements safely
  const formatContent = (text) => {
    // Remove the trailing trigger word if it slipped into raw UI view
    let cleanText = text.replace(/SHOW_NEARBY_HOSPITALS/g, '');
    
    // Simple bolding for markers (e.g. **text**)
    const parts = cleanText.split(/(\*\*.*?\*\*)/g);
    
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i}>{part.slice(2, -2)}</strong>;
      }
      return <span key={i}>{part}</span>;
    });
  };

  return (
    <div className={`chat-section ${mapVisible ? 'with-map' : ''}`}>
      <div className="chat-header">
        <Activity color="#0ea5e9" size={28} />
        <div>
          <h1>Aura Health</h1>
          <p>AI Symptom Triage Assistant</p>
        </div>
      </div>

      <div className="messages-container">
        {/* Initial setup message to start the flow */}
        {messages.length === 0 && (
          <div className="message assistant">
            <div className="message-content">
              Welcome to Aura Health. Please describe what you are feeling today.
            </div>
          </div>
        )}

        {messages.map((msg, index) => {
          // Hide system messages from the UI
          if (msg.role === 'system') return null;

          return (
            <div key={index} className={`message ${msg.role}`}>
              <div className="message-content">
                {formatContent(msg.content)}
              </div>
            </div>
          );
        })}
        
        {isTyping && (
           <div className="message assistant">
             <div className="message-content typing-indicator">
               <div className="dot"></div>
               <div className="dot"></div>
               <div className="dot"></div>
             </div>
           </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="input-area">
        <form onSubmit={handleSubmit} className="input-form">
          <input
            type="text"
            className="input-field"
            placeholder="Type your response..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            disabled={isTyping}
          />
          <button type="submit" className="send-btn" disabled={!inputValue.trim() || isTyping}>
            <Send size={20} />
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatInterface;
