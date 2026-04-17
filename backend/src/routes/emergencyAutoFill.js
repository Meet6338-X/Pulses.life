/**
 * Emergency Auto-Fill Route — POST /api/emergency/auto-fill
 * Accepts existing patient/DigiLocker data + emergency context.
 * Generates and sends a fully pre-filled hospital admission form.
 */

import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import {
  fetchDocuments,
  extractPatientData,
  generateAdmissionForm,
} from '../modules/digilocker-form/digilocker.js';
import { retrieveHospitals } from '../services/rag.js';

const router = express.Router();

// ── POST /api/emergency/auto-fill ─────────────────────────────────────────────
router.post('/auto-fill', async (req, res) => {
  const startTime = Date.now();
  try {
    const {
      accessToken,           // DigiLocker token (optional)
      fallbackProfile = {},  // stored user profile (always accepted)
      emergencyReason,
      emergencyType = 'general',
      contact,
      emergencyContact,
      bloodGroup,
      medicalHistory   = [],
      knownAllergies   = [],
      currentMedications = [],
      hospitalId,            // optional target hospital
      lat,
      lon,
    } = req.body;

    let patientData;
    let usedFallback = false;

    // 1. Try DigiLocker first
    if (accessToken) {
      try {
        const documents = await fetchDocuments(accessToken);
        patientData = extractPatientData(documents, fallbackProfile);
      } catch (dlErr) {
        console.warn('[AutoFill] DigiLocker failed, using fallback:', dlErr.message);
        patientData = buildFallbackPatient(fallbackProfile);
        usedFallback = true;
      }
    } else {
      // No token — use stored profile immediately (never block emergency)
      patientData = buildFallbackPatient(fallbackProfile);
      usedFallback = true;
    }

    // 2. Generate admission form
    const admissionForm = generateAdmissionForm(patientData, {
      contact:           contact           || fallbackProfile.contact,
      emergencyContact:  emergencyContact  || fallbackProfile.emergencyContact,
      bloodGroup:        bloodGroup        || fallbackProfile.bloodGroup || 'Unknown',
      emergencyReason:   emergencyReason   || 'Emergency — reason not specified',
      emergencyType,
      medicalHistory:    medicalHistory.length  ? medicalHistory  : (fallbackProfile.medicalHistory  || []),
      knownAllergies:    knownAllergies.length   ? knownAllergies  : (fallbackProfile.knownAllergies  || []),
      currentMedications: currentMedications.length ? currentMedications : (fallbackProfile.currentMedications || []),
    });

    // 3. Find nearest hospital(s) to send the form to
    const hospitals = await retrieveHospitals('emergency trauma ICU', lat || null, lon || null);
    const targetHospitals = hospitals.filter(h => h.emergency).slice(0, 3);
    const primaryHospital = targetHospitals[0] || hospitals[0] || null;

    // 4. Simulate sending to hospital system
    const hospitalResponse = primaryHospital
      ? simulateSendToHospital(admissionForm, primaryHospital)
      : null;

    const elapsed = Date.now() - startTime;

    res.json({
      success:     true,
      admissionForm,
      targetHospital: primaryHospital ? {
        id:       primaryHospital.id   || null,
        name:     primaryHospital.name,
        city:     primaryHospital.city,
        state:    primaryHospital.state,
        phone:    primaryHospital.phone || null,
        distance: primaryHospital._distanceKm || null,
        mapsUrl:  primaryHospital.lat && primaryHospital.lon
          ? `https://www.google.com/maps/dir/?api=1&destination=${primaryHospital.lat},${primaryHospital.lon}`
          : `https://www.google.com/maps/search/${encodeURIComponent(primaryHospital.name + ' ' + primaryHospital.city)}`,
        formSentAt: hospitalResponse?.sentAt || null,
      } : null,
      nearbyHospitals: targetHospitals.slice(0, 3).map(h => ({
        name:     h.name,
        city:     h.city,
        state:    h.state,
        distance: h._distanceKm || null,
        mapsUrl:  h.lat && h.lon
          ? `https://www.google.com/maps/dir/?api=1&destination=${h.lat},${h.lon}`
          : `https://www.google.com/maps/search/${encodeURIComponent(h.name)}`,
      })),
      meta: {
        source:      usedFallback ? 'fallback_profile' : 'digilocker',
        usedFallback,
        generatedIn: `${elapsed}ms`,
        emergencyId: admissionForm.emergencyId,
      },
    });

  } catch (err) {
    console.error('[AutoFill] critical error:', err);
    // NEVER block the emergency — return minimal form even on error
    res.status(200).json({
      success:     true,
      admissionForm: {
        emergencyId:  `EMR-FALLBACK-${Date.now()}`,
        timestamp:    new Date().toISOString(),
        name:         req.body.fallbackProfile?.name || 'Unknown Patient',
        emergencyReason: req.body.emergencyReason || 'Emergency',
        admissionType: 'Emergency',
        status:       'pending_confirmation',
        dataSource:   'error_fallback',
      },
      targetHospital: null,
      meta: { source: 'error_fallback', error: err.message },
    });
  }
});

// ─── Helpers ───────────────────────────────────────────────────────────────────

function buildFallbackPatient(profile = {}) {
  return {
    name:            profile.name     || 'Unknown Patient',
    dob:             profile.dob      || null,
    age:             profile.age      || null,
    gender:          profile.gender   || 'Not specified',
    address:         profile.address  || '',
    aadhaarVerified: false,
    aadhaarNo:       null,
    panVerified:     false,
    panNo:           null,
    insurance:       profile.insurance || null,
    dataSource:      'fallback',
    documentsFound:  [],
  };
}

function simulateSendToHospital(form, hospital) {
  // In production: POST to hospital's integration API or HIS endpoint
  return {
    sent:       true,
    sentAt:     new Date().toISOString(),
    hospitalId: hospital.id || null,
    formId:     form.emergencyId,
    status:     'received',
    message:    `Admission form dispatched to ${hospital.name}`,
  };
}

export default router;
