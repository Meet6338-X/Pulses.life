import Groq from 'groq-sdk';

let groqClient = null;

function getClient() {
  if (!groqClient) {
    groqClient = new Groq({ apiKey: process.env.GROQ_API_KEY });
  }
  return groqClient;
}

const DISCLAIMER = `\n\n⚠️ **Medical Disclaimer**: This information is for general guidance only and does not constitute medical advice. Always consult a qualified healthcare professional for diagnosis and treatment.`;

/**
 * Generate a grounded medical response using Groq (Llama 3)
 * @param {string} userQuery - User's question in English
 * @param {string} context - RAG-retrieved context
 * @param {string} intent - 'symptoms' | 'hospital' | 'general'
 * @returns {Promise<string>} - AI response text (English)
 */
export async function generateResponse(userQuery, context, intent = 'general') {
  const client = getClient();

  const hasContext = context && context.trim().length > 0;

  const systemPrompt = `You are Pulses — an advanced, empathetic AI health assistant for Indian users. You speak like a knowledgeable medical professional who genuinely cares, avoiding dense textbook jargon while remaining authoritative and clear.

STRICT RULES:
1. GROUNDING: ONLY use facts explicitly stated in the CONTEXT below. Do NOT hallucinate or provide medical advice from outside the CONTEXT.
  2. FORMATTING: Format your response beautifully using Markdown. Use **bold text** for key terms, concise bullet points for lists (like symptoms or steps), and clear paragraph breaks to make it highly readable.
3. TONE: Be empathetic, polite, and warm. Use "you" and "your". Start with a brief, caring acknowledgment if the user is unwell.
4. RELEVANCE: Directly answer the user's question using the provided context. If the context has a specific answer or treatment steps, list them clearly.
5. NO CONTEXT: If the context lacks relevant information to answer the question securely, firmly but politely state: "I don't have specific information on this. Please consult a doctor or visit your nearest health centre for proper medical guidance."
6. EMERGENCIES: If the query or intent implies an emergency (like chest pain, severe bleeding, unconsciousness), your VERY FIRST sentence must be: "**This sounds like a medical emergency. Please call 108 (ambulance) immediately or rush to the nearest emergency room.**"

${hasContext
      ? `CONTEXT (use ONLY this — base your medical facts strictly on what is provided here):\n---\n${context}\n---`
      : `CONTEXT: [No matching entries found in knowledge base — politely inform the user you don't have specific info and suggest seeing a doctor]`
    }

USER INTENT: ${intent}`;

  try {
    const completion = await client.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userQuery }
      ],
      temperature: 0.3,
      max_tokens: 600,
    });

    const response = completion.choices[0]?.message?.content || "I'm sorry, I couldn't generate a response. Please try again.";
    return response + DISCLAIMER;
  } catch (err) {
    console.error('Groq API error:', err.message);
    return `I'm having trouble connecting right now. Please try again in a moment.${DISCLAIMER}`;
  }
}

/**
 * Detect intent from user query
 * @param {string} query
 * @returns {'symptoms' | 'hospital' | 'emergency' | 'general'}
 */
export function detectIntent(query) {
  const q = query.toLowerCase();

  const emergencyKeywords = [
    'chest pain', 'heart attack', 'stroke', 'can\'t breathe', 'cannot breathe',
    'difficulty breathing', 'unconscious', 'fainted', 'severe bleeding',
    'not breathing', 'no pulse', 'seizure', 'convulsion', 'overdose',
    'poisoning', 'choking', 'ambulance', 'emergency', 'dying'
  ];

  const hospitalKeywords = [
    'hospital', 'clinic', 'doctor', 'nearest', 'nearby', 'find', 'where',
    'location', 'address', 'cghs', 'empanelled', 'centre', 'health center'
  ];

  const symptomKeywords = [
    'symptom', 'pain', 'ache', 'fever', 'cough', 'cold', 'headache',
    'nausea', 'vomit', 'diarrhea', 'rash', 'tired', 'fatigue', 'dizzy',
    'weak', 'swelling', 'infection', 'what is', 'how to treat', 'medicine', 'treatment'
  ];

  if (emergencyKeywords.some(k => q.includes(k))) return 'emergency';
  if (hospitalKeywords.some(k => q.includes(k))) return 'hospital';
  if (symptomKeywords.some(k => q.includes(k))) return 'symptoms';
  return 'general';
}
