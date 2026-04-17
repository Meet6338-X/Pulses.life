/**
 * DigiLocker Integration Module — Pulses.life
 * Handles OAuth login, document fetching, data extraction, and admission form generation.
 *
 * NOTE: DigiLocker uses OAuth 2.0 + PKCE. For a hackathon / demo environment
 * we simulate the token exchange and document fetch so the UI flow works end-to-end
 * without a registered production app. Replace the SIMULATED sections with real
 * DigiLocker API calls once you have production credentials.
 */

import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';

// ─── Config ───────────────────────────────────────────────────────────────────

const DIGILOCKER_BASE = 'https://digilocker.meripehchaan.gov.in';
const CLIENT_ID       = process.env.DIGILOCKER_CLIENT_ID  || 'DEMO_CLIENT_ID';
const CLIENT_SECRET   = process.env.DIGILOCKER_CLIENT_SECRET || 'DEMO_CLIENT_SECRET';
const REDIRECT_URI    = process.env.DIGILOCKER_REDIRECT_URI  || 'http://localhost:5002/api/digilocker/callback';

// In-memory state store (replace with Redis/DB in production)
const stateStore = new Map(); // state -> { codeVerifier, createdAt }

// ─── PKCE helpers ─────────────────────────────────────────────────────────────

function generateCodeVerifier() {
  return crypto.randomBytes(32).toString('base64url');
}

function generateCodeChallenge(verifier) {
  return crypto.createHash('sha256').update(verifier).digest('base64url');
}

// ─── 1. Initiate DigiLocker Login ─────────────────────────────────────────────

/**
 * Returns the DigiLocker OAuth URL the frontend should redirect to.
 * Stores PKCE state server-side so callback can verify it.
 */
export function initiateDigiLockerLogin() {
  const state         = uuidv4();
  const codeVerifier  = generateCodeVerifier();
  const codeChallenge = generateCodeChallenge(codeVerifier);

  // Persist state → verifier (expires after 5 min)
  stateStore.set(state, { codeVerifier, createdAt: Date.now() });

  const params = new URLSearchParams({
    response_type:          'code',
    client_id:              CLIENT_ID,
    redirect_uri:           REDIRECT_URI,
    state,
    code_challenge:         codeChallenge,
    code_challenge_method:  'S256',
    scope:                  'openid profile aadhaar_number',
  });

  const authUrl = `${DIGILOCKER_BASE}/public/oauth2/1/authorize?${params.toString()}`;
  return { authUrl, state };
}

// ─── 2. Handle OAuth Callback ──────────────────────────────────────────────────

/**
 * Exchange the auth code for an access token.
 * Returns { accessToken, tokenType, expiresIn, user }
 */
export async function handleCallback({ code, state }) {
  if (!code || !state) throw new Error('Missing code or state parameter');

  const stateData = stateStore.get(state);
  if (!stateData) throw new Error('Invalid or expired OAuth state');

  // Clean up used state
  stateStore.delete(state);

  // Check expiry (5 minutes)
  if (Date.now() - stateData.createdAt > 5 * 60 * 1000) {
    throw new Error('OAuth state expired. Please try again.');
  }

  // ── DEMO MODE: simulate token response ───────────────────────────────────
  // In production: POST to DIGILOCKER_BASE/public/oauth2/1/token with
  // { grant_type:'authorization_code', code, redirect_uri, client_id,
  //   client_secret, code_verifier: stateData.codeVerifier }
  const mockToken = {
    accessToken: `mock_access_${uuidv4()}`,
    tokenType:   'Bearer',
    expiresIn:   3600,
    userId:      `digilocker_${uuidv4().slice(0, 8)}`,
  };
  // ── END DEMO MODE ─────────────────────────────────────────────────────────

  return mockToken;
}

// ─── 3. Fetch Documents ────────────────────────────────────────────────────────

/**
 * Fetch a list of issued documents from DigiLocker for the authenticated user.
 * Returns normalized document objects.
 */
export async function fetchDocuments(accessToken) {
  // ── DEMO MODE: return realistic mock documents ───────────────────────────
  // In production: GET https://digilocker.meripehchaan.gov.in/public/oauth2/2/files/issued
  // with Authorization: Bearer <accessToken>
  const mockDocuments = {
    issued: [
      {
        type:          'ADHAR',
        name:          'Aadhaar Card',
        doctype:       'in.gov.uidai.aadhaar',
        issuer:        'UIDAI',
        issuerName:    'Unique Identification Authority of India',
        date:          '2018-06-15',
        validUpto:     null,
        uri:           'in.gov.uidai.aadhaar-XXXX-XXXX-8901',
        data: {
          name:        'Arjun Sharma',
          dob:         '1995-03-22',
          gender:      'M',
          address:     '42, MG Road, Koramangala, Bengaluru, Karnataka - 560034',
          aadhaarNo:   'XXXX XXXX 8901',
          verified:    true,
        },
      },
      {
        type:          'PANCR',
        name:          'PAN Card',
        doctype:       'in.gov.cbdt.pan',
        issuer:        'INCOME TAX DEPARTMENT',
        issuerName:    'Income Tax Department, Government of India',
        date:          '2016-09-10',
        uri:           'in.gov.cbdt.pan-CTZAS1234D',
        data: {
          name:        'ARJUN SHARMA',
          fatherName:  'RAJESH SHARMA',
          dob:         '1995-03-22',
          panNo:       'CTZAS1234D',
          verified:    true,
        },
      },
      {
        type:          'HLTHINS',
        name:          'Health Insurance Policy',
        issuer:        'Star Health Insurance',
        issuerName:    'Star Health and Allied Insurance Co. Ltd',
        date:          '2024-04-01',
        validUpto:     '2025-03-31',
        uri:           'starhealth-policy-SH2024-78432',
        data: {
          policyNo:     'SH-2024-78432',
          holderName:   'Arjun Sharma',
          sumInsured:   500000,
          insurer:      'Star Health Insurance',
          expiryDate:   '2025-03-31',
          networkHosp:  true,
          claimContact: '1800-425-2255',
          verified:     true,
        },
      },
    ],
  };

  return mockDocuments;
  // ── END DEMO MODE ─────────────────────────────────────────────────────────
}

// ─── 4. Extract Patient Data ───────────────────────────────────────────────────

/**
 * Extract structured patient information from raw DigiLocker documents.
 * Falls back to profile data for missing fields.
 */
export function extractPatientData(documents, fallbackProfile = {}) {
  const aadhaar  = documents.issued?.find(d => d.type === 'ADHAR');
  const pan      = documents.issued?.find(d => d.type === 'PANCR');
  const health   = documents.issued?.find(d => d.type === 'HLTHINS');

  const aadhaarData  = aadhaar?.data  || {};
  const panData      = pan?.data      || {};
  const insuranceData = health?.data  || {};

  // Calculate age from DOB
  const dob  = aadhaarData.dob || panData.dob || fallbackProfile.dob || null;
  const age  = dob ? calculateAge(dob) : (fallbackProfile.age || null);

  // Normalize gender
  const rawGender = aadhaarData.gender || fallbackProfile.gender || '';
  const gender    = normalizeGender(rawGender);

  return {
    // Identity
    name:           aadhaarData.name || panData.name || fallbackProfile.name || 'Unknown',
    dob,
    age,
    gender,
    address:        aadhaarData.address || fallbackProfile.address || '',

    // Verified document flags
    aadhaarVerified: aadhaarData.verified === true,
    aadhaarNo:       aadhaarData.aadhaarNo || null,
    panVerified:     panData.verified === true,
    panNo:           panData.panNo || null,

    // Insurance
    insurance: health ? {
      policyNo:     insuranceData.policyNo    || null,
      insurer:      insuranceData.insurer     || null,
      sumInsured:   insuranceData.sumInsured  || null,
      expiryDate:   insuranceData.expiryDate  || null,
      networkHosp:  insuranceData.networkHosp || false,
      claimContact: insuranceData.claimContact || null,
      verified:     insuranceData.verified    === true,
      source:       'digilocker',
      status:       'verified',
    } : (fallbackProfile.insurance || null),

    // Source tracking
    dataSource: aadhaar ? 'digilocker' : 'fallback',
    documentsFound: documents.issued?.map(d => ({ type: d.type, name: d.name, issuer: d.issuerName })) || [],
  };
}

// ─── 5. Generate Admission Form ────────────────────────────────────────────────

/**
 * Build the hospital-ready admission form JSON.
 */
export function generateAdmissionForm(patientData, extraData = {}) {
  const emergencyId = `EMR-${Date.now()}-${Math.floor(Math.random() * 9000 + 1000)}`;

  return {
    // Meta
    patientId:         `PAT-${uuidv4().slice(0, 8).toUpperCase()}`,
    emergencyId,
    timestamp:         new Date().toISOString(),

    // Patient identity
    name:              patientData.name,
    age:               patientData.age,
    dob:               patientData.dob,
    gender:            patientData.gender,
    address:           patientData.address,

    // Contact
    contact:           extraData.contact           || patientData.contact           || null,
    emergencyContact:  extraData.emergencyContact  || patientData.emergencyContact  || null,
    bloodGroup:        extraData.bloodGroup        || patientData.bloodGroup        || 'Unknown',

    // Verification
    aadhaarVerified:   patientData.aadhaarVerified,
    aadhaarNo:         patientData.aadhaarNo,
    panVerified:       patientData.panVerified,

    // Insurance
    insurance:         patientData.insurance,

    // Medical history
    medicalHistory:    extraData.medicalHistory    || patientData.medicalHistory    || [],
    knownAllergies:    extraData.knownAllergies    || patientData.knownAllergies    || [],
    currentMedications: extraData.currentMedications || patientData.currentMedications || [],

    // Emergency info
    emergencyReason:   extraData.emergencyReason   || 'Not specified',
    emergencyType:     extraData.emergencyType     || 'general',
    admissionType:     'Emergency',

    // Data provenance
    dataSource:        patientData.dataSource,
    documentsFound:    patientData.documentsFound,
    formGenerated:     'auto',
    status:            'pending_confirmation',
  };
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

function calculateAge(dob) {
  try {
    const birth = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return age;
  } catch {
    return null;
  }
}

function normalizeGender(raw) {
  const g = (raw || '').toString().trim().toUpperCase();
  if (g === 'M' || g === 'MALE')   return 'Male';
  if (g === 'F' || g === 'FEMALE') return 'Female';
  if (g === 'T' || g === 'TRANS')  return 'Transgender';
  return raw || 'Not specified';
}
