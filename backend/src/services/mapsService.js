import axios from 'axios';

const MAPS_KEY = process.env.GOOGLE_MAPS_API_KEY;

/**
 * Find nearby hospitals using Google Maps Places API (Nearby Search)
 * @param {number} lat
 * @param {number} lon
 * @param {number} radiusMeters - default 5km
 * @param {string} keyword - optional filter (e.g. 'emergency', 'pharmacy')
 * @returns {Promise<Array>}
 */
export async function findNearbyHospitals(lat, lon, radiusMeters = 5000, keyword = 'hospital') {
  if (!MAPS_KEY) {
    console.warn('⚠️  GOOGLE_MAPS_API_KEY not set — returning empty hospital list.');
    return [];
  }

  try {
    // Use Places API v1 Nearby Search (new)
    const url = 'https://places.googleapis.com/v1/places:searchNearby';

    const body = {
      includedTypes: ['hospital', 'health', 'doctor', 'pharmacy', 'medical_lab'],
      maxResultCount: 10,
      locationRestriction: {
        circle: {
          center: { latitude: lat, longitude: lon },
          radius: radiusMeters,
        },
      },
    };

    const { data } = await axios.post(url, body, {
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': MAPS_KEY,
        'X-Goog-FieldMask': [
          'places.id',
          'places.displayName',
          'places.formattedAddress',
          'places.location',
          'places.nationalPhoneNumber',
          'places.rating',
          'places.types',
          'places.currentOpeningHours',
          'places.websiteUri',
        ].join(','),
      },
    });

    const places = data.places || [];

    return places.map(p => ({
      id: p.id,
      name: p.displayName?.text || 'Unknown Hospital',
      address: p.formattedAddress || '',
      city: extractCity(p.formattedAddress),
      state: extractState(p.formattedAddress),
      lat: p.location?.latitude || null,
      lon: p.location?.longitude || null,
      phone: p.nationalPhoneNumber || '',
      rating: p.rating || null,
      isOpen: p.currentOpeningHours?.openNow ?? null,
      types: p.types || [],
      website: p.websiteUri || '',
      emergency: p.types?.includes('hospital') || false,
      cghs: false,
      source: 'google_maps',
      mapsUrl: p.location
        ? `https://www.google.com/maps/dir/?api=1&destination=${p.location.latitude},${p.location.longitude}&destination_place_id=${p.id}`
        : `https://www.google.com/maps/search/${encodeURIComponent((p.displayName?.text || '') + ' hospital')}`,
      _distanceKm: haversineKm(lat, lon, p.location?.latitude, p.location?.longitude),
    })).sort((a, b) => (a._distanceKm || 999) - (b._distanceKm || 999));

  } catch (err) {
    console.error('Google Maps Places API error:', err.response?.data || err.message);
    return [];
  }
}

/**
 * Build a Google Maps directions URL (no API key needed — just a deep link)
 */
export function buildMapsUrl(destLat, destLon, destPlaceId = null) {
  if (destPlaceId) {
    return `https://www.google.com/maps/dir/?api=1&destination=${destLat},${destLon}&destination_place_id=${destPlaceId}`;
  }
  return `https://www.google.com/maps/dir/?api=1&destination=${destLat},${destLon}`;
}

/**
 * Build a Google Maps search URL for a hospital name + city (no API key needed)
 */
export function buildMapsSearchUrl(name, city = '') {
  return `https://www.google.com/maps/search/${encodeURIComponent(`${name} hospital ${city}`.trim())}`;
}

// --- helpers ---

function extractCity(address = '') {
  const parts = address.split(',');
  // City is usually 2nd-from-last before pincode+country
  if (parts.length >= 3) return parts[parts.length - 3]?.trim() || '';
  return '';
}

function extractState(address = '') {
  const parts = address.split(',');
  if (parts.length >= 2) {
    // Remove pincode from state part
    const stateRaw = parts[parts.length - 2]?.trim() || '';
    return stateRaw.replace(/\d{6}/, '').trim();
  }
  return '';
}

function haversineKm(lat1, lon1, lat2, lon2) {
  if (!lat1 || !lon1 || !lat2 || !lon2) return null;
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)) * 10) / 10;
}
