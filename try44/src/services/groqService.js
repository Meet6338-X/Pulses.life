import Groq from "groq-sdk";

// Initialize Groq client with the Vite environment variable
const groq = new Groq({
  apiKey: import.meta.env.VITE_GROQ_API_KEY,
  dangerouslyAllowBrowser: true, // required for testing on client side directly
});

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
 * Send messages to Groq using the most robust medical model available.
 * @param {Array<{role: string, content: string}>} messages array of interaction history
 * @returns {Promise<string>} text response from model
 */
export async function getHealthAnalysis(messages) {
  try {
    const chatCompletion = await groq.chat.completions.create({
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        ...messages
      ],
      model: "llama-3.3-70b-versatile",
      temperature: 0.6,
      max_tokens: 1024,
      top_p: 1,
    });
    
    return chatCompletion.choices[0]?.message?.content || "I'm having trouble processing that right now.";
  } catch (error) {
    console.error("Groq API Error:", error);
    return "Error communicating with AI service. Please try again later.";
  }
}
