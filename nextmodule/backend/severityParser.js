// ============================================================
// MediRoute — Severity Parser
// Extracts structured severity data from symptom text.
// Uses keyword-based NLP (swappable for OpenAI/Groq later).
// ============================================================

// Keyword → severity + needs mapping
const SEVERITY_RULES = [
  {
    keywords: ['chest pain', 'heart attack', 'cardiac arrest', 'heart', 'cardiac', 'seene mein dard', 'dil', 'hriday'],
    severity: 'CRITICAL',
    predictedNeeds: ['ICU', 'Cardiologist', 'Ventilator'],
    specialistRequired: 'Cardiologist',
    summaryTemplate: 'Patient presenting with cardiac symptoms requiring immediate cardiological evaluation'
  },
  {
    keywords: ['stroke', 'paralysis', 'brain', 'seizure', 'unconscious', 'behosh', 'lakwa', 'dimag'],
    severity: 'CRITICAL',
    predictedNeeds: ['ICU', 'Neurologist', 'Ventilator'],
    specialistRequired: 'Neurologist',
    summaryTemplate: 'Patient presenting with neurological symptoms requiring immediate neurological evaluation'
  },
  {
    keywords: ['accident', 'crash', 'bleeding heavily', 'severe bleeding', 'hadsa', 'khoon', 'durghatna'],
    severity: 'CRITICAL',
    predictedNeeds: ['ICU', 'Trauma Surgeon'],
    specialistRequired: 'Trauma Surgeon',
    summaryTemplate: 'Patient involved in trauma/accident requiring immediate surgical evaluation'
  },
  {
    keywords: ['fracture', 'broken bone', 'broken leg', 'broken arm', 'haddi', 'toot', 'fracture'],
    severity: 'MODERATE',
    predictedNeeds: ['Orthopedic', 'General'],
    specialistRequired: 'Orthopedic',
    summaryTemplate: 'Patient presenting with possible fracture requiring orthopedic evaluation'
  },
  {
    keywords: ['breathing', 'breathless', 'asthma', 'saans', 'dum ghut', 'oxygen'],
    severity: 'CRITICAL',
    predictedNeeds: ['ICU', 'Ventilator', 'General'],
    specialistRequired: 'General',
    summaryTemplate: 'Patient presenting with respiratory distress requiring immediate ventilatory support'
  },
  {
    keywords: ['burn', 'fire', 'jalna', 'aag', 'jalana'],
    severity: 'MODERATE',
    predictedNeeds: ['Trauma Surgeon', 'General'],
    specialistRequired: 'Trauma Surgeon',
    summaryTemplate: 'Patient presenting with burn injuries requiring surgical evaluation'
  },
  {
    keywords: ['fever', 'cough', 'cold', 'vomit', 'diarrhea', 'bukhar', 'khansi', 'ulti', 'dast'],
    severity: 'LOW',
    predictedNeeds: ['General'],
    specialistRequired: 'General',
    summaryTemplate: 'Patient presenting with general symptoms requiring medical evaluation'
  },
  {
    keywords: ['pain', 'dard', 'taklif', 'problem', 'hurt'],
    severity: 'MODERATE',
    predictedNeeds: ['General'],
    specialistRequired: 'General',
    summaryTemplate: 'Patient presenting with pain symptoms requiring medical evaluation'
  }
];

/**
 * Parse symptoms text and extract structured severity data
 * @param {string} symptomsText - Raw symptoms from patient conversation
 * @returns {Object} Structured severity data
 */
function parseSeverity(symptomsText) {
  const text = symptomsText.toLowerCase().trim();
  
  // Check each rule in priority order (CRITICAL rules first)
  for (const rule of SEVERITY_RULES) {
    for (const keyword of rule.keywords) {
      if (text.includes(keyword)) {
        return {
          severity: rule.severity,
          predictedNeeds: [...rule.predictedNeeds],
          specialistRequired: rule.specialistRequired,
          summaryForHospital: rule.summaryTemplate,
          matchedKeyword: keyword,
          locationConfirmed: true
        };
      }
    }
  }

  // Default fallback — moderate severity, general practitioner
  return {
    severity: 'MODERATE',
    predictedNeeds: ['General'],
    specialistRequired: 'General',
    summaryForHospital: 'Patient presenting with unclassified symptoms requiring medical evaluation',
    matchedKeyword: null,
    locationConfirmed: true
  };
}

module.exports = { parseSeverity };
