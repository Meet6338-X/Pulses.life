import { searchMedical, searchHospitals } from './vectorStore.js';

/**
 * Build context string from retrieved medical chunks
 * @param {string} query
 * @returns {string}
 */
export async function retrieveMedicalContext(query) {
  const results = await searchMedical(query, 3);
  if (results.length === 0) {
    console.log('📚 RAG: No matching medical entries for:', query);
    return '';
  }

  console.log(`📚 RAG: Found ${results.length} entries for: "${query}"`);

  return results.map((r, i) =>
    `[Source ${i + 1}] Q: ${r.question}\nA: ${r.answer}\nCategory: ${r.category} | Source: ${r.source}`
  ).join('\n\n');
}

/**
 * Retrieve and format hospital results
 * @param {string} query
 * @param {number} lat
 * @param {number} lon
 * @returns {Array}
 */
export async function retrieveHospitals(query, lat = null, lon = null) {
  return await searchHospitals(query, lat, lon, 5);
}

/**
 * Build combined context for LLM (medical + hospital summary)
 */
export function buildCombinedContext(medContext, hospitals) {
  let context = medContext;

  if (hospitals && hospitals.length > 0) {
    const hospitalSummary = hospitals.slice(0, 3).map(h =>
      `${h.name} (${h.city}, ${h.state}) — ${h.type} — ${(h.services || []).slice(0, 3).join(', ')}`
    ).join('\n');
    context += `\n\nRELEVANT HOSPITALS:\n${hospitalSummary}`;
  }

  return context;
}
