'use client';

import { useState, useCallback } from 'react';
import { fetchDigiLockerDemo, autoFillEmergencyForm } from '../lib/api';

// ─── Sub-components ──────────────────────────────────────────────────────────

function Pill({ color, children }) {
  return (
    <span className={`digilocker-pill ${color}`}>
      {children}
    </span>
  );
}

function FieldRow({ label, value, verified, icon }) {
  if (!value && value !== 0) return null;
  return (
    <div className="digilocker-field-row">
      <div className="digilocker-field-label">
        {icon && <span>{icon}</span>}{label}
        {verified && <span className="digilocker-verified">✓ Verified</span>}
      </div>
      <div className="digilocker-field-value">{value}</div>
    </div>
  );
}

function Section({ title, icon, children }) {
  return (
    <div className="digilocker-section">
      <div className="digilocker-section-title">
        <span>{icon}</span>{title}
      </div>
      {children}
    </div>
  );
}

// ─── States ───────────────────────────────────────────────────────────────────

const STEPS = { IDLE: 'idle', LOADING: 'loading', FORM: 'form', SENDING: 'sending', DONE: 'done', ERROR: 'error' };

// ─── Main Component ───────────────────────────────────────────────────────────

export default function DigiLockerModal({ onClose, location }) {
  const [step, setStep]         = useState(STEPS.IDLE);
  const [formData, setFormData] = useState(null);
  const [hospital, setHospital] = useState(null);
  const [error, setError]       = useState(null);
  const [sent, setSent]         = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editValues, setEditValues] = useState({});

  // ── Fetch demo data (simulates DigiLocker OAuth flow) ──────────────────────
  const handleDigiLockerFetch = useCallback(async () => {
    setStep(STEPS.LOADING);
    setError(null);
    try {
      const result = await fetchDigiLockerDemo();
      setFormData(result.admissionForm);
      setHospital(null);
      setEditValues({
        contact:          '',
        emergencyContact: '',
        bloodGroup:       result.admissionForm.bloodGroup || '',
        emergencyReason:  result.admissionForm.emergencyReason || '',
        medicalHistory:   (result.admissionForm.medicalHistory || []).join(', '),
        knownAllergies:   (result.admissionForm.knownAllergies || []).join(', '),
      });
      setStep(STEPS.FORM);
    } catch (err) {
      setError(err.message);
      setStep(STEPS.ERROR);
    }
  }, []);

  // ── Send form to hospital ──────────────────────────────────────────────────
  const handleSendToHospital = useCallback(async () => {
    if (!formData) return;
    setStep(STEPS.SENDING);
    try {
      const result = await autoFillEmergencyForm({
        fallbackProfile: {
          name:    formData.name,
          age:     formData.age,
          gender:  formData.gender,
          address: formData.address,
        },
        contact:            editValues.contact          || formData.contact,
        emergencyContact:   editValues.emergencyContact || formData.emergencyContact,
        bloodGroup:         editValues.bloodGroup       || formData.bloodGroup,
        emergencyReason:    editValues.emergencyReason  || formData.emergencyReason,
        emergencyType:      formData.emergencyType,
        medicalHistory:     editValues.medicalHistory
          ? editValues.medicalHistory.split(',').map(s => s.trim()).filter(Boolean)
          : formData.medicalHistory,
        knownAllergies:     editValues.knownAllergies
          ? editValues.knownAllergies.split(',').map(s => s.trim()).filter(Boolean)
          : formData.knownAllergies,
        lat: location?.lat,
        lon: location?.lon,
      });
      setFormData(result.admissionForm);
      setHospital(result.targetHospital);
      setSent(true);
      setStep(STEPS.DONE);
    } catch (err) {
      setError(err.message);
      setStep(STEPS.ERROR);
    }
  }, [formData, editValues, location]);

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <div
      id="digilocker-modal-overlay"
      className="digilocker-modal-overlay"
      onClick={(e) => e.target === e.currentTarget && onClose?.()}
    >
      <div className="digilocker-modal-content">

        {/* ── Header ── */}
        <div className="digilocker-modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div className="digilocker-logo-icon">🪪</div>
            <div className="digilocker-header-text">
              <div className="digilocker-title">
                DigiLocker Auto-Fill
              </div>
              <div className="digilocker-subtitle">
                Hospital Admission Form · Government Verified
              </div>
            </div>
          </div>
          <button
            id="digilocker-modal-close"
            className="digilocker-close-btn"
            onClick={onClose}
          >✕</button>
        </div>

        <div className="digilocker-modal-body">

          {/* ── IDLE ── */}
          {step === STEPS.IDLE && (
            <div style={{ textAlign: 'center', padding: '24px 0' }}>
              <div style={{
                width: 80, height: 80, borderRadius: 20, margin: '0 auto 20px',
                background: 'linear-gradient(135deg, var(--accent-secondary-light), rgba(139,92,246,0.2))',
                border: '2px solid rgba(139,92,246,0.3)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36,
              }}>🏛️</div>
              <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 8px' }}>
                Auto-Fill via DigiLocker
              </h2>
              <p style={{ fontSize: 14, color: 'var(--text-secondary)', margin: '0 0 24px', lineHeight: 1.6 }}>
                Login with DigiLocker to instantly pre-fill your hospital admission form
                using your Aadhaar, PAN, and health insurance documents — no typing needed.
              </p>

              <div style={{
                background: 'var(--accent-secondary-light)', border: '1px solid rgba(2, 132, 199, 0.3)',
                borderRadius: 12, padding: '12px 16px', marginBottom: 20, textAlign: 'left',
              }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--accent-secondary)', marginBottom: 8 }}>
                  📋 WHAT WILL BE FETCHED
                </div>
                {['✅ Aadhaar — Name, DOB, Gender, Address', '✅ PAN — Identity verification', '✅ Health Insurance — Policy, coverage, network hospitals'].map(t => (
                  <div key={t} style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 4 }}>{t}</div>
                ))}
              </div>

              <button
                id="digilocker-fetch-btn"
                onClick={handleDigiLockerFetch}
                style={{
                  width: '100%', padding: '14px 20px',
                  background: 'linear-gradient(135deg, var(--accent-secondary), rgba(139,92,246,1))',
                  border: 'none', borderRadius: 12, cursor: 'pointer',
                  fontSize: 15, fontWeight: 700, color: '#fff',
                  boxShadow: '0 8px 24px rgba(5, 150, 105, 0.4)',
                  transition: 'transform 0.15s, box-shadow 0.15s',
                }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 12px 32px rgba(5, 150, 105, 0.5)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '0 8px 24px rgba(5, 150, 105, 0.4)'; }}
              >
                🪪 Login with DigiLocker & Auto-Fill
              </button>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 10 }}>
                Secured by Government of India · Data used only for this form
              </div>
            </div>
          )}

          {/* ── LOADING ── */}
          {step === STEPS.LOADING && (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <div className="digilocker-loading-spinner" />
              <div className="digilocker-loading-text">
                Connecting to DigiLocker…
              </div>
              {['🔐 Authenticating with DigiLocker', '📄 Fetching your documents', '🧠 Extracting patient data', '📋 Pre-filling admission form'].map((t, i) => (
                <div key={t} className="digilocker-loading-item" style={{ animationDelay: `${i * 0.3}s` }}>{t}</div>
              ))}
            </div>
          )}

          {/* ── FORM ── */}
          {step === STEPS.FORM && formData && (
            <>
              {/* Status bar */}
              <div className="digilocker-status-bar">
                <div className="digilocker-pill-group">
                  <Pill color="green">✓ DigiLocker Verified</Pill>
                  {formData.aadhaarVerified && <Pill color="blue">✓ Aadhaar</Pill>}
                  {formData.panVerified     && <Pill color="violet">✓ PAN</Pill>}
                  {formData.insurance       && <Pill color="amber">✓ Insurance</Pill>}
                </div>
                <button
                  className={`digilocker-edit-btn ${editMode ? 'active' : ''}`}
                  onClick={() => setEditMode(e => !e)}
                >
                  {editMode ? '✓ Done Editing' : '✏️ Edit'}
                </button>
              </div>

              {/* Emergency ID */}
              <div className="digilocker-emergency-id">
                <span style={{ fontSize: 18 }}>🚨</span>
                <div>
                  <div className="digilocker-emergency-label">EMERGENCY ID</div>
                  <div className="digilocker-emergency-value">{formData.emergencyId}</div>
                </div>
              </div>

              {/* Identity */}
              <Section title="Patient Identity" icon="👤">
                <FieldRow label="Full Name"   value={formData.name}   verified={formData.aadhaarVerified} icon="👤" />
                <FieldRow label="Age"         value={formData.age ? `${formData.age} years` : null} icon="🎂" />
                <FieldRow label="Date of Birth" value={formData.dob}  icon="📅" />
                <FieldRow label="Gender"      value={formData.gender} icon="⚧" />
                <FieldRow label="Address"     value={formData.address} icon="📍" />
              </Section>

              {/* Editable fields */}
              <Section title="Contact & Medical" icon="📞">
                {editMode ? (
                  <div className="digilocker-form-section">
                    {[
                      { key: 'contact',          label: 'Patient Contact',    placeholder: '+91-XXXXXXXXXX' },
                      { key: 'emergencyContact', label: 'Emergency Contact',  placeholder: '+91-XXXXXXXXXX' },
                      { key: 'bloodGroup',       label: 'Blood Group',        placeholder: 'e.g. O+, A-, B+' },
                      { key: 'emergencyReason',  label: 'Emergency Reason',   placeholder: 'Describe the emergency…' },
                      { key: 'medicalHistory',   label: 'Medical History',    placeholder: 'Diabetes, Hypertension (comma separated)' },
                      { key: 'knownAllergies',   label: 'Known Allergies',    placeholder: 'Penicillin, Sulfa (comma separated)' },
                    ].map(f => (
                      <div key={f.key}>
                        <div className="digilocker-form-label">{f.label}</div>
                        <input
                          id={`edit-${f.key}`}
                          className="digilocker-input"
                          value={editValues[f.key] || ''}
                          onChange={e => setEditValues(v => ({ ...v, [f.key]: e.target.value }))}
                          placeholder={f.placeholder}
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  <>
                    <FieldRow label="Contact"          value={editValues.contact || formData.contact || '—'} icon="📞" />
                    <FieldRow label="Emergency Contact" value={editValues.emergencyContact || formData.emergencyContact || '—'} icon="🆘" />
                    <FieldRow label="Blood Group"      value={editValues.bloodGroup || formData.bloodGroup} icon="🩸" />
                    <FieldRow label="Emergency Reason" value={editValues.emergencyReason || formData.emergencyReason} icon="🚨" />
                    <FieldRow label="Medical History"  value={
                      editValues.medicalHistory
                        || (formData.medicalHistory?.length ? formData.medicalHistory.join(', ') : '—')
                    } icon="📋" />
                    <FieldRow label="Known Allergies"  value={
                      editValues.knownAllergies
                        || (formData.knownAllergies?.length ? formData.knownAllergies.join(', ') : '—')
                    } icon="⚠️" />
                  </>
                )}
              </Section>

              {/* Insurance */}
              {formData.insurance && (
                <Section title="Insurance" icon="🛡️">
                  <FieldRow label="Insurer"     value={formData.insurance.insurer}   verified={formData.insurance.verified} icon="🏢" />
                  <FieldRow label="Policy No."  value={formData.insurance.policyNo}  icon="📄" />
                  <FieldRow label="Sum Insured" value={formData.insurance.sumInsured ? `₹${formData.insurance.sumInsured.toLocaleString('en-IN')}` : null} icon="💰" />
                  <FieldRow label="Valid Until" value={formData.insurance.expiryDate} icon="📅" />
                  <FieldRow label="Claim Line"  value={formData.insurance.claimContact} icon="📞" />
                </Section>
              )}

              {/* Documents found */}
              {formData.documentsFound?.length > 0 && (
                <div className="digilocker-documents">
                  {formData.documentsFound.map(d => (
                    <div key={d.type} className="digilocker-document-badge">
                      ✓ {d.name}
                    </div>
                  ))}
                </div>
              )}

              {/* CTA */}
              <button
                id="digilocker-send-hospital-btn"
                className="digilocker-cta-btn"
                onClick={handleSendToHospital}
              >
                🏥 Confirm & Send to Hospital
              </button>
              <div className="digilocker-info-text">
                Form will be sent to the nearest emergency hospital automatically
              </div>
            </>
          )}

          {/* ── SENDING ── */}
          {step === STEPS.SENDING && (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <div style={{
                width: 64, height: 64, borderRadius: '50%', margin: '0 auto 20px',
                border: '3px solid var(--accent-danger-border)',
                borderTop: '3px solid var(--accent-danger)',
                animation: 'spin 0.9s linear infinite',
              }} />
              <div className="digilocker-loading-text">
                Dispatching form to hospital…
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Locating nearest emergency facility…</div>
            </div>
          )}

          {/* ── DONE ── */}
          {step === STEPS.DONE && formData && (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <div style={{
                width: 72, height: 72, borderRadius: '50%', margin: '0 auto 16px',
                background: 'rgba(34,197,94,0.15)', border: '2px solid rgba(34,197,94,0.4)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32,
                animation: 'popIn 0.4s cubic-bezier(0.34,1.56,0.64,1)',
              }}>✅</div>
              <h2 style={{ fontSize: 20, fontWeight: 700, color: '#4ade80', margin: '0 0 6px' }}>
                Form Sent Successfully
              </h2>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 20 }}>
                Your admission form has been dispatched to the hospital
              </div>

              {/* Emergency ID */}
              <div className="digilocker-success-card">
                <div className="digilocker-success-label">EMERGENCY ID</div>
                <div className="digilocker-success-value">{formData.emergencyId}</div>
                <div className="digilocker-success-note">Show this ID at the hospital reception</div>
              </div>

              {/* Hospital info */}
              {hospital && (
                <div className="digilocker-hospital-card">
                  <div className="digilocker-hospital-label">FORM SENT TO</div>
                  <div className="digilocker-hospital-name">{hospital.name}</div>
                  <div className="digilocker-hospital-location">
                    📍 {hospital.city}, {hospital.state}
                    {hospital.distance && ` · ${hospital.distance} km away`}
                  </div>
                  {hospital.mapsUrl && (
                    <a
                      href={hospital.mapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="digilocker-directions-btn"
                    >
                      🗺️ Get Directions
                    </a>
                  )}
                </div>
              )}

              <button
                className="digilocker-close-modal-btn"
                onClick={onClose}
              >Close</button>
            </div>
          )}

          {/* ── ERROR ── */}
          {step === STEPS.ERROR && (
            <div style={{ textAlign: 'center', padding: '32px 0' }}>
              <div className="digilocker-error-icon">⚠️</div>
              <div className="digilocker-error-title">Connection Failed</div>
              <div className="digilocker-error-message">{error || 'Could not reach DigiLocker'}</div>
              <button
                className="digilocker-try-again-btn"
                onClick={() => setStep(STEPS.IDLE)}
              >Try Again</button>
              <button
                className="digilocker-dismiss-btn"
                onClick={onClose}
              >Dismiss</button>
            </div>
          )}

        </div>
      </div>

      <style>{`
        @keyframes fadeIn  { from { opacity: 0 } to { opacity: 1 } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(30px) scale(0.97) } to { opacity: 1; transform: translateY(0) scale(1) } }
        @keyframes popIn   { from { transform: scale(0.5); opacity: 0 } to { transform: scale(1); opacity: 1 } }
        @keyframes spin    { to { transform: rotate(360deg) } }
      `}</style>
    </div>
  );
}
