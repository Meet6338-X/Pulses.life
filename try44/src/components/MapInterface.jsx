import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { MapPin, X, AlertTriangle } from 'lucide-react';
import { fetchNearbyHospitals } from '../services/mapService';

// Fix for default Leaflet icon issues in React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Create a custom pulsing red icon for hospitals to make it visually attractive
const hospitalIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Helper component to recenter map when location changes
const RecenterAutomatically = ({ lat, lon }) => {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lon], 13);
  }, [lat, lon, map]);
  return null;
};

const MapInterface = ({ onClose }) => {
  const [location, setLocation] = useState(null);
  const [hospitals, setHospitals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // 1. Get User Location
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setLocation({ lat: latitude, lon: longitude });

        // 2. Fetch Hospitals
        try {
          const data = await fetchNearbyHospitals(latitude, longitude, 5000); // 5km radius
          setHospitals(data);
        } catch (err) {
          setError('Failed to fetch hospital data.');
        } finally {
          setLoading(false);
        }
      },
      (err) => {
        setError('Location access denied. We cannot find nearby hospitals without your location.');
        setLoading(false);
      }
    );
  }, []);

  return (
    <div className="map-section">
      <div className="map-overlay">
        <div className="map-title">
          <MapPin color="#ef4444" size={24} />
          <div>
            <h2>Nearby Medical Facilities</h2>
            <p>{hospitals.length} locations found within 5km</p>
          </div>
        </div>
        <button onClick={onClose} className="close-btn" aria-label="Close Map">
          <X size={20} />
        </button>
      </div>

      {loading && (
        <div className="loading-map">
          <div className="dot" style={{width: 24, height: 24, background: '#ef4444'}}></div>
          <p>Locating emergency facilities...</p>
        </div>
      )}

      {error ? (
        <div className="loading-map" style={{textAlign: 'center', padding: '0 2rem'}}>
          <AlertTriangle color="#ef4444" size={48} style={{marginBottom: '1rem'}}/>
          <p>{error}</p>
          <button 
             onClick={onClose} 
             style={{marginTop: '1rem', padding: '8px 16px', background: '#334155', border:'none', color:'white', borderRadius:'8px', cursor:'pointer'}}
          >
            Close Map
          </button>
        </div>
      ) : location && (
        <MapContainer 
          center={[location.lat, location.lon]} 
          zoom={13} 
          style={{ height: '100%', width: '100%' }}
          zoomControl={false}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.basemaps.cartocdn.com/rastertiles/dark_all/{z}/{x}/{y}{r}.png" // Dark theme tile layer
          />
          
          {/* User Location Marker */}
          <Marker position={[location.lat, location.lon]}>
            <Popup>
              <h3>You are here</h3>
            </Popup>
          </Marker>

          {/* Hospital Markers */}
          {hospitals.map((h, i) => (
            <Marker key={h.id || i} position={[h.lat, h.lon]} icon={hospitalIcon}>
              <Popup>
                <h3>{h.name}</h3>
                <p><strong>Type:</strong> {h.type.charAt(0).toUpperCase() + h.type.slice(1)}</p>
                <p><strong>Phone:</strong> {h.contact}</p>
                <p><strong>Add.:</strong> {h.address}</p>
              </Popup>
            </Marker>
          ))}
          <RecenterAutomatically lat={location.lat} lon={location.lon} />
        </MapContainer>
      )}
    </div>
  );
};

export default MapInterface;
