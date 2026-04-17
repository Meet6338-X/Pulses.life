'use client';

export default function EmergencyAlert({ severity, hospitals = [], onDismiss, onDigiLocker }) {
  return (
    <div className="emergency-alert" role="alert" aria-live="assertive">
      <div className="emergency-header">
        <span className="emergency-icon">🚨</span>
        <span className="emergency-title">
          {severity === 'critical' ? 'CRITICAL EMERGENCY DETECTED' : 'EMERGENCY SITUATION'}
        </span>
      </div>

      <div className="emergency-numbers">
        <div className="emergency-number-card">
          <div className="emergency-number-label">AMBULANCE</div>
          <div className="emergency-number-value">108</div>
        </div>
        <div className="emergency-number-card">
          <div className="emergency-number-label">POLICE</div>
          <div className="emergency-number-value">100</div>
        </div>
        <div className="emergency-number-card">
          <div className="emergency-number-label">WOMEN HELPLINE</div>
          <div className="emergency-number-value">181</div>
        </div>
      </div>

      <p className="emergency-message">
        {severity === 'critical'
          ? '⚠️ Call 108 immediately. Stay calm, do not move the patient unnecessarily. Stay on the line with the dispatcher until help arrives.'
          : '⚠️ Please call 108 or go to the nearest emergency room. Your safety is the priority.'}
      </p>

      {hospitals.length > 0 && (
        <div style={{ marginTop: 12 }}>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.7px', marginBottom: 8 }}>
            Nearest Emergency Hospital
          </div>
          <div style={{
            background: 'rgba(244, 63, 94, 0.08)',
            border: '1px solid rgba(244, 63, 94, 0.2)',
            borderRadius: 10,
            padding: '12px 14px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 12,
            flexWrap: 'wrap'
          }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>{hospitals[0].name}</div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
                📍 {hospitals[0].city}, {hospitals[0].state}
                {hospitals[0]._distanceKm != null && ` · ${hospitals[0]._distanceKm} km away`}
              </div>
            </div>
            {hospitals[0].mapsUrl && (
              <a
                href={hospitals[0].mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="directions-btn"
                style={{ background: 'var(--gradient-rose)' }}
              >
                🗺️ Navigate Now
              </a>
            )}
          </div>
        </div>
      )}

      {/* DigiLocker auto-fill CTA */}
      {onDigiLocker && (
        <button
          id="emergency-digilocker-btn"
          className="digilocker-emergency-btn"
          onClick={onDigiLocker}
        >
          🪪 Auto-Fill Hospital Admission Form via DigiLocker
        </button>
      )}

      <button
        onClick={onDismiss}
        style={{
          marginTop: 10,
          background: 'none',
          border: '1px solid rgba(244, 63, 94, 0.3)',
          color: 'var(--text-muted)',
          fontSize: 12,
          padding: '6px 14px',
          borderRadius: 'var(--radius-full)',
          cursor: 'pointer',
          fontFamily: 'inherit',
          transition: 'var(--transition)'
        }}
      >
        Dismiss Alert
      </button>
    </div>
  );
}

