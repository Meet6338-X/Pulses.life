// Universal symptom classification and triage engine

// Symptom categories with keywords and assessment protocols
const SYMPTOM_CATEGORIES = {
  // Cardiovascular
  cardiovascular: {
    keywords: [
      'chest pain', 'heart', 'cardiac', 'palpitation', 'palpitations', 'chest discomfort', 'chest tightness', 'angina',
      'heart attack', 'heart pain', 'chest hurting', 'pressure in chest', 'tightness in chest', 'pain in chest',
      'severe chest pain', 'intense chest pain', 'throbbing chest pain', 'constant chest pain', 'persistent chest pain',
      'heart racing', 'irregular heartbeat', 'fast heartbeat', 'slow heartbeat'
    ],
    assessmentType: 'cardiovascular',
    urgency: 'high'
  },

  // Respiratory
  respiratory: {
    keywords: [
      "cough", "coughing", "breath", "breathing", "shortness of breath", "wheezing", "asthma", "lung", "respiratory",
      "difficulty breathing", "can't breathe", "cannot breathe", "breathlessness", "wheezy", "asthmatic",
      "dry cough", "wet cough", "productive cough", "chest congestion", "lung pain", "respiratory pain",
      "severe cough", "intense cough", "persistent cough", "constant cough", "chronic cough",
      "cough for days", "cough for weeks", "cough for months"
    ],
    assessmentType: 'respiratory',
    urgency: 'medium'
  },

  // Gastrointestinal
  gastrointestinal: {
    keywords: [
      'stomach pain', 'abdominal pain', 'abdomen', 'belly', 'nausea', 'vomiting', 'diarrhea', 'constipation', 'indigestion', 'heartburn', 'gas', 'bloating',
      'stomach ache', 'belly pain', 'abdominal discomfort', 'upper stomach pain', 'lower stomach pain', 'stomach cramps',
      'nauseous', 'feeling sick', 'throwing up', 'loose motions', 'watery stools', 'hard stools', 'difficulty passing stool',
      'acid reflux', 'burning in stomach', 'bloated stomach', 'stomach swelling', 'gassy', 'flatulence',
      'severe stomach pain', 'intense abdominal pain', 'throbbing stomach pain', 'constant stomach pain', 'persistent stomach pain',
      'stomach pain for days', 'stomach pain for weeks', 'chronic stomach pain'
    ],
    assessmentType: 'gastrointestinal',
    urgency: 'medium'
  },

  // Neurological
  neurological: {
    keywords: [
      'headache', 'migraine', 'dizziness', 'vertigo', 'seizure', 'weakness', 'numbness', 'tingling', 'confusion', 'memory', 'stroke',
      'head pain', 'head ache', 'severe headache', 'intense headache', 'throbbing headache', 'constant headache', 'persistent headache',
      'forehead pain', 'forehead hurting', 'pain in forehead', 'temples pain', 'pain in temples', 'behind eyes pain', 'pain behind eyes',
      'eye pain', 'eyes hurting', 'pain in eyes', 'vision changes', 'blurry vision', 'double vision',
      'migraine headache', 'migraine pain', 'vertigo', 'spinning sensation', 'dizzy spells',
      'seizure', 'convulsions', 'fits', 'epilepsy', 'fainting', 'blackouts',
      'weak limbs', 'numb arms', 'numb legs', 'tingling sensation', 'pins and needles', 'paralysis',
      'confusion', 'disoriented', 'memory loss', 'forgetfulness', 'brain fog',
      'stroke symptoms', 'sudden weakness', 'facial droop', 'slurred speech',
      'headache for days', 'headache for weeks', 'chronic headache', 'persistent dizziness'
    ],
    assessmentType: 'neurological',
    urgency: 'medium'
  },

  // Pain (general)
  pain: {
    keywords: [
      'pain', 'ache', 'hurts', 'aching', 'sore', 'soreness', 'hurt', 'paining', 'painful',
      'severe pain', 'intense pain', 'throbbing pain', 'sharp pain', 'dull pain', 'burning pain', 'stabbing pain',
      'constant pain', 'persistent pain', 'chronic pain', 'ongoing pain', 'recurring pain',
      'pain for days', 'pain for weeks', 'pain for months', 'pain since morning', 'pain since yesterday',
      'body pain', 'general pain', 'muscle pain', 'joint pain', 'back pain', 'neck pain', 'shoulder pain', 'knee pain'
    ],
    assessmentType: 'pain',
    urgency: 'low'
  },

  // General/Systemic
  general: {
    keywords: [
      'fever', 'temperature', 'fatigue', 'tired', 'rash', 'itching', 'swelling', 'edema', 'fever', 'chills',
      'high fever', 'low fever', 'feverish', 'elevated temperature', 'body temperature', 'febrile',
      'tiredness', 'exhaustion', 'weakness', 'fatigued', 'lethargic', 'low energy',
      'skin rash', 'itchy skin', 'red rash', 'skin irritation', 'hives', 'eczema',
      'swollen', 'swelling', 'edema', 'puffy', 'inflammation', 'bloating',
      'chills', 'shivering', 'cold', 'fever chills', 'rigors'
    ],
    assessmentType: 'general',
    urgency: 'low'
  },

  // Musculoskeletal
  musculoskeletal: {
    keywords: [
      'joint pain', 'muscle pain', 'back pain', 'neck pain', 'knee pain', 'arthritis', 'sprain', 'strain',
      'joint ache', 'muscle ache', 'back ache', 'neck ache', 'knee ache', 'shoulder pain', 'elbow pain', 'wrist pain',
      'arthritis pain', 'arthritic', 'rheumatism', 'sprained', 'strained', 'pulled muscle', 'muscle strain',
      'severe joint pain', 'intense muscle pain', 'throbbing back pain', 'constant neck pain', 'persistent knee pain',
      'joint pain for days', 'muscle pain for weeks', 'chronic back pain', 'long-term neck pain'
    ],
    assessmentType: 'musculoskeletal',
    urgency: 'low'
  }
};

// Emergency red flags that trigger immediate escalation
const EMERGENCY_RED_FLAGS = [
  'unconscious', 'not breathing', 'no pulse', 'severe bleeding', 'choking',
  'cardiac arrest', 'heart attack', 'stroke', 'seizure', 'overdose',
  'severe allergic reaction', 'anaphylaxis'
];

/**
 * Classify symptoms from user query
 * @param {string} query - User's health query
 * @returns {Object} Classification result
 */
/**
 * Detect severity level from query
 * @param {string} query
 * @returns {string} 'mild' | 'moderate' | 'severe'
 */
function detectSeverity(query) {
  const severeKeywords = ['severe', 'intense', 'worst', 'unbearable', 'extreme', 'terrible', 'horrible', 'excruciating'];
  const mildKeywords = ['mild', 'slight', 'minor', 'light', 'little'];

  const lowerQuery = query.toLowerCase();

  if (severeKeywords.some(kw => lowerQuery.includes(kw))) {
    return 'severe';
  }
  if (mildKeywords.some(kw => lowerQuery.includes(kw))) {
    return 'mild';
  }
  return 'moderate';
}

/**
 * Detect symptom combinations for better categorization
 * @param {Array} matches
 * @param {string} query
 * @returns {Array} enhanced matches
 */
function enhanceWithCombinations(matches, query) {
  const lowerQuery = query.toLowerCase();

  // Headache + eye pain → boost neurological
  if (matches.some(m => m.category === 'neurological') &&
      (lowerQuery.includes('eye') || lowerQuery.includes('vision'))) {
    const neuroMatch = matches.find(m => m.category === 'neurological');
    if (neuroMatch) {
      neuroMatch.confidence += 0.5; // Boost confidence for combination
      neuroMatch.combination = 'headache with eye involvement';
    }
  }

  // Chest pain + breathing → boost cardiovascular
  if (matches.some(m => m.category === 'cardiovascular') &&
      (lowerQuery.includes('breath') || lowerQuery.includes('short'))) {
    const cardioMatch = matches.find(m => m.category === 'cardiovascular');
    if (cardioMatch) {
      cardioMatch.confidence += 0.5;
      cardioMatch.combination = 'chest pain with breathing difficulty';
    }
  }

  return matches;
}

export function classifySymptoms(query) {
  if (!query) return { category: 'unknown', assessmentType: 'general', urgency: 'low' };

  const normalizedQuery = query.toLowerCase().trim();

  // Check for immediate emergency red flags first
  for (const flag of EMERGENCY_RED_FLAGS) {
    if (normalizedQuery.includes(flag)) {
      return {
        category: 'emergency',
        assessmentType: 'emergency',
        urgency: 'critical',
        redFlag: flag
      };
    }
  }

  // Classify into symptom categories
  const matches = [];

  for (const [category, config] of Object.entries(SYMPTOM_CATEGORIES)) {
    let categoryMatches = [];

    for (const keyword of config.keywords) {
      const confidence = calculateKeywordConfidence(keyword, normalizedQuery);
      if (confidence > 0) {
        categoryMatches.push({
          category,
          assessmentType: config.assessmentType,
          urgency: config.urgency,
          keyword,
          confidence
        });
      }
    }

    // If any keywords matched for this category, take the best match
    if (categoryMatches.length > 0) {
      const bestMatch = categoryMatches.reduce((best, current) =>
        current.confidence > best.confidence ? current : best
      );
      matches.push(bestMatch);
    }
  }

  // Enhance with symptom combinations
  const enhancedMatches = enhanceWithCombinations(matches, normalizedQuery);

  // Detect severity
  const severity = detectSeverity(normalizedQuery);

  if (enhancedMatches.length === 0) {
    return {
      category: 'general',
      assessmentType: 'general',
      urgency: 'low',
      severity,
      matches: []
    };
  }

  // Sort by confidence and urgency
  enhancedMatches.sort((a, b) => {
    const urgencyOrder = { critical: 3, high: 2, medium: 1, low: 0 };
    const urgencyDiff = urgencyOrder[b.urgency] - urgencyOrder[a.urgency];
    if (urgencyDiff !== 0) return urgencyDiff;
    return b.confidence - a.confidence;
  });

  const primaryMatch = enhancedMatches[0];

  return {
    category: primaryMatch.category,
    assessmentType: primaryMatch.assessmentType,
    urgency: primaryMatch.urgency,
    severity,
    primaryKeyword: primaryMatch.keyword,
    matches: enhancedMatches,
    multiSymptom: enhancedMatches.length > 1,
    combination: primaryMatch.combination
  };
}

/**
 * Calculate Levenshtein distance between two strings
 * @param {string} str1
 * @param {string} str2
 * @returns {number}
 */
function levenshteinDistance(str1, str2) {
  const matrix = [];
  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }
  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }
  return matrix[str2.length][str1.length];
}

/**
 * Check if strings are similar (fuzzy match)
 * @param {string} str1
 * @param {string} str2
 * @param {number} threshold - maximum edit distance for match
 * @returns {boolean}
 */
function isFuzzyMatch(str1, str2, threshold = 2) {
  const distance = levenshteinDistance(str1.toLowerCase(), str2.toLowerCase());
  const maxLength = Math.max(str1.length, str2.length);
  return distance <= threshold && distance / maxLength < 0.5; // Allow up to 50% difference
}

/**
 * Calculate confidence score for keyword match (with fuzzy matching)
 * @param {string} keyword
 * @param {string} query
 * @returns {number}
 */
function calculateKeywordConfidence(keyword, query) {
  const keywordLower = keyword.toLowerCase();
  const queryLower = query.toLowerCase();

  // Exact phrase match gets highest confidence
  if (queryLower.includes(keywordLower)) {
    return keyword.split(' ').length * 2; // Longer phrases = higher confidence
  }

  // Check for partial word matches or fuzzy matches
  const keywordWords = keywordLower.split(' ');
  const queryWords = queryLower.split(' ');

  let matchScore = 0;

  // Check if any keyword word is in query or fuzzy matches
  for (const kwWord of keywordWords) {
    for (const qWord of queryWords) {
      if (qWord.includes(kwWord) || kwWord.includes(qWord)) {
        matchScore += 1;
      } else if (isFuzzyMatch(kwWord, qWord)) {
        matchScore += 0.8; // Fuzzy match gets slightly lower score
      }
    }
  }

  // Check if keyword contains query words
  for (const qWord of queryWords) {
    if (keywordLower.includes(qWord)) {
      matchScore += 0.5;
    }
  }

  return matchScore;
}

/**
 * Get assessment protocol for symptom category
 * @param {string} assessmentType
 * @returns {Object} Assessment protocol
 */
export function getAssessmentProtocol(assessmentType) {
  const protocols = {
    cardiovascular: {
      questions: [
        {
          id: 'cv_location',
          question: 'Where exactly is the chest pain located? (center of chest, left side, right side, etc.)',
          type: 'location'
        },
        {
          id: 'cv_intensity',
          question: 'How would you rate the pain on a scale of 1-10? (1 = mild discomfort, 10 = worst pain imaginable)',
          type: 'severity',
          criticalThreshold: 7
        },
        {
          id: 'cv_radiation',
          question: 'Does the pain spread to your arm, neck, jaw, or back?',
          type: 'radiation',
          criticalAnswers: ['yes', 'arm', 'neck', 'jaw', 'back']
        },
        {
          id: 'cv_breathing',
          question: 'Are you experiencing shortness of breath along with the chest pain?',
          type: 'associated',
          criticalAnswers: ['yes', 'shortness', 'breath', 'breathing']
        },
        {
          id: 'cv_duration',
          question: 'How long has this chest pain been going on?',
          type: 'duration'
        },
        {
          id: 'cv_triggers',
          question: 'What makes the pain better or worse? (rest, movement, breathing, etc.)',
          type: 'triggers'
        }
      ],
      riskFactors: ['radiation', 'breathing', 'intensity_7_plus'],
      emergencyScore: 2, // 2+ risk factors = emergency
      urgentScore: 1     // 1 risk factor = urgent
    },

    respiratory: {
      questions: [
        {
          id: 'resp_type',
          question: 'What type of cough do you have? (dry, productive with sputum, wheezing)',
          type: 'character'
        },
        {
          id: 'resp_duration',
          question: 'How long have you had this cough?',
          type: 'duration'
        },
        {
          id: 'resp_breathing',
          question: 'Are you having difficulty breathing or shortness of breath?',
          type: 'severity',
          criticalAnswers: ['difficulty', 'shortness', 'breath', 'breathing']
        },
        {
          id: 'resp_fever',
          question: 'Do you have a fever along with the cough?',
          type: 'associated'
        },
        {
          id: 'resp_chest_pain',
          question: 'Do you have chest pain when you cough?',
          type: 'associated'
        }
      ],
      riskFactors: ['breathing_difficulty', 'high_fever'],
      emergencyScore: 2,
      urgentScore: 1
    },

    gastrointestinal: {
      questions: [
        {
          id: 'gi_location',
          question: 'Where exactly is the abdominal pain? (upper/middle/lower abdomen, right/left side)',
          type: 'location'
        },
        {
          id: 'gi_intensity',
          question: 'How severe is the pain on a scale of 1-10?',
          type: 'severity',
          criticalThreshold: 8
        },
        {
          id: 'gi_duration',
          question: 'How long have you had this abdominal pain?',
          type: 'duration'
        },
        {
          id: 'gi_vomiting',
          question: 'Are you vomiting? If so, what does the vomit look like?',
          type: 'associated'
        },
        {
          id: 'gi_bowel',
          question: 'Have you had any changes in your bowel movements?',
          type: 'associated'
        },
        {
          id: 'gi_meals',
          question: 'Is the pain related to eating? (before/after meals, certain foods)',
          type: 'triggers'
        }
      ],
      riskFactors: ['severe_pain', 'vomiting_blood', 'no_bowel_movement'],
      emergencyScore: 2,
      urgentScore: 1
    },

    neurological: {
      questions: [
        {
          id: 'neuro_type',
          question: 'Can you describe the headache? (throbbing, constant, one-sided, etc.)',
          type: 'character'
        },
        {
          id: 'neuro_intensity',
          question: 'How severe is the headache on a scale of 1-10?',
          type: 'severity',
          criticalThreshold: 8
        },
        {
          id: 'neuro_symptoms',
          question: 'Do you have any other symptoms with the headache? (nausea, vision changes, weakness, confusion)',
          type: 'associated',
          criticalAnswers: ['vision', 'weakness', 'confusion', 'speech', 'balance']
        },
        {
          id: 'neuro_sudden',
          question: 'Did the headache come on suddenly or gradually?',
          type: 'onset'
        },
        {
          id: 'neuro_triggers',
          question: 'What triggers or worsens the headache?',
          type: 'triggers'
        }
      ],
      riskFactors: ['sudden_onset', 'neurological_symptoms', 'worst_headache'],
      emergencyScore: 2,
      urgentScore: 1
    },

    pain: {
      questions: [
        {
          id: 'pain_location',
          question: 'Where exactly is the pain located?',
          type: 'location'
        },
        {
          id: 'pain_intensity',
          question: 'How would you rate the pain intensity (1-10)?',
          type: 'severity'
        },
        {
          id: 'pain_duration',
          question: 'How long have you had this pain?',
          type: 'duration'
        },
        {
          id: 'pain_type',
          question: 'What does the pain feel like? (sharp, dull, throbbing, burning, stabbing)',
          type: 'character'
        },
        {
          id: 'pain_triggers',
          question: 'What makes the pain better or worse?',
          type: 'triggers'
        },
        {
          id: 'pain_associated',
          question: 'Do you have any other symptoms with the pain?',
          type: 'associated'
        }
      ],
      riskFactors: ['severe_pain', 'associated_symptoms'],
      emergencyScore: 3,
      urgentScore: 2
    },

    general: {
      questions: [
        {
          id: 'gen_duration',
          question: 'How long have you been experiencing these symptoms?',
          type: 'duration'
        },
        {
          id: 'gen_severity',
          question: 'How severe are your symptoms affecting your daily activities?',
          type: 'severity'
        },
        {
          id: 'gen_other',
          question: 'Are there any other symptoms you\'re experiencing?',
          type: 'associated'
        },
        {
          id: 'gen_triggers',
          question: 'What makes your symptoms better or worse?',
          type: 'triggers'
        }
      ],
      riskFactors: [],
      emergencyScore: 5, // Very high threshold for general symptoms
      urgentScore: 3
    }
  };

  return protocols[assessmentType] || protocols.general;
}

/**
 * Evaluate assessment answers and determine risk level
 * @param {string} assessmentType
 * @param {Object} answers
 * @returns {Object} Risk assessment
 */
export function evaluateRisk(assessmentType, answers) {
  const protocol = getAssessmentProtocol(assessmentType);
  let riskScore = 0;
  const riskFactors = [];

  // Evaluate each answer for risk factors
  for (const [questionId, answer] of Object.entries(answers)) {
    const question = protocol.questions.find(q => q.id === questionId);
    if (!question) continue;

    if (question.criticalThreshold && parseInt(answer) >= question.criticalThreshold) {
      riskScore += 2;
      riskFactors.push(`${questionId}_high`);
    }

    if (question.criticalAnswers) {
      const normalizedAnswer = answer.toLowerCase();
      const hasCriticalAnswer = question.criticalAnswers.some(critical =>
        normalizedAnswer.includes(critical)
      );
      if (hasCriticalAnswer) {
        riskScore += 2;
        riskFactors.push(`${questionId}_critical`);
      }
    }
  }

  // Determine care level
  let careLevel = 'self_care';
  let recommendation = 'Manage at home. Consult doctor if worse.';

  if (riskScore >= protocol.emergencyScore) {
    careLevel = 'emergency';
    recommendation = 'Emergency! Call 108 now.';
  } else if (riskScore >= protocol.urgentScore) {
    careLevel = 'urgent';
    recommendation = 'See doctor today. Call 104.';
  } else if (riskScore >= 1) {
    careLevel = 'primary_care';
    recommendation = 'See doctor soon. Visit PHC.';
  }

  recommendation += '\n⚠️ General guidance only. Consult doctor.';

  return {
    careLevel,
    riskScore,
    riskFactors,
    recommendation,
    confidence: calculateConfidence(answers, protocol.questions.length)
  };
}

/**
 * Calculate assessment confidence based on questions answered
 * @param {Object} answers
 * @param {number} totalQuestions
 * @returns {number} Confidence score 0-1
 */
function calculateConfidence(answers, totalQuestions) {
  const answeredCount = Object.keys(answers).length;
  return Math.min(answeredCount / totalQuestions, 1);
}