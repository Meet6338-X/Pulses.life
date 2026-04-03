import express from 'express';
import { detectEmergency, buildEmergencyResponse } from '../services/emergency.js';
import { retrieveHospitals } from '../services/rag.js';
import { translate } from '../services/sarvam.js';

const router = express.Router();

/**
 * POST /api/emergency
 * Body: { message: string, lat?: number, lon?: number, language?: string }
 */
router.post('/', async (req, res) => {
  try {
    const { message, lat, lon, language = 'en' } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required.' });
    }

    // Translate to English if needed
    let englishText = message;
    if (language !== 'en' && language !== 'en-IN') {
      englishText = await translate(message, language, 'en');
    }

    const emergencyResult = detectEmergency(englishText);

    // Always find nearest emergency hospitals
    const hospitals = retrieveHospitals('emergency trauma ICU', lat || null, lon || null);
    const emergencyHospitals = hospitals.filter(h => h.emergency).slice(0, 3);
    const nearestHospital = emergencyHospitals[0] || hospitals[0];

    const severity = emergencyResult.isEmergency ? emergencyResult.severity : 'high';
    const responseText = buildEmergencyResponse(severity, nearestHospital);

    // Translate back if needed
    let finalResponse = responseText;
    if (language !== 'en' && language !== 'en-IN') {
      finalResponse = await translate(responseText, 'en', language);
    }

    res.json({
      isEmergency: emergencyResult.isEmergency,
      severity,
      matchedKeywords: emergencyResult.matchedKeywords,
      response: finalResponse,
      hospitals: (emergencyHospitals.length > 0 ? emergencyHospitals : hospitals.slice(0, 3)).map(h => ({
        ...h,
        vector: undefined,
        mapsUrl: h.lat && h.lon
          ? `https://www.google.com/maps/dir/?api=1&destination=${h.lat},${h.lon}`
          : `https://www.google.com/maps/search/${encodeURIComponent(h.name + ' ' + h.city)}`,
      })),
      ambulanceNumber: '108',
      policeNumber: '100',
    });

  } catch (err) {
    console.error('Emergency route error:', err);
    res.status(500).json({ error: 'Emergency service error', message: err.message });
  }
});

export default router;
