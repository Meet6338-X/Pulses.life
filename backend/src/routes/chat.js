import express from 'express';
import { speechToText, translate, textToSpeech } from '../services/sarvam.js';
import { generateResponse, detectIntent } from '../services/groq.js';
import { retrieveMedicalContext, retrieveHospitals, buildCombinedContext } from '../services/rag.js';
import { detectEmergency, buildEmergencyResponse } from '../services/emergency.js';
import { createSession, getSession, updateSession } from '../services/conversation.js';
import { classifySymptoms } from '../services/symptomClassifier.js';

const router = express.Router();

// Helper to prevent TTS from reading raw markdown symbols out loud
function cleanForSpeech(text) {
  // Removes standard markdown characters like **, __, ##, etc.
  return text.replace(/[*#_~`]+/g, '').trim();
}

/**
 * POST /api/chat
 * Body: { message?: string, audioBase64?: string, language?: string, lat?: number, lon?: number, sessionId?: string }
 */
router.post('/', async (req, res) => {
  const startTime = Date.now();
  try {
    const { message, audioBase64, language = 'en', lat, lon, sessionId } = req.body;

    // 1. Get transcript from audio OR use text message
    let userText = message || '';
    if (audioBase64 && !message) {
      console.log('🎤 Processing audio input...');
      userText = await speechToText(audioBase64, language);
      if (!userText) {
        return res.status(400).json({ error: 'Could not transcribe audio. Please try again or type your message.' });
      }
    }

    if (!userText.trim()) {
      return res.status(400).json({ error: 'Please provide a message or audio input.' });
    }

    // 2. Get or create session
    console.log(`📩 Received sessionId: ${sessionId || '(none)'}`);
    let session;
    let isNewSession = false;
    if (sessionId) {
      session = getSession(sessionId);
      if (!session) {
        console.log(`⚠️ Session ${sessionId} not found — creating new session`);
        session = createSession();
        isNewSession = true;
      }
    } else {
      session = createSession();
      isNewSession = true;
    }
    console.log(`📊 Session ${session.sessionId}: ${session.messages.length} existing messages, new=${isNewSession}`);

    // 4. Translate to English if needed
    let englishText = userText;
    if (language !== 'en' && language !== 'en-IN') {
      console.log(`🌐 Translating from ${language} to English...`);
      englishText = await translate(userText, language, 'en');
    }

    // 3. Add ENGLISH user message to session so LLM history stays pure
    session.addMessage('user', englishText);

    // 5. Check for emergencies
    const symptomClassification = classifySymptoms(englishText);
    if (symptomClassification.category === 'emergency') {
      return handleEmergencyResponse(session, {
        isEmergency: true,
        severity: 'critical',
        reason: `Emergency symptom detected: ${symptomClassification.redFlag}`
      }, userText, englishText, language, lat, lon, res, startTime);
    }

    // 6. Get conversation context and generate response with Groq
    const intent = detectIntent(englishText);
    const medicalContext = await retrieveMedicalContext(englishText);
    const hospitals = await retrieveHospitals(englishText, lat, lon);
    const context = buildCombinedContext(medicalContext, hospitals);

    // Get conversation history as array of message objects (not string)
    const conversationHistory = session.getRecentMessages(10);
    // Exclude the current user message we just added (it's the last one)
    // so we pass prior history only — the current message is sent separately
    const priorMessages = conversationHistory.slice(0, -1);

    console.log(`🤖 Generating response with preprompt (${priorMessages.length} prior messages)...`);
    const llmResponse = await generateResponse(englishText, context, intent, priorMessages, session.sessionId);

    let showMap = false;
    let cleanResponse = llmResponse;
    if (llmResponse.includes('SHOW_NEARBY_HOSPITALS')) {
        showMap = true;
        cleanResponse = llmResponse.replace(/SHOW_NEARBY_HOSPITALS/g, '').trim();
    }

    let finalResponse = cleanResponse;
    if (language !== 'en' && language !== 'en-IN') {
      console.log(`🌐 Translating response to ${language}...`);
      finalResponse = await translate(cleanResponse, 'en', language);
    }

    // Prepare hospitals for map response if triggered by the AI
    const enrichedHospitals = showMap ? hospitals.map(h => ({
      ...h,
      vector: undefined,
      score: h.score ? Math.round(h.score * 100) / 100 : undefined,
      mapsUrl: `https://www.google.com/maps/search/${encodeURIComponent(h.name + ' hospital ' + (h.city || ''))}`
    })) : [];

    const audioResponse = await textToSpeech(cleanForSpeech(finalResponse), language);
    // Store ENGLISH LLM response in session so the LLM reasoning history stays pure
    session.addMessage('ai', cleanResponse);

    res.json({
      type: showMap ? 'hospital' : 'question',
      showMapTrigger: showMap,
      sessionId: session.sessionId,
      originalText: userText,
      englishText,
      response: finalResponse,
      audioBase64: audioResponse,
      hospitals: enrichedHospitals,
      processingTimeMs: Date.now() - startTime,
    });

  } catch (err) {
    console.error('Chat route error:', err);
    res.status(500).json({ error: 'Failed to process request', message: err.message });
  }
});

async function handleEmergencyResponse(session, emergencyResult, userText, englishText, language, lat, lon, res, startTime) {
  session.updateState('complete');

  let nearestEmergency = null;
  if (lat && lon) {
    const hospitals = await retrieveHospitals('emergency trauma', lat, lon);
    nearestEmergency = hospitals.find(h => h.emergency) || hospitals[0];
    if (nearestEmergency) {
      nearestEmergency = {
        ...nearestEmergency,
        mapsUrl: `https://www.google.com/maps/search/${encodeURIComponent(nearestEmergency.name + ' hospital ' + (nearestEmergency.city || ''))}`
      };
    }
  }

  let responseText = buildEmergencyResponse(emergencyResult.severity, nearestEmergency);

  let translatedResponse = responseText;
  if (language !== 'en' && language !== 'en-IN') {
    translatedResponse = await translate(responseText, 'en', language);
  }

  const audioResponse = await textToSpeech(cleanForSpeech(translatedResponse), language);
  session.addMessage('ai', translatedResponse);

  res.json({
    type: 'emergency',
    sessionId: session.sessionId,
    severity: emergencyResult.severity,
    originalText: userText,
    englishText,
    response: translatedResponse,
    audioBase64: audioResponse,
    hospitals: nearestEmergency ? [nearestEmergency] : [],
    processingTimeMs: Date.now() - startTime,
  });
}


export default router;
