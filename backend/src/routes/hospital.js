import express from 'express';
import { translate } from '../services/sarvam.js';
import { findNearbyHospitals, buildMapsSearchUrl } from '../services/mapsService.js';

const router = express.Router();

/**
 * POST /api/hospital/nearby
 * Body: { lat: number, lon: number, radius?: number, language?: string, keyword?: string }
 *
 * Returns actual nearby hospitals from Google Maps Places API
 */
router.post('/nearby', async (req, res) => {
  try {
    const { lat, lon, radius = 5000, language = 'en', keyword = 'hospital' } = req.body;

    if (!lat || !lon) {
      return res.status(400).json({
        error: 'Location required',
        message: 'Please share your GPS location to find nearby hospitals.',
      });
    }

    const hospitals = await findNearbyHospitals(
      parseFloat(lat),
      parseFloat(lon),
      parseInt(radius),
      keyword,
    );

    res.json({
      count: hospitals.length,
      location: { lat, lon },
      hospitals,
    });

  } catch (err) {
    console.error('Hospital/nearby error:', err);
    res.status(500).json({ error: 'Failed to find nearby hospitals', message: err.message });
  }
});

/**
 * POST /api/hospital
 * Body: { query: string, lat?: number, lon?: number, language?: string }
 *
 * Semantic hospital search — if GPS provided, uses live Maps API.
 * If no GPS but city mentioned in query, returns a Google Maps search link.
 */
router.post('/', async (req, res) => {
  try {
    const { query, lat, lon, language = 'en' } = req.body;

    if (!query) {
      return res.status(400).json({ error: 'Please provide a search query.' });
    }

    // Translate to English if needed
    let englishQuery = query;
    if (language !== 'en' && language !== 'en-IN') {
      englishQuery = await translate(query, language, 'en');
    }

    let hospitals = [];

    if (lat && lon) {
      // Live GPS → real nearby search
      hospitals = await findNearbyHospitals(parseFloat(lat), parseFloat(lon), 5000);
    } else {
      // No GPS → return a Maps search link the user can click
      const searchUrl = buildMapsSearchUrl(englishQuery);
      return res.json({
        query: englishQuery,
        hospitals: [],
        noGps: true,
        searchUrl,
        message: 'Share your location for nearby hospitals, or click the search link.',
      });
    }

    res.json({
      query: englishQuery,
      count: hospitals.length,
      hospitals,
    });

  } catch (err) {
    console.error('Hospital route error:', err);
    res.status(500).json({ error: 'Failed to search hospitals', message: err.message });
  }
});

export default router;
