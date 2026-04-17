import React, { useState } from 'react';
import ChatInterface from './components/ChatInterface';
import MapInterface from './components/MapInterface';
import { getHealthAnalysis } from './services/groqService';

function App() {
  const [messages, setMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [mapVisible, setMapVisible] = useState(false);

  const handleSendMessage = async (userText) => {
    // Add user message to UI immediately
    const newMessages = [...messages, { role: 'user', content: userText }];
    setMessages(newMessages);
    setIsTyping(true);

    try {
      // Call Groq API
      const aiResponse = await getHealthAnalysis(newMessages);
      
      // Check if trigger phrase is present
      const showMapTrigger = aiResponse.includes('SHOW_NEARBY_HOSPITALS');
      
      // Update state
      setMessages([...newMessages, { role: 'assistant', content: aiResponse }]);
      
      if (showMapTrigger) {
        setMapVisible(true);
      }
      
    } catch (error) {
      console.error(error);
      setMessages([...newMessages, { role: 'assistant', content: 'An error occurred while connecting to the AI system. Please try again later.' }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="app-container">
      <ChatInterface 
        messages={messages} 
        isTyping={isTyping} 
        onSendMessage={handleSendMessage} 
        mapVisible={mapVisible}
      />
      {mapVisible && <MapInterface onClose={() => setMapVisible(false)} />}
    </div>
  );
}

export default App;
