import Groq from 'groq-sdk';
import fs from 'fs';
import path from 'path';

let groqClient = null;

function getClient() {
  if (!groqClient) {
    groqClient = new Groq({ apiKey: process.env.GROQ_API_KEY });
  }
  return groqClient;
}

const SYSTEM_PROMPT = `You are a helpful, calm, and supportive AI Health Assistant designed to understand user symptoms.

CRITICAL RULE: Your entire response MUST be extremely short—strictly 1 to 2 sentences total (excluding the disclaimer and questions list). Be as brief as possible.

Flow Rules:
1. User describes their problem.
2. Cross-Questioning Stage: Ask 3 relevant, brief follow-up questions to understand severity and duration.
3. Analysis & Response Stage: Provide a 1-sentence summary of possible explanations and 1-sentence of actionable steps.
4. When to Seek Help: In 1 short sentence, state warning signs for an emergency.
5. If the situation warrants a hospital visit OR the user asks for nearby hospitals, you MUST output the exact phrase: "SHOW_NEARBY_HOSPITALS" at the very end of your response.
6. Disclaimer: Always end with "This is not a medical diagnosis. Please consult a qualified professional."

Maintain a neutral, non-alarmist tone. Prioritize user safety. Do not make definitive diagnoses.`;

/**
 * Generate a grounded medical response using Groq (Llama 3.3)
 * @param {string} userQuery - User's question in English
 * @param {string} context - RAG-retrieved context
 * @param {string} intent - 'symptoms' | 'hospital' | 'general'
 * @param {Array} conversationMessages - Array of {role, content} message objects
 * @param {string} sessionId - Session ID for state tracking
 * @returns {Promise<string>} - AI response text (English)
 */
export async function generateResponse(userQuery, context, intent = 'general', conversationMessages = [], sessionId = '') {
  const client = getClient();
  const hasContext = context && context.trim().length > 0;

  // Build multi-turn messages for the LLM keeping the try44 SYSTEM_PROMPT pristine
  const messages = [
    { role: 'system', content: SYSTEM_PROMPT }
  ];

  if (hasContext) {
    messages.push({ role: 'system', content: `[RAG KNOWLEDGE]\n${context}` });
  }

  const aiCount = conversationMessages.filter(m => m.role === 'ai' || m.role === 'assistant').length;
  if (aiCount >= 3) {
    messages.push({ role: 'system', content: `[CRITICAL RULE ENFORCEMENT]: You have already asked 3 questions. YOU MUST NOT ASK ANY MORE QUESTIONS. Provide your 1-sentence Analysis & Response (Step 3), Warning Signs (Step 4), and you MUST output EXACTLY "SHOW_NEARBY_HOSPITALS" at the very end of your response (Step 5).` });
  }

  // Add prior conversation as proper turns
  for (const msg of conversationMessages) {
    if (msg.role === 'user') {
      messages.push({ role: 'user', content: msg.content });
    } else if (msg.role === 'ai' || msg.role === 'assistant') {
      messages.push({ role: 'assistant', content: msg.content });
    }
  }

  // Add the current user message
  messages.push({ role: 'user', content: userQuery });

  try {
    console.log(`🤖 Sending ${messages.length} messages to Groq using try44 logic`);

    const completion = await client.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: messages,
      temperature: 0.6,
      max_tokens: 1024,
      top_p: 1,
    });

    return completion.choices[0]?.message?.content || "I'm sorry, I couldn't generate a response. Please try again.";
  } catch (err) {
    console.error('Groq API error:', err);
    return `I'm having trouble connecting right now. Please try again in a moment.`;
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
