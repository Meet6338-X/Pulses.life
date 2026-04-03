/**
 * Dataset Ingestion Script
 * Usage: node scripts/ingest_datasets.js
 *
 * Source files (place in backend/data/):
 *   - backend/data/cghs_hospitals.json
 *   - backend/data/hospital_directory.csv
 *
 * Output (loaded by the backend at runtime):
 *   - backend/src/data/hospitals.json
 */

import { createReadStream, readFileSync, writeFileSync, existsSync } from 'fs';
import { parse } from 'csv-parse';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
// Source raw data files live in backend/data/ (not committed, created manually)
const DATA_DIR = join(__dirname, '..', 'data');
// Output goes to src/data/ — the canonical location the backend reads at startup
const OUT_PATH = join(__dirname, '..', 'src', 'data', 'hospitals.json');

const FILES = {
  cghs: join(DATA_DIR, 'cghs_hospitals.json'),
  directory: join(DATA_DIR, 'hospital_directory.csv')
};

// Normalize CGHS JSON data
function processCGHS(data) {
  return data.map((h, i) => ({
    id: `CGHS_${i}`,
    name: h.DiagnosticCentreName || h.HospitalName || '',
    address: h.DiagnosticCentreAddress || h.Address || '',
    city: h.CityName || h.City || '',
    state: h.StateName || h.State || '',
    lat: null, // Default
    lon: null, // Default
    type: 'CGHS Empanelled',
    services: [], // Not explicitly available
    phone: '',
    emergency: true, // Assume mostly true for empanelled hospitals
    cghs: true
  })).filter(h => h.name);
}

// Normalize Directory CSV data
// Helper: treat CSV "0" as an empty/null value
function csvVal(val) {
  if (!val || val.trim() === '0' || val.trim() === '') return '';
  return val.trim();
}

function processDirectoryRow(row, i) {
  let lat = null, lon = null;
  if (row.Location_Coordinates) {
    const coords = row.Location_Coordinates.split(',');
    if (coords.length === 2) {
      lat = parseFloat(coords[0].trim());
      lon = parseFloat(coords[1].trim());
    }
  }

  const services = [];
  if (row.Specialties && row.Specialties !== '0') {
    services.push(...row.Specialties.split(',').map(s => s.trim()).filter(Boolean));
  }

  // City: prefer Town, fall back to District, skip if "0"
  const city = csvVal(row.Town) || csvVal(row.District) || '';

  // Phone: prefer Telephone, fall back to Mobile_Number, skip "0"
  const phone = csvVal(row.Telephone) || csvVal(row.Mobile_Number) || '';

  return {
    id: `DIR_${csvVal(row.Sr_No) || i}`,
    name: csvVal(row.Hospital_Name) || '',
    address: csvVal(row.Address_Original_First_Line) || '',
    city,
    state: csvVal(row.State) || '',
    lat: isNaN(lat) ? null : lat,
    lon: isNaN(lon) ? null : lon,
    type: csvVal(row.Hospital_Category) || 'Hospital',
    services,
    phone,
    emergency: row.Emergency_Services === 'Yes' || row.Emergency_Services === 'Y',
    cghs: row.Empanelment_or_Collaboration_with && row.Empanelment_or_Collaboration_with.toLowerCase().includes('cghs')
  };
}

async function parseCSV(filePath) {
  return new Promise((resolve, reject) => {
    const records = [];
    createReadStream(filePath)
      .pipe(parse({ columns: true, skip_empty_lines: true, trim: true }))
      .on('data', (row) => records.push(row))
      .on('end', () => resolve(records))
      .on('error', reject);
  });
}

async function main() {
  console.log('🚀 Starting Hospital Data Ingestion...\n');
  const allHospitals = [];

  // 1. Process CGHS JSON
  if (existsSync(FILES.cghs)) {
    console.log(`📂 Processing ${FILES.cghs}...`);
    try {
      const rawData = JSON.parse(readFileSync(FILES.cghs, 'utf8'));
      const processed = processCGHS(rawData);
      allHospitals.push(...processed);
      console.log(`   ✅ Ingested ${processed.length} CGHS hospitals.`);
    } catch (err) {
      console.error('   ❌ Error processing CGHS Data:', err.message);
    }
  } else {
    console.log(`⏭️  Skipping missing file: ${FILES.cghs}`);
  }

  // 2. Process Hospital Directory CSV
  if (existsSync(FILES.directory)) {
    console.log(`\n📂 Processing ${FILES.directory}...`);
    try {
      const records = await parseCSV(FILES.directory);
      const processed = records.map((row, i) => processDirectoryRow(row, i)).filter(h => h.name);
      allHospitals.push(...processed);
      console.log(`   ✅ Ingested ${processed.length} Directory hospitals.`);
    } catch (err) {
      console.error('   ❌ Error processing Directory CSV:', err.message);
    }
  } else {
    console.log(`⏭️  Skipping missing file: ${FILES.directory}`);
  }

  // 3. Deduplicate (Case-insensitive name + city matching)
  console.log('\n🧹 Deduplicating records...');
  const uniqueHospitals = [];
  const seenKeys = new Set();
  
  // Also filter out any that don't have a name
  const validHospitals = allHospitals.filter(h => h.name && h.name !== '0' && h.name.trim() !== '');

  for (const h of validHospitals) {
    const key = `${h.name.toLowerCase().trim()}_${h.city.toLowerCase().trim()}`;
    if (!seenKeys.has(key)) {
      seenKeys.add(key);
      uniqueHospitals.push(h);
    } else {
      // If we already have it, maybe update coordinates if previous was missing
      const existing = uniqueHospitals.find(eh => `${eh.name.toLowerCase().trim()}_${eh.city.toLowerCase().trim()}` === key);
      if (existing && !existing.lat && h.lat) {
         existing.lat = h.lat;
         existing.lon = h.lon;
         if(h.cghs) existing.cghs = true; // merge cghs status
      }
    }
  }

  console.log(`   Removed ${validHospitals.length - uniqueHospitals.length} duplicates.`);

  // 4. Save
  try {
    writeFileSync(OUT_PATH, JSON.stringify(uniqueHospitals, null, 2));
    console.log(`\n🎉 Success! Saved ${uniqueHospitals.length} unique hospitals to ${OUT_PATH}`);
  } catch(err) {
    console.error('\n❌ Failed to write output file:', err.message);
  }
}

main().catch(console.error);
