/**
 * DigiLocker API Routes — Pulses.life
 *
 * GET  /api/digilocker/login       → returns OAuth redirect URL
 * GET  /api/digilocker/callback    → exchanges auth code for token
 * GET  /api/digilocker/documents   → fetches & returns documents (requires token)
 * POST /api/emergency/auto-fill    → generates pre-filled admission form
 */

import express from 'express';
import {
  initiateDigiLockerLogin,
  handleCallback,
  fetchDocuments,
  extractPatientData,
  generateAdmissionForm,
} from '../modules/digilocker-form/digilocker.js';

const router = express.Router();

// ── GET /api/digilocker/login ─────────────────────────────────────────────────
// Returns the OAuth authorization URL for the frontend to redirect to.
router.get('/login', (req, res) => {
  try {
    const { authUrl, state } = initiateDigiLockerLogin();
    res.json({
      success: true,
      authUrl,
      state,
      message: 'Redirect user to authUrl to begin DigiLocker consent',
    });
  } catch (err) {
    console.error('[DigiLocker] login error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── GET /api/digilocker/callback ──────────────────────────────────────────────
// Called after user grants consent. Exchanges code → token, fetches documents,
// generates and returns the pre-filled admission form.
router.get('/callback', async (req, res) => {
  try {
    const { code, state, error: oauthError } = req.query;

    if (oauthError) {
      return res.status(400).json({
        success: false,
        error: `DigiLocker denied access: ${oauthError}`,
        fallback: true,
      });
    }

    // 1. Exchange code for token
    const tokenData = await handleCallback({ code, state });

    // 2. Fetch documents
    const documents = await fetchDocuments(tokenData.accessToken);

    // 3. Extract patient data
    const patientData = extractPatientData(documents);

    // 4. Generate pre-filled admission form
    const admissionForm = generateAdmissionForm(patientData);

    res.json({
      success:      true,
      source:       'digilocker',
      status:       'verified',
      patientData,
      admissionForm,
      documentsFound: patientData.documentsFound,
      message:      'Documents fetched and form pre-filled successfully',
    });

  } catch (err) {
    console.error('[DigiLocker] callback error:', err);
    res.status(500).json({
      success:  false,
      error:    err.message,
      fallback: true,
      message:  'DigiLocker fetch failed. Use fallback profile data.',
    });
  }
});

// ── GET /api/digilocker/demo ──────────────────────────────────────────────────
// Instantly returns a demo-filled form (no OAuth needed) — for hackathon demos.
router.get('/demo', async (req, res) => {
  try {
    const mockDocuments = await fetchDocuments('demo-token');
    const patientData   = extractPatientData(mockDocuments);
    const admissionForm = generateAdmissionForm(patientData, {
      contact:          '+91-9876543210',
      emergencyContact: '+91-9123456780',
      bloodGroup:       'O+',
      emergencyReason:  'Chest pain / possible cardiac event',
      emergencyType:    'cardiac',
      medicalHistory:   ['Hypertension', 'Type-2 Diabetes'],
      knownAllergies:   ['Penicillin'],
      currentMedications: ['Metformin 500mg', 'Amlodipine 5mg'],
    });

    res.json({
      success:      true,
      source:       'digilocker',
      status:       'verified',
      demo:         true,
      patientData,
      admissionForm,
      documentsFound: patientData.documentsFound,
    });
  } catch (err) {
    console.error('[DigiLocker] demo error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
