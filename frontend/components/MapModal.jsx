'use client';

import { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default markers
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const PUNE_CENTER = { lat: 18.5204, lng: 73.8567 };

// Sample hospital data
const sampleHospitals = [
  {
    hospitalId: 1,
    name: 'Ruby Hall Clinic',
    coordinates: { lat: 18.5300, lng: 73.8700 },
    bedsAvailable: 45,
    bedsTotal: 200,
    ambulances: ['AMB001', 'AMB002'],
    specialistsOnDuty: ['Dr. Sharma', 'Dr. Patel']
  },
  {
    hospitalId: 2,
    name: 'Sahyadri Hospital',
    coordinates: { lat: 18.5100, lng: 73.8400 },
    bedsAvailable: 32,
    bedsTotal: 150,
    ambulances: ['AMB003'],
    specialistsOnDuty: ['Dr. Kumar', 'Dr. Singh']
  },
  {
    hospitalId: 3,
    name: 'Jehangir Hospital',
    coordinates: { lat: 18.5250, lng: 73.8650 },
    bedsAvailable: 28,
    bedsTotal: 180,
    ambulances: ['AMB004', 'AMB005', 'AMB006'],
    specialistsOnDuty: ['Dr. Rao', 'Dr. Desai', 'Dr. Joshi']
  }
];

const hospitalIcon = L.icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const selectedHospitalIcon = L.icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  iconSize: [35, 51],
  iconAnchor: [17, 51],
  popupAnchor: [1, -34],
  shadowSize: [51, 51]
});

export default function MapModal({ isOpen, onClose, selectedHospitalId = null }) {
  const [isClient, setIsClient] = useState(false);
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (isClient && isOpen && mapRef.current && !mapInstanceRef.current) {
      // Initialize map
      const map = L.map(mapRef.current, {
        center: [PUNE_CENTER.lat, PUNE_CENTER.lng],
        zoom: 13,
        zoomControl: true
      });

      // Add tile layer
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 18,
        attribution: '© OpenStreetMap'
      }).addTo(map);

      // Add hospital markers
      sampleHospitals.forEach(h => {
        const isSelected = h.hospitalId === selectedHospitalId;
        const icon = isSelected ? selectedHospitalIcon : hospitalIcon;
        const marker = L.marker([h.coordinates.lat, h.coordinates.lng], { icon })
          .addTo(map)
          .bindPopup(`
            <div style="font-family:Inter,sans-serif;min-width:180px;">
              <div style="font-weight:800;font-size:13px;margin-bottom:6px;">${h.name}</div>
              <div style="font-size:11px;color:#64748b;">
                🛏️ ${h.bedsAvailable}/${h.bedsTotal} beds<br/>
                🚑 ${h.ambulances.length} ambulances<br/>
                👨‍⚕️ ${h.specialistsOnDuty.join(', ')}
              </div>
            </div>
          `);

        if (isSelected) {
          marker.openPopup();
        }
      });

      // Fit map to show all hospitals
      const allCoords = sampleHospitals.map(h => [h.coordinates.lat, h.coordinates.lng]);
      if (allCoords.length > 0) {
        map.fitBounds(allCoords, { padding: [30, 30] });
      }

      // Add Pune boundary circle
      L.circle([PUNE_CENTER.lat, PUNE_CENTER.lng], {
        radius: 8000,
        color: '#2563eb',
        fillColor: '#2563eb',
        fillOpacity: 0.03,
        weight: 1,
        dashArray: '5, 10',
        opacity: 0.3
      }).addTo(map);

      mapInstanceRef.current = map;
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [isClient, isOpen, selectedHospitalId]);

  if (!isClient || !isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[80vh] overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-xl font-semibold">Hospital Map - Pune</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ×
          </button>
        </div>
        <div ref={mapRef} className="h-96 w-full"></div>
      </div>
    </div>
  );
}