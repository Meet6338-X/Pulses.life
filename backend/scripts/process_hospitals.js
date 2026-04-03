import fs from 'fs';
import path from 'path';
import axios from 'axios';
import * as cheerio from 'cheerio';
import csv from 'csv-parser';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// The requested vocabulary for in-memory TF-IDF index
const VOCAB = [
  'fever', 'pain', 'headache', 'cough', 'cold', 'nausea', 'vomit', 'diarrhea',
  'rash', 'fatigue', 'tired', 'dizzy', 'weak', 'swelling', 'infection', 'diabetes',
  'hypertension', 'blood', 'pressure', 'heart', 'chest', 'breathing', 'lung', 'cancer',
  'kidney', 'liver', 'stomach', 'throat', 'skin', 'eye', 'ear', 'bone', 'joint',
  'muscle', 'nerve', 'brain', 'mental', 'anxiety', 'depression', 'allergies', 'asthma',
  'neurology', 'cardiology', 'orthopedic', 'pediatric', 'gynecology', 'oncology',
  'emergency', 'trauma', 'icu', 'dental', 'cghs', 'clinic', 'hospital'
];

// Embeds string into a fixed length vector purely in JavaScript
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

// Ensure coordinates are mathematically sound
function parseCoordinates(latStr, lngStr) {
  const lat = parseFloat(latStr);
  const lng = parseFloat(lngStr);
  if (!isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
    if (lat === 0 && lng === 0) return null;
    return { lat, lng };
  }
  return null;
}

const SOURCES = {
  aikosh_cghs: "https://aikosh.indiaai.gov.in/home/datasets/details/list_of_hospitals_empaneled_under_cghs_all_over_india.html"
};

async function getAIKoshDownloadURL(pageUrl) {
  try {
    const { data } = await axios.get(pageUrl, { headers: { 'User-Agent': 'Mozilla/5.0' }});
    const $ = cheerio.load(data);
    let downloadLink = null;
    $('a').each((i, el) => {
      const href = $(el).attr('href');
      if (href && (href.toLowerCase().endsWith('.csv') || href.includes('download'))) {
        downloadLink = href;
      }
    });
    if (downloadLink && !downloadLink.startsWith('http')) {
      const urlObj = new URL(pageUrl);
      downloadLink = `${urlObj.origin}${downloadLink}`;
    }
    return downloadLink;
  } catch (err) {
    console.error(`❌ AIKosh scraper blocked/failed:`, err.message);
    return null;
  }
}

async function ingestHospitalsFromURL(url) {
  console.log(`⬇️ Starting CSV Stream from ${url}...`);
  return new Promise(async (resolve, reject) => {
    try {
      const response = await axios({ method: 'get', url, responseType: 'stream' });
      const records = [];
      let idx = 0;

      response.data
        .pipe(csv())
        .on('data', (row) => {
          const name = row['Hospital Name'] || row['hospital_name'] || row['Name'] || Object.values(row)[0];
          const state = row['State'] || row['state_name'];
          const address = row['Address'] || row['address'] || '';
          const lat = row['Latitude'] || row['lat'] || row['Y'] || null;
          const lng = row['Longitude'] || row['long'] || row['lng'] || row['X'] || null;
          const specialties = (row['Specialties'] || row['facilities'] || '').split(',').map(s => s.trim()).filter(Boolean);
          
          if (!name) return;
          const location = parseCoordinates(lat, lng);
          if (!location) return;

          const textForVector = [name, state, address, ...specialties].join(' ');
          
          records.push({
            id: ++idx,
            name,
            address,
            state,
            specialties,
            location,
            vector: embed(textForVector)
          });
        })
        .on('end', () => resolve(records))
        .on('error', reject);
    } catch (e) {
      resolve([]); // Proceed cleanly with graceful fallback on fail
    }
  });
}

async function run() {
  console.log('🚀 Executing standalone Hospital Data processor...');
  let compiledHospitals = [];

  const cghsURL = await getAIKoshDownloadURL(SOURCES.aikosh_cghs);
  if (cghsURL) {
    compiledHospitals = await ingestHospitalsFromURL(cghsURL);
  }

  // Fallback Data chunk matching requested strict structured format if the gov network blocks scraping
  if (compiledHospitals.length === 0) {
    console.warn("⚠️ Utilizing local structured fallback dataset to ensure robust app survival...");
    const fallbacks = [
      { name: "AIIMS Trauma Center", state: "Delhi", address: "Ring Road, New Delhi", lat: 28.5672, lng: 77.2001, specs: ["trauma", "emergency", "surgery"] },
      { name: "Fortis Escorts Heart Institute", state: "Delhi", address: "Okhla, New Delhi", lat: 28.5583, lng: 77.2842, specs: ["cardiology", "emergency", "surgery"] },
      { name: "Apollo Hospitals", state: "Tamil Nadu", address: "Greams Road, Chennai", lat: 13.0645, lng: 80.2529, specs: ["cardiology", "neurology", "emergency"] },
      { name: "Tata Memorial Hospital", state: "Maharashtra", address: "Parel, Mumbai", lat: 19.0041, lng: 72.8415, specs: ["oncology", "surgery"] },
      { name: "Ruby Hall Clinic", state: "Maharashtra", address: "Pune", lat: 18.5262, lng: 73.8795, specs: ["cardiology", "general medicine", "emergency"] }
    ];

    compiledHospitals = fallbacks.map((f, i) => {
      const text = [f.name, f.state, f.address, ...f.specs].join(' ');
      return {
        id: i + 1,
        name: f.name,
        state: f.state,
        address: f.address,
        specialties: f.specs,
        location: { lat: f.lat, lng: f.lng },
        vector: embed(text)  // Immediate native embedding computation!
      };
    });
  }

  const cachePath = path.join(__dirname, '..', 'cache');
  if (!fs.existsSync(cachePath)) fs.mkdirSync(cachePath);
  
  const outFile = path.join(cachePath, 'processed_hospitals.json');
  fs.writeFileSync(outFile, JSON.stringify(compiledHospitals, null, 2));

  console.log(`✅ Super-Optimized Embedded cache generated with ${compiledHospitals.length} valid coordinates at: ${outFile}`);
  process.exit(0);
}

run();
