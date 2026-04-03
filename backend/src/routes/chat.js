import express from 'express';
import { speechToText, translate, textToSpeech } from '../services/sarvam.js';
import { generateResponse, detectIntent } from '../services/groq.js';
import { retrieveMedicalContext, retrieveHospitals, buildCombinedContext } from '../services/rag.js';
import { detectEmergency, buildEmergencyResponse } from '../services/emergency.js';

const router = express.Router();

// Helper to prevent TTS from reading raw markdown symbols out loud
function cleanForSpeech(text) {
  // Removes standard markdown characters like **, __, ##, etc.
  return text.replace(/[*#_~`]+/g, '').trim();
}

/**
 * POST /api/chat
 * Body: { message?: string, audioBase64?: string, language?: string, lat?: number, lon?: number }
 */
router.post('/', async (req, res) => {
  const startTime = Date.now();
  try {
    const { message, audioBase64, language = 'en', lat, lon } = req.body;

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

    // 2. Translate to English if needed
    let englishText = userText;
    if (language !== 'en' && language !== 'en-IN') {
      console.log(`🌐 Translating from ${language} to English...`);
      englishText = await translate(userText, language, 'en');
    }

    // 3. Emergency detection (on English text)
    const emergencyResult = detectEmergency(englishText);
    if (emergencyResult.isEmergency) {
      // Find nearest emergency hospital only if we have location
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

      // Translate response back
      let translatedResponse = responseText;
      if (language !== 'en' && language !== 'en-IN') {
        translatedResponse = await translate(responseText, 'en', language);
      }

      // TTS (using cleaned text to avoid reading markdown)
      const audioResponse = await textToSpeech(cleanForSpeech(translatedResponse), language);

      return res.json({
        type: 'emergency',
        severity: emergencyResult.severity,
        originalText: userText,
        englishText,
        response: translatedResponse,
        audioBase64: audioResponse,
        hospitals: nearestEmergency ? [nearestEmergency] : [],
        processingTimeMs: Date.now() - startTime,
      });
    }

    // 4. Detect intent
    const intent = detectIntent(englishText);

    // 5. RAG: retrieve context
    const medicalContext = await retrieveMedicalContext(englishText);
    let hospitals = [];
    let locationPrompt = "";

    if (intent === 'hospital' || intent === 'symptoms') {
      hospitals = await retrieveHospitals(englishText, lat, lon);

      if (!lat && !lon) {
        const queryTokens = englishText.toLowerCase().split(/[\s,.'"-]+/);
        const genericWords = ['hospital', 'hospitals', 'clinic', 'nearest', 'nearby', 'find', 'get', 'give', 'me', 'the', 'a', 'an', 'in', 'at', 'of', 'for', 'to', 'is', 'where', 'nerest', 'near', 'around', 'close', 'what', 'are'];
        const specificQueryTokens = queryTokens.filter(t => t.length > 2 && !genericWords.includes(t));

        // Check if retrieved hospitals actually match specific named entities requested by user
        const intentionalMatch = hospitals.some(h => {
          const hCity = (h.city || '').toLowerCase();
          const hState = (h.state || '').toLowerCase();
          const hName = (h.name || '').toLowerCase();
          return specificQueryTokens.some(t => hCity.includes(t) || hState.includes(t) || hName.includes(t));
        });

        if (!intentionalMatch && intent === 'hospital') {
          // SHORT-CIRCUIT: Do NOT call the LLM at all — it will hallucinate hospital names from
          // its training data. Return a deterministic location-request response instead.
          console.log('🏥 Hospital query with no GPS/city — short-circuiting to location prompt.');
          const noLocMessage = `To find hospitals near you, I need your location. Please tap the **📍 Share Location** button below, or type your city name (e.g. "hospitals in Pune").\n\n⚠️ **Medical Disclaimer**: This information is for general guidance only and does not constitute medical advice. Always consult a qualified healthcare professional for diagnosis and treatment.`;

          let finalNoLocResponse = noLocMessage;
          if (language !== 'en' && language !== 'en-IN') {
            finalNoLocResponse = await translate(noLocMessage, 'en', language);
          }
          const audioNoLoc = await textToSpeech(cleanForSpeech(finalNoLocResponse), language);

          return res.json({
            type: 'hospital',
            originalText: userText,
            englishText,
            response: finalNoLocResponse,
            audioBase64: audioNoLoc,
            hospitals: [],
            processingTimeMs: Date.now() - startTime,
          });
        }

        if (!intentionalMatch) {
          hospitals = [];
        }
      }
    }

    const context = buildCombinedContext(medicalContext, hospitals) + locationPrompt;

    // 6. Generate LLM response
    console.log(`🤖 Generating response for intent: ${intent}...`);
    const llmResponse = await generateResponse(englishText, context, intent);

    // 7. Translate response back to user language
    let finalResponse = llmResponse;
    if (language !== 'en' && language !== 'en-IN') {
      console.log(`🌐 Translating response to ${language}...`);
      finalResponse = await translate(llmResponse, 'en', language);
    }

    // 8. Add Google Maps URL to hospitals
    const enrichedHospitals = hospitals.map(h => ({
      ...h,
      vector: undefined, // remove internal vector
      score: h.score ? Math.round(h.score * 100) / 100 : undefined,
      mapsUrl: `https://www.google.com/maps/search/${encodeURIComponent(h.name + ' hospital ' + (h.city || ''))}`
    }));

    // 9. TTS (using cleaned text to avoid reading markdown)
    const audioResponse = await textToSpeech(cleanForSpeech(finalResponse), language);

    res.json({
      type: intent,
      originalText: userText,
      englishText,
      response: finalResponse,
      audioBase64: audioResponse,
      hospitals: intent === 'hospital' || intent === 'symptoms' ? enrichedHospitals : [],
      processingTimeMs: Date.now() - startTime,
    });

  } catch (err) {
    console.error('Chat route error:', err);
    res.status(500).json({ error: 'Failed to process request', message: err.message });
  }
});

export default router;
