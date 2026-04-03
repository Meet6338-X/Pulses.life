import fs from 'fs';
import path from 'path';
import axios from 'axios';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

let hospitalCache = [];
let medicalVectors = [];

function cosineSimilarity(a, b) {
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

const VOCAB = [
  'fever', 'pain', 'headache', 'cough', 'cold', 'nausea', 'vomit', 'diarrhea',
  'rash', 'fatigue', 'tired', 'dizzy', 'weak', 'swelling', 'infection', 'diabetes',
  'hypertension', 'blood', 'pressure', 'heart', 'chest', 'breathing', 'lung', 'cancer',
  'kidney', 'liver', 'stomach', 'throat', 'skin', 'eye', 'ear', 'bone', 'joint',
  'muscle', 'nerve', 'brain', 'mental', 'anxiety', 'depression', 'allergies', 'asthma',
  'medicine', 'treatment', 'therapy', 'vaccine', 'surgery', 'diet', 'exercise',
  'prevention', 'symptoms', 'diagnosis', 'prescription', 'dosage', 'side', 'effects',
  'neurology', 'cardiology', 'orthopedic', 'pediatric', 'gynecology', 'oncology',
  'emergency', 'trauma', 'icu', 'dental', 'cghs', 'clinic', 'hospital'
];

function embed(text) {
  const tokens = text.toLowerCase().split(/\s+|[,.\-()]+/).filter(Boolean);
  const vec = new Array(VOCAB.length).fill(0);
  for (const token of tokens) {
    const idx = VOCAB.indexOf(token);
    if (idx !== -1) vec[idx] += 1;
    for (let i = 0; i < VOCAB.length; i++) {
        if (token.length > 3 && (VOCAB[i].includes(token) || token.includes(VOCAB[i]))) {
            vec[i] += 0.5;
        }
    }
  }
  const norm = Math.sqrt(vec.reduce((s, v) => s + v * v, 0));
  if (norm > 0) return vec.map(v => v / norm);
  return vec;
}

// distance = 2R * asin( sqrt(...) ) Implementation exactly as requested
function haversineDistKm(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth Radius in KM
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  
  const a = Math.pow(Math.sin(dLat / 2), 2) + 
            Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * 
            Math.pow(Math.sin(dLon / 2), 2);
            
  // Strictly requested: 2R * asin(sqrt(...))
  return 2 * R * Math.asin(Math.sqrt(a));
}

export async function initVectorStore() {
  try {
    console.log('⚡ Initializing RAM-based vector cache layers...');
    
    // Load pre-embedded hospitals directly into RAM from purely external-sourced cache array
    const hospitalCachePath = path.join(__dirname, '..', '..', 'cache', 'processed_hospitals.json');
    if (fs.existsSync(hospitalCachePath)) {
      hospitalCache = JSON.parse(fs.readFileSync(hospitalCachePath, 'utf-8'));
      console.log(`✅ Loaded ${hospitalCache.length} hospitals with fast semantic vectors into memory.`);
    } else {
      console.warn('⚠️ No hospital Cache found! Run `npm run process-data` first.');
    }
    
    // Dynamically fetch QA dataset instead of static `/data`
    let data;
    try {
      const resp = await axios.get('https://raw.githubusercontent.com/jind11/MedQA/master/data/dev.json');
      data = resp.data;
    } catch (e) {
      data = null;
    }
    
    let qaPairs = [];
    if (data && Array.isArray(data) && data.length > 0) {
      qaPairs = data.slice(0, 100).map(i => ({ question: i.question || i.q, answer: i.answer || i.a, category: 'MedQA' }));
    } else {
      qaPairs = [
        { question: "What are symptoms of Dengue?", answer: "High fever, severe headache, muscle and joint pains.", category: "Infection" },
        { question: "What to do for chest pain?", answer: "Seek immediate emergency care, as it can be a heart attack.", category: "Emergency" }
      ];
    }
    
    medicalVectors = qaPairs.map(m => {
      const text = `${m.question} ${m.answer} ${m.category}`;
      return { ...m, vector: embed(text) };
    });

  } catch (err) {
    console.error('Vector store init error:', err.message);
  }
}

export async function searchMedical(query, topK = 3) {
  if (medicalVectors.length === 0) return [];
  const qVec = embed(query);
  const scored = medicalVectors.map(entry => ({
    ...entry,
    score: cosineSimilarity(qVec, entry.vector)
  }));
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, topK).filter(e => e.score > 0.05);
}

export async function searchHospitals(query, userLat = null, userLon = null) {
  if (!hospitalCache || hospitalCache.length === 0) return [];

  const qLower = query.toLowerCase();
  
  // 6. Emergency bypass
  const isEmergency = ['chest pain', 'stroke', 'breathing issue', 'heart attack', 'emergency', 'trauma'].some(kw => qLower.includes(kw));
  let filteredCandidates = [];

  if (isEmergency) {
     console.log('🚨 Emergency intent bypassing general semantic filtering...');
     filteredCandidates = hospitalCache.filter(h => {
        const s = (h.specialties || []).join(' ').toLowerCase();
        return s.includes('emergency') || s.includes('trauma') || s.includes('cardiology');
     });
     if (filteredCandidates.length === 0) filteredCandidates = hospitalCache;
  } else {
     // 1. Semantic Search
     const qVec = embed(query);
     let scored = hospitalCache.map(h => ({
         ...h,
         semanticScore: cosineSimilarity(qVec, h.vector)
     }));
     
     // Limit to top 100 semantically relevant
     scored.sort((a, b) => b.semanticScore - a.semanticScore);
     filteredCandidates = scored.slice(0, 100);
  }

  // 2. Distance filtering on the 100 candidates OR the bypassed arrays
  if (userLat && userLon) {
     filteredCandidates = filteredCandidates.map(h => {
         if (h.location && h.location.lat && h.location.lng) {
            h.distanceKm = haversineDistKm(parseFloat(userLat), parseFloat(userLon), h.location.lat, h.location.lng);
         } else {
            h.distanceKm = 999999;
         }
         return h;
     });
     
     // 3. Sort strictly Closest First 
     filteredCandidates.sort((a, b) => a.distanceKm - b.distanceKm);
  } else {
     // If user lacked GPS, fallback to just strongest semantic correlation
     filteredCandidates.sort((a, b) => (b.semanticScore || 0) - (a.semanticScore || 0));
  }

  // 4. Return Top 5 and securely strip the heavy mathematical vectors
  return filteredCandidates.slice(0, 5).map(h => {
     const { vector, location, ...cleanObj } = h;
     
     // Extract a clean city name from the address so the frontend explicitly renders it below the hospital
     const addrParts = (cleanObj.address || '').split(',');
     let extractedCity = addrParts.length >= 2 ? addrParts[addrParts.length - 2].trim() : (cleanObj.state || '');
     // Remove pincode noise if present
     extractedCity = extractedCity.replace(/\d{6}/, '').trim();

     return {
       ...cleanObj,
       city: extractedCity,
       lat: location?.lat || null,
       lon: location?.lng || null
     };
  });
}
