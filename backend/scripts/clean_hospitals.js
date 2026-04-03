/**
 * One-time cleanup script for src/data/hospitals.json
 * Strips CSV null-sentinel "0" values from city, state, phone, address fields
 * Removes hospitals with no usable name
 * Re-deduplicates on (name + city) key
 *
 * Usage: node scripts/clean_hospitals.js
 */
import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const HOSPITALS_PATH = join(__dirname, '..', 'src', 'data', 'hospitals.json');

function clean(val) {
  if (!val) return '';
  const s = String(val).trim();
  if (s === '0' || s === '') return '';
  return s;
}

console.log('🧹 Loading hospitals.json...');
const raw = JSON.parse(readFileSync(HOSPITALS_PATH, 'utf8'));
console.log(`   Loaded ${raw.length} records.`);

// 1. Clean each record
const cleaned = raw
  .map(h => ({
    ...h,
    name:    clean(h.name),
    address: clean(h.address),
    city:    clean(h.city),
    state:   clean(h.state),
    phone:   clean(h.phone),
    type:    clean(h.type) || 'Hospital',
    services: (h.services || []).filter(s => clean(s) && clean(s) !== '0'),
  }))
  .filter(h => h.name); // drop nameless entries

console.log(`   After name-filter: ${cleaned.length} records.`);

// 2. Re-deduplicate on (name.lower + city.lower)
const seen = new Set();
const deduped = [];
for (const h of cleaned) {
  const key = `${h.name.toLowerCase()}_${h.city.toLowerCase()}`;
  if (!seen.has(key)) {
    seen.add(key);
    deduped.push(h);
  } else {
    // If the existing entry has no coords but this one does, merge coords
    const existing = deduped.find(
      e => `${e.name.toLowerCase()}_${e.city.toLowerCase()}` === key
    );
    if (existing && !existing.lat && h.lat) {
      existing.lat = h.lat;
      existing.lon = h.lon;
    }
    if (existing && !existing.state && h.state) existing.state = h.state;
    if (existing && !existing.phone && h.phone) existing.phone = h.phone;
    if (existing && h.cghs) existing.cghs = true;
  }
}

console.log(`   After dedup: ${deduped.length} unique hospitals (removed ${cleaned.length - deduped.length} dupes).`);

// 3. Write back
writeFileSync(HOSPITALS_PATH, JSON.stringify(deduped, null, 2));
console.log(`✅ Saved clean data to ${HOSPITALS_PATH}`);
