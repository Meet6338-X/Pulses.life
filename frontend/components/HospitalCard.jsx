'use client';

export default function HospitalCard({ hospital }) {
  const {
    name, address, city, state, type,
    services = [], phone, emergency, cghs,
    _distanceKm, mapsUrl
  } = hospital;

  return (
    <div className="hospital-card">
      <div className="hospital-header">
        <div className="hospital-name">{name}</div>
        <div className="hospital-badges">
          {emergency && <span className="badge emergency">🚑 Emergency</span>}
          {cghs && <span className="badge cghs">CGHS</span>}
        </div>
      </div>

      {mapsUrl ? (
        <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className="hospital-location" style={{ textDecoration: 'none' }}>
          <span>📍</span>
          <span style={{ textDecoration: 'underline' }}>{city}, {state}</span>
          {_distanceKm != null && (
            <span className="hospital-distance">{_distanceKm} km</span>
          )}
        </a>
      ) : (
        <div className="hospital-location">
          <span>📍</span>
          <span>{city}, {state}</span>
          {_distanceKm != null && (
            <span className="hospital-distance">{_distanceKm} km</span>
          )}
        </div>
      )}

      {services.length > 0 && (
        <div className="hospital-services">
          {services.slice(0, 5).map((s) => (
            <span key={s} className="service-chip">{s}</span>
          ))}
          {services.length > 5 && (
            <span className="service-chip">+{services.length - 5} more</span>
          )}
        </div>
      )}

      <div className="hospital-footer">
        <div className="hospital-phone">
          {phone ? <><span>📞</span><span>{phone}</span></> : <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>{type}</span>}
        </div>
        {mapsUrl && (
          <a
            href={mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="directions-btn"
            id={`directions-${hospital.id}`}
          >
            🗺️ Get Directions
          </a>
        )}
      </div>
    </div>
  );
}
