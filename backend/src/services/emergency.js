// Emergency detection service

const EMERGENCY_KEYWORDS = {
  critical: [
    'chest pain', 'heart attack', 'cardiac arrest', 'stroke', 'brain stroke',
    'cant breathe', "can't breathe", 'cannot breathe', 'not breathing',
    'stopped breathing', 'unconscious', 'unresponsive', 'no pulse',
    'severe bleeding', 'heavy bleeding', 'blood loss', 'brain hemorrhage',
    'anaphylaxis', 'anaphylactic', 'choking', 'airway', 'overdose',
    'poisoning', 'suicide', 'seizure', 'epilepsy attack', 'convulsion',
    'electric shock', 'drowning', 'head injury', 'spinal injury'
  ],
  high: [
    'difficulty breathing', 'shortness of breath', 'breathless',
    'very high fever', 'high fever', 'fainting', 'fainted', 'collapsed',
    'extreme pain', 'severe pain', 'diabetic coma', 'low blood sugar',
    'hypoglycemia', 'hypertensive crisis', 'paralysis', 'can\'t move',
    'sudden vision loss', 'sudden hearing loss', 'severe headache',
    'worst headache', 'thunderclap', 'fracture', 'bone broken',
    'snake bite', 'scorpion sting', 'allergic reaction'
  ]
};

/**
 * Detect if a message contains emergency keywords
 * @param {string} text
 * @returns {{ isEmergency: boolean, severity: 'critical'|'high'|null, matchedKeywords: string[] }}
 */
export function detectEmergency(text) {
  if (!text) return { isEmergency: false, severity: null, matchedKeywords: [] };

  const normalizedText = text.toLowerCase()
    .replace(/[।,।!?]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const matchedKeywords = [];

  // Check critical first
  for (const kw of EMERGENCY_KEYWORDS.critical) {
    if (normalizedText.includes(kw)) {
      matchedKeywords.push(kw);
    }
  }
  if (matchedKeywords.length > 0) {
    return { isEmergency: true, severity: 'critical', matchedKeywords };
  }

  // Check high
  for (const kw of EMERGENCY_KEYWORDS.high) {
    if (normalizedText.includes(kw)) {
      matchedKeywords.push(kw);
    }
  }
  if (matchedKeywords.length > 0) {
    return { isEmergency: true, severity: 'high', matchedKeywords };
  }

  return { isEmergency: false, severity: null, matchedKeywords: [] };
}

/**
 * Build emergency response message
 */
export function buildEmergencyResponse(severity, hospital = null) {
  const baseMessage = severity === 'critical'
    ? '🚨 CRITICAL EMERGENCY DETECTED. Call 108 (ambulance) IMMEDIATELY. Do not wait. Stay on the line with the dispatcher.'
    : '⚠️ Emergency situation detected. Please call 108 (ambulance) or go to the nearest emergency room.';

  let hospitalInfo = '';
  if (hospital) {
    hospitalInfo = `\n\nNearest Emergency Hospital: ${hospital.name}, ${hospital.city} (${hospital._distanceKm || '?'} km away). Phone: ${hospital.phone || 'N/A'}`;
  }

  const disclaimer = '\n\n⚠️ Medical Disclaimer: This is an automated alert. Always follow professional emergency responder guidance.';

  return baseMessage + hospitalInfo + disclaimer;
}
