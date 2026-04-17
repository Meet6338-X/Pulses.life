// Emergency detection service

const EMERGENCY_KEYWORDS = {
  // True critical - immediate emergency response
  critical: [
    'cant breathe', "can't breathe", 'cannot breathe', 'not breathing',
    'stopped breathing', 'unconscious', 'unresponsive', 'no pulse',
    'severe bleeding', 'heavy bleeding', 'blood loss', 'brain hemorrhage',
    'anaphylaxis', 'anaphylactic', 'choking', 'airway', 'overdose',
    'poisoning', 'suicide', 'seizure', 'epilepsy attack', 'convulsion',
    'electric shock', 'drowning', 'head injury', 'spinal injury'
  ],
  // High priority - needs assessment
  high: [
    'difficulty breathing', 'shortness of breath', 'breathless',
    'very high fever', 'high fever', 'fainting', 'fainted', 'collapsed',
    'extreme pain', 'severe pain', 'diabetic coma', 'low blood sugar',
    'hypoglycemia', 'hypertensive crisis', 'paralysis', 'can\'t move',
    'sudden vision loss', 'sudden hearing loss', 'severe headache',
    'worst headache', 'thunderclap', 'fracture', 'bone broken',
    'snake bite', 'scorpion sting', 'allergic reaction'
  ],
  // Needs triage assessment - ask questions first
  needs_assessment: [
    'chest pain', 'heart attack', 'cardiac arrest', 'stroke', 'brain stroke',
    'pain in chest', 'chest hurts', 'chest discomfort'
  ]
};

// Triage questions for assessment-needed symptoms
const TRIAGE_QUESTIONS = {
  chest_pain: [
    {
      question: "How would you rate your chest pain on a scale of 1-10? (1 = mild discomfort, 10 = worst pain imaginable)",
      type: "severity",
      critical_threshold: 7
    },
    {
      question: "Is the chest pain spreading to your arm, neck, or jaw?",
      type: "radiation",
      critical_answers: ["yes", "y", "yeah", "spreading", "radiating"]
    },
    {
      question: "Are you experiencing shortness of breath along with the chest pain?",
      type: "associated",
      critical_answers: ["yes", "y", "yeah", "shortness", "breath", "breathing"]
    },
    {
      question: "How long have you had this chest pain?",
      type: "duration",
      critical_answers: ["sudden", "suddenly", "just started", "now"]
    }
  ]
};

/**
 * Detect if a message contains emergency keywords
 * @param {string} text
 * @returns {{
 *   isEmergency: boolean,
 *   severity: 'critical'|'high'|null,
 *   matchedKeywords: string[],
 *   needsAssessment: boolean,
 *   assessmentType: string|null
 * }}
 */
export function detectEmergency(text) {
  if (!text) return {
    isEmergency: false,
    severity: null,
    matchedKeywords: [],
    needsAssessment: false,
    assessmentType: null
  };

  const normalizedText = text.toLowerCase()
    .replace(/[।,।!?]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const matchedKeywords = [];

  // Check critical first - these trigger immediate emergency
  for (const kw of EMERGENCY_KEYWORDS.critical) {
    if (normalizedText.includes(kw)) {
      matchedKeywords.push(kw);
    }
  }
  if (matchedKeywords.length > 0) {
    return {
      isEmergency: true,
      severity: 'critical',
      matchedKeywords,
      needsAssessment: false,
      assessmentType: null
    };
  }

  // Check high priority - these trigger emergency
  for (const kw of EMERGENCY_KEYWORDS.high) {
    if (normalizedText.includes(kw)) {
      matchedKeywords.push(kw);
    }
  }
  if (matchedKeywords.length > 0) {
    return {
      isEmergency: true,
      severity: 'high',
      matchedKeywords,
      needsAssessment: false,
      assessmentType: null
    };
  }

  // Check needs assessment - these require triage questions first
  for (const kw of EMERGENCY_KEYWORDS.needs_assessment) {
    if (normalizedText.includes(kw)) {
      matchedKeywords.push(kw);
      return {
        isEmergency: false,
        severity: null,
        matchedKeywords,
        needsAssessment: true,
        assessmentType: 'chest_pain'
      };
    }
  }

  return {
    isEmergency: false,
    severity: null,
    matchedKeywords: [],
    needsAssessment: false,
    assessmentType: null
  };
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
