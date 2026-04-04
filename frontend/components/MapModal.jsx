'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet default icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const PUNE_CENTER = { lat: 18.5204, lng: 73.8567 };

const ALL_HOSPITALS = [
  {
    hospitalId: 1, name: 'Ruby Hall Clinic',
    coordinates: { lat: 18.5300, lng: 73.8700 },
    bedsAvailable: 45, bedsTotal: 200,
    ambulances: ['AMB001', 'AMB002'],
    specialistsOnDuty: ['Trauma Surgeon', 'Cardiologist', 'Neurologist'],
    level: 1, traumaCenter: true,
  },
  {
    hospitalId: 2, name: 'Sahyadri Hospital',
    coordinates: { lat: 18.5100, lng: 73.8400 },
    bedsAvailable: 32, bedsTotal: 150,
    ambulances: ['AMB003'],
    specialistsOnDuty: ['General Surgeon', 'Orthopedic'],
    level: 2, traumaCenter: false,
  },
  {
    hospitalId: 3, name: 'Jehangir Hospital',
    coordinates: { lat: 18.5250, lng: 73.8650 },
    bedsAvailable: 28, bedsTotal: 180,
    ambulances: ['AMB004', 'AMB005', 'AMB006'],
    specialistsOnDuty: ['Trauma Surgeon', 'Neurosurgeon', 'Vascular Surgeon'],
    level: 1, traumaCenter: true,
  },
  {
    hospitalId: 4, name: 'KEM Hospital Pune',
    coordinates: { lat: 18.5160, lng: 73.8550 },
    bedsAvailable: 60, bedsTotal: 300,
    ambulances: ['AMB007', 'AMB008'],
    specialistsOnDuty: ['Emergency Physician', 'Orthopedic'],
    level: 2, traumaCenter: false,
  },
  {
    hospitalId: 5, name: 'Deenanath Mangeshkar',
    coordinates: { lat: 18.5135, lng: 73.8315 },
    bedsAvailable: 18, bedsTotal: 120,
    ambulances: ['AMB009'],
    specialistsOnDuty: ['Trauma Surgeon', 'Intensivist', 'Burn Specialist'],
    level: 1, traumaCenter: true,
  },
  {
    hospitalId: 6, name: 'Poona Hospital',
    coordinates: { lat: 18.5340, lng: 73.8520 },
    bedsAvailable: 22, bedsTotal: 100,
    ambulances: ['AMB010'],
    specialistsOnDuty: ['General Physician', 'Pediatrician'],
    level: 3, traumaCenter: false,
  },
];

function haversine(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function generateRoutePath(from, to, steps = 24) {
  const points = [];
  const midLat = (from.lat + to.lat) / 2 + (to.lng - from.lng) * 0.08;
  const midLng = (from.lng + to.lng) / 2 - (to.lat - from.lat) * 0.08;
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const u = 1 - t;
    points.push([u * u * from.lat + 2 * u * t * midLat + t * t * to.lat,
                 u * u * from.lng + 2 * u * t * midLng + t * t * to.lng]);
  }
  return points;
}

async function analyzeTraumaImage(base64Image, mimeType) {
  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        messages: [{
          role: 'user',
          content: [
            { type: 'image', source: { type: 'base64', media_type: mimeType, data: base64Image } },
            {
              type: 'text',
              text: `You are an emergency medical triage AI. Analyze this accident/trauma scene image.
Respond ONLY with valid JSON, no markdown backticks:
{"severity":"HIGH"|"MODERATE"|"LOW","confidence":0-100,"indicators":["up to 3 visual cues"],"requiresLevel1":true|false,"summary":"one triage sentence under 20 words"}
HIGH=critical injuries, major crash, severe wounds, fire, entrapment, multiple casualties.
MODERATE=significant impact, possible fractures, moderate injuries.
LOW=minor incident, cosmetic damage.`,
            },
          ],
        }],
      }),
    });
    const data = await response.json();
    const text = data.content?.find(b => b.type === 'text')?.text || '{}';
    return JSON.parse(text.trim());
  } catch {
    return { severity: 'MODERATE', confidence: 40, indicators: ['Analysis unavailable'], requiresLevel1: false, summary: 'Manual assessment required.' };
  }
}

function makeSvgIcon(emoji, bg, size = 28) {
  const s = encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size+8}" viewBox="0 0 ${size} ${size+8}">` +
    `<path d="M${size/2} 0C${size*0.23} 0 0 ${size*0.23} 0 ${size/2}c0 ${size*0.375} ${size/2} ${size*0.785} ${size/2} ${size*0.785}S${size} ${size*0.875} ${size} ${size/2}C${size} ${size*0.23} ${size*0.77} 0 ${size/2} 0z" fill="${bg}" stroke="white" stroke-width="1.5"/>` +
    `<text x="${size/2}" y="${size*0.7}" text-anchor="middle" font-size="${size*0.43}" fill="white">${emoji}</text>` +
    `</svg>`
  );
  return L.icon({ iconUrl: `data:image/svg+xml,${s}`, iconSize: [size, size+8], iconAnchor: [size/2, size+8], popupAnchor: [0, -(size+8)] });
}

function makeCircleIcon(emoji, bg, size = 32) {
  const s = encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">` +
    `<circle cx="${size/2}" cy="${size/2}" r="${size/2-1}" fill="${bg}" stroke="white" stroke-width="2"/>` +
    `<text x="${size/2}" y="${size*0.72}" text-anchor="middle" font-size="${size*0.5}" fill="white">${emoji}</text>` +
    `</svg>`
  );
  return L.icon({ iconUrl: `data:image/svg+xml,${s}`, iconSize: [size, size], iconAnchor: [size/2, size/2] });
}

export default function MapModal({ isOpen, onClose, selectedHospitalId = null }) {
  const [isClient, setIsClient] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [locating, setLocating] = useState(false);
  const [hospitals, setHospitals] = useState([]);
  const [nearestHospital, setNearestHospital] = useState(null);
  const [simulating, setSimulating] = useState(false);
  const [simDone, setSimDone] = useState(false);
  const [traumaFilter, setTraumaFilter] = useState(false);
  const [imageAnalyzing, setImageAnalyzing] = useState(false);
  const [traumaResult, setTraumaResult] = useState(null);
  const [sceneImageUrl, setSceneImageUrl] = useState(null);

  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const routeLayerRef = useRef(null);
  const markersRef = useRef({});
  const ambulanceRef = useRef(null);
  const animTimerRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => { setIsClient(true); }, []);

  // Compute distances and sort
  useEffect(() => {
    const base = ALL_HOSPITALS;
    if (!userLocation) {
      const visible = traumaFilter ? base.filter(h => h.traumaCenter) : base;
      setHospitals(visible.map(h => ({ ...h, distance: null, eta: null })));
      setNearestHospital(null);
      return;
    }
    const withDist = base.map(h => {
      const dist = haversine(userLocation.lat, userLocation.lng, h.coordinates.lat, h.coordinates.lng);
      return { ...h, distance: dist, eta: Math.round((dist / 40) * 60) };
    }).sort((a, b) => a.distance - b.distance);
    const visible = traumaFilter ? withDist.filter(h => h.traumaCenter) : withDist;
    setHospitals(visible);
    setNearestHospital(visible[0] || null);
  }, [userLocation, traumaFilter]);

  // Initialize map once
  useEffect(() => {
    if (!isClient || !isOpen || !mapRef.current) return;
    if (!mapInstanceRef.current) {
      mapInstanceRef.current = L.map(mapRef.current, {
        center: [PUNE_CENTER.lat, PUNE_CENTER.lng],
        zoom: 13,
        zoomControl: true,
        attributionControl: false,
      });
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 18 }).addTo(mapInstanceRef.current);
    }
    return () => {
      if (animTimerRef.current) clearTimeout(animTimerRef.current);
      if (mapInstanceRef.current) { mapInstanceRef.current.remove(); mapInstanceRef.current = null; }
      markersRef.current = {};
    };
  }, [isClient, isOpen]);

  // Re-render markers
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    renderMarkers();
  }, [hospitals, userLocation, nearestHospital]);

  function renderMarkers() {
    const map = mapInstanceRef.current;
    if (!map) return;
    Object.values(markersRef.current).forEach(m => m.remove());
    markersRef.current = {};
    if (routeLayerRef.current) { routeLayerRef.current.remove(); routeLayerRef.current = null; }
    if (ambulanceRef.current) { ambulanceRef.current.remove(); ambulanceRef.current = null; }

    hospitals.forEach(h => {
      const isNearest = nearestHospital && h.hospitalId === nearestHospital.hospitalId;
      const icon = isNearest
        ? makeSvgIcon('🏥', '#059669', 34)
        : h.level === 1 ? makeSvgIcon('🏥', '#dc2626', 28)
        : h.level === 2 ? makeSvgIcon('🏥', '#0284c7', 26)
        : makeSvgIcon('🏥', '#64748b', 24);

      const distHtml = h.distance != null
        ? `<div style="margin-top:6px;padding-top:5px;border-top:1px solid #e2e8f0;font-size:11px;color:#0284c7;font-weight:700;">📏 ${h.distance.toFixed(1)} km · 🕐 ~${h.eta} min ETA</div>`
        : '';
      const nearBadge = isNearest
        ? `<div style="background:#ecfdf5;border:1px solid #6ee7b7;border-radius:6px;padding:3px 8px;margin-bottom:6px;font-size:11px;font-weight:800;color:#059669;">⭐ NEAREST</div>`
        : '';
      const levelBadge = h.traumaCenter
        ? `<span style="background:#dc2626;color:#fff;padding:2px 6px;border-radius:4px;font-size:10px;font-weight:700;">Level 1 Trauma</span>`
        : `<span style="background:#94a3b8;color:#fff;padding:2px 6px;border-radius:4px;font-size:10px;">Level ${h.level}</span>`;

      const marker = L.marker([h.coordinates.lat, h.coordinates.lng], { icon })
        .addTo(map)
        .bindPopup(L.popup({ maxWidth: 230 }).setContent(
          `<div style="font-family:system-ui,sans-serif;">
            ${nearBadge}
            <div style="margin-bottom:5px;">${levelBadge}</div>
            <div style="font-weight:800;font-size:13px;color:#0f172a;margin-bottom:5px;">${h.name}</div>
            <div style="font-size:11px;color:#64748b;line-height:1.8;">
              🛏️ <b>${h.bedsAvailable}</b>/${h.bedsTotal} beds<br/>
              🚑 ${h.ambulances.length} ambulance${h.ambulances.length !== 1 ? 's' : ''}<br/>
              👨‍⚕️ ${h.specialistsOnDuty.slice(0,2).join(', ')}
            </div>
            ${distHtml}
          </div>`
        ));
      if (isNearest) marker.openPopup();
      markersRef.current[h.hospitalId] = marker;
    });

    if (userLocation) {
      markersRef.current['user'] = L.marker([userLocation.lat, userLocation.lng], {
        icon: makeCircleIcon('📍', '#0284c7', 32)
      }).addTo(map).bindPopup('<b style="font-size:12px;">📍 Your Location</b>');
    }

    const allPts = hospitals.map(h => [h.coordinates.lat, h.coordinates.lng]);
    if (userLocation) allPts.push([userLocation.lat, userLocation.lng]);
    if (allPts.length > 0) map.fitBounds(allPts, { padding: [40, 40] });
  }

  const handleLocate = useCallback(() => {
    setLocating(true);
    setSimDone(false);
    if (!navigator.geolocation) {
      setUserLocation({ lat: 18.518, lng: 73.857 });
      setLocating(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      pos => { setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }); setLocating(false); },
      () => { setUserLocation({ lat: 18.518, lng: 73.857 }); setLocating(false); },
      { timeout: 7000 }
    );
  }, []);

  const runSimulation = useCallback(async () => {
    if (!nearestHospital || !userLocation || simulating) return;
    const map = mapInstanceRef.current;
    if (!map) return;
    setSimulating(true); setSimDone(false);

    if (routeLayerRef.current) routeLayerRef.current.remove();
    let pts = [];
    try {
      const res = await fetch(`https://router.project-osrm.org/route/v1/driving/${userLocation.lng},${userLocation.lat};${nearestHospital.coordinates.lng},${nearestHospital.coordinates.lat}?overview=simplified&geometries=geojson`);
      const data = await res.json();
      if (data.routes && data.routes.length > 0) {
        pts = data.routes[0].geometry.coordinates.map(c => [c[1], c[0]]);
      } else {
        throw new Error('No route');
      }
    } catch {
      pts = generateRoutePath(userLocation, nearestHospital.coordinates, 28);
    }
    
    routeLayerRef.current = L.polyline(pts, {
      color: '#dc2626', weight: 4, opacity: 0.85, dashArray: '8,5'
    }).addTo(map);

    if (ambulanceRef.current) ambulanceRef.current.remove();
    ambulanceRef.current = L.marker(
      [nearestHospital.coordinates.lat, nearestHospital.coordinates.lng],
      { icon: makeCircleIcon('🚑', '#dc2626', 36), zIndexOffset: 1000 }
    ).addTo(map);

    let step = pts.length - 1;
    const tick = () => {
      if (step < 0) {
        setSimulating(false); setSimDone(true);
        ambulanceRef.current?.bindPopup(
          `<div style="font-family:system-ui;font-weight:800;color:#059669;font-size:12px;">🚑 Ambulance dispatched!<br/>ETA: ~${nearestHospital.eta} min</div>`
        ).openPopup();
        return;
      }
      ambulanceRef.current?.setLatLng(pts[step]);
      step--;
      animTimerRef.current = setTimeout(tick, Math.max(10, 2000 / pts.length));
    };
    tick();
  }, [nearestHospital, userLocation, simulating]);

  const handleImageUpload = useCallback(async e => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSceneImageUrl(URL.createObjectURL(file));
    setImageAnalyzing(true);
    setTraumaResult(null);
    try {
      const base64 = await new Promise((res, rej) => {
        const r = new FileReader();
        r.onload = () => res(r.result.split(',')[1]);
        r.onerror = rej;
        r.readAsDataURL(file);
      });
      const result = await analyzeTraumaImage(base64, file.type || 'image/jpeg');
      setTraumaResult(result);
      if (result.requiresLevel1 || result.severity === 'HIGH') setTraumaFilter(true);
    } catch {
      setTraumaResult({ severity: 'MODERATE', confidence: 40, indicators: [], requiresLevel1: false, summary: 'Analysis failed. Manual triage required.' });
    } finally {
      setImageAnalyzing(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }, []);

  if (!isClient || !isOpen) return null;

  const sevColor = traumaResult?.severity === 'HIGH' ? '#dc2626' : traumaResult?.severity === 'MODERATE' ? '#d97706' : '#059669';
  const sevBg = traumaResult?.severity === 'HIGH' ? '#fff1f2' : traumaResult?.severity === 'MODERATE' ? '#fffbeb' : '#f0fdf4';
  const sevEmoji = traumaResult?.severity === 'HIGH' ? '🚨' : traumaResult?.severity === 'MODERATE' ? '⚠️' : '✅';

  return (
    <>
      <div
        style={{ position:'fixed',inset:0,background:'rgba(15,23,42,0.7)',backdropFilter:'blur(8px)',zIndex:1000,display:'flex',alignItems:'center',justifyContent:'center',padding:16 }}
        onClick={onClose}
      >
        <div
          style={{ background:'#fff',borderRadius:20,boxShadow:'0 30px 70px rgba(0,0,0,0.3)',width:'100%',maxWidth:920,maxHeight:'92vh',display:'flex',flexDirection:'column',overflow:'hidden' }}
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',padding:'14px 20px',background:'linear-gradient(135deg,#0f172a,#1e3a5f)',borderRadius:'20px 20px 0 0' }}>
            <div style={{ display:'flex',alignItems:'center',gap:10 }}>
              <span style={{ fontSize:22 }}>🗺️</span>
              <div>
                <div style={{ color:'#fff',fontWeight:800,fontSize:15 }}>Emergency Hospital Map</div>
                <div style={{ color:'#94a3b8',fontSize:11 }}>Pune Emergency Response Network · {hospitals.length} facilities</div>
              </div>
              {traumaFilter && (
                <span style={{ background:'#dc2626',color:'#fff',fontSize:10,fontWeight:700,padding:'3px 8px',borderRadius:20 }}>
                  🚨 TRAUMA CENTERS ONLY
                </span>
              )}
            </div>
            <div style={{ display:'flex',gap:8,alignItems:'center' }}>
              {traumaFilter && (
                <button onClick={() => { setTraumaFilter(false); }}
                  style={{ background:'rgba(255,255,255,0.15)',color:'#fff',border:'none',borderRadius:8,padding:'6px 12px',fontSize:11,cursor:'pointer',fontWeight:600 }}>
                  Show All
                </button>
              )}
              <button onClick={onClose}
                style={{ background:'rgba(255,255,255,0.1)',color:'#fff',border:'none',borderRadius:8,width:32,height:32,fontSize:20,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center' }}>
                ×
              </button>
            </div>
          </div>

          {/* Trauma Analysis Banner */}
          {traumaResult && (
            <div style={{ background:sevBg,borderBottom:`2px solid ${sevColor}`,padding:'10px 18px',display:'flex',alignItems:'center',gap:12 }}>
              {sceneImageUrl && (
                <img src={sceneImageUrl} alt="Scene" style={{ width:54,height:54,objectFit:'cover',borderRadius:8,border:`2px solid ${sevColor}`,flexShrink:0 }} />
              )}
              <div style={{ flex:1,minWidth:0 }}>
                <div style={{ display:'flex',alignItems:'center',gap:8,marginBottom:3,flexWrap:'wrap' }}>
                  <span style={{ background:sevColor,color:'#fff',padding:'2px 10px',borderRadius:20,fontWeight:800,fontSize:11 }}>
                    {sevEmoji} {traumaResult.severity} SEVERITY
                  </span>
                  <span style={{ fontSize:11,color:'#64748b' }}>{traumaResult.confidence}% confidence</span>
                  {traumaResult.requiresLevel1 && (
                    <span style={{ fontSize:11,fontWeight:800,color:'#dc2626' }}>→ Auto-routed to Level 1 Trauma Centers</span>
                  )}
                </div>
                <div style={{ fontSize:12,color:'#334155',marginBottom:2 }}>{traumaResult.summary}</div>
                {traumaResult.indicators?.length > 0 && (
                  <div style={{ fontSize:11,color:'#64748b' }}>Detected: {traumaResult.indicators.join(' · ')}</div>
                )}
              </div>
              <button onClick={() => { setTraumaResult(null); setSceneImageUrl(null); setTraumaFilter(false); }}
                style={{ background:'transparent',border:'none',color:'#94a3b8',cursor:'pointer',fontSize:18,padding:4 }}>×</button>
            </div>
          )}

          {/* Toolbar */}
          <div style={{ display:'flex',gap:8,padding:'10px 16px',borderBottom:'1px solid #f1f5f9',background:'#f8fafc',flexWrap:'wrap',alignItems:'center' }}>
            {/* Locate */}
            <button onClick={handleLocate} disabled={locating}
              style={{ display:'flex',alignItems:'center',gap:5,background:userLocation?'#ecfdf5':'#0284c7',color:userLocation?'#059669':'#fff',border:userLocation?'1px solid #6ee7b7':'none',borderRadius:10,padding:'8px 14px',fontSize:12,fontWeight:700,cursor:'pointer' }}>
              {locating ? '⏳ Locating…' : userLocation ? '📍 Located ✓' : '📍 Locate Me'}
            </button>

            {/* Nearest info pill */}
            {userLocation && nearestHospital && (
              <button onClick={() => {
                  const m = markersRef.current[nearestHospital.hospitalId];
                  if (m) { mapInstanceRef.current?.setView([nearestHospital.coordinates.lat, nearestHospital.coordinates.lng], 15); m.openPopup(); }
                }}
                style={{ display:'flex',alignItems:'center',gap:5,background:'#f0fdf4',color:'#059669',border:'1px solid #6ee7b7',borderRadius:10,padding:'8px 14px',fontSize:12,fontWeight:700,cursor:'pointer' }}>
                🎯 Nearest: {nearestHospital.name.split(' ').slice(0,3).join(' ')} · {nearestHospital.distance?.toFixed(1)}km
              </button>
            )}

            {/* Dispatch button */}
            {userLocation && nearestHospital && !simulating && !simDone && (
              <button onClick={runSimulation}
                style={{ display:'flex',alignItems:'center',gap:5,background:'#dc2626',color:'#fff',border:'none',borderRadius:10,padding:'8px 14px',fontSize:12,fontWeight:700,cursor:'pointer' }}>
                🚑 Dispatch Ambulance
              </button>
            )}

            {simulating && (
              <div style={{ display:'flex',alignItems:'center',gap:5,background:'#fef3c7',color:'#d97706',border:'1px solid #fcd34d',borderRadius:10,padding:'8px 14px',fontSize:12,fontWeight:700 }}>
                🔴 En route to scene…
              </div>
            )}

            {simDone && (
              <div style={{ display:'flex',alignItems:'center',gap:5,background:'#ecfdf5',color:'#059669',border:'1px solid #6ee7b7',borderRadius:10,padding:'8px 14px',fontSize:12,fontWeight:700 }}>
                ✅ Dispatched · ETA {nearestHospital?.eta} min
              </div>
            )}

            <div style={{ flex:1 }} />

            {/* Scene Photo / AI Triage */}
            <button onClick={() => fileInputRef.current?.click()}
              style={{ display:'flex',alignItems:'center',gap:6,background:traumaResult?'#fef3c7':'#1e3a5f',color:traumaResult?'#d97706':'#fff',border:traumaResult?'1px solid #fcd34d':'none',borderRadius:10,padding:'8px 14px',fontSize:12,fontWeight:700,cursor:'pointer' }}>
              📸 {imageAnalyzing ? 'Analyzing…' : traumaResult ? 'Retake Photo' : 'Scene Photo · AI Triage'}
              {imageAnalyzing && (
                <span style={{ display:'inline-block',width:10,height:10,borderRadius:'50%',border:'2px solid currentColor',borderTopColor:'transparent',animation:'spin 0.8s linear infinite',marginLeft:2 }} />
              )}
            </button>

            <input ref={fileInputRef} type="file" accept="image/*" capture="environment" style={{ display:'none' }} onChange={handleImageUpload} />
          </div>

          {/* Map + Sidebar */}
          <div style={{ display:'flex',flex:1,minHeight:0,overflow:'hidden' }}>
            <div ref={mapRef} style={{ flex:1,minHeight:300 }} />

            {/* Hospital sidebar */}
            <div style={{ width:220,borderLeft:'1px solid #e2e8f0',overflowY:'auto',background:'#fff',display:'flex',flexDirection:'column',flexShrink:0 }}>
              <div style={{ padding:'10px 12px',background:'#f8fafc',borderBottom:'1px solid #e2e8f0',fontSize:11,fontWeight:700,color:'#64748b',letterSpacing:'0.04em',position:'sticky',top:0,zIndex:1 }}>
                {traumaFilter ? '🏥 TRAUMA CENTERS' : '🏥 ALL HOSPITALS'}
                <span style={{ float:'right',color:'#0284c7' }}>{hospitals.length}</span>
              </div>

              {hospitals.map((h, i) => {
                const isNearest = nearestHospital && h.hospitalId === nearestHospital.hospitalId;
                return (
                  <div key={h.hospitalId} onClick={() => {
                      const m = markersRef.current[h.hospitalId];
                      if (m) { mapInstanceRef.current?.setView([h.coordinates.lat, h.coordinates.lng], 15); m.openPopup(); }
                    }}
                    style={{ padding:'10px 12px',borderBottom:'1px solid #f1f5f9',cursor:'pointer',background:isNearest?'#f0fdf4':i%2===0?'#fff':'#fafafa' }}>
                    <div style={{ display:'flex',alignItems:'center',gap:4,marginBottom:3 }}>
                      {isNearest && <span style={{ fontSize:10,color:'#059669',fontWeight:800 }}>⭐</span>}
                      <span style={{ fontSize:11,fontWeight:700,color:'#0f172a' }}>
                        {h.name.length > 22 ? h.name.slice(0,20)+'…' : h.name}
                      </span>
                    </div>
                    <div style={{ display:'flex',gap:4,marginBottom:3,flexWrap:'wrap' }}>
                      <span style={{ fontSize:9,padding:'1px 5px',borderRadius:4,fontWeight:700,background:h.traumaCenter?'#fee2e2':'#e0f2fe',color:h.traumaCenter?'#dc2626':'#0284c7' }}>
                        L{h.level}{h.traumaCenter?' Trauma':''}
                      </span>
                      <span style={{ fontSize:9,color:'#64748b' }}>🛏️ {h.bedsAvailable}/{h.bedsTotal}</span>
                    </div>
                    {h.distance != null && (
                      <div style={{ fontSize:10,color:'#0284c7',fontWeight:600 }}>{h.distance.toFixed(1)} km · {h.eta} min</div>
                    )}
                  </div>
                );
              })}

              {hospitals.length === 0 && (
                <div style={{ padding:24,textAlign:'center',color:'#94a3b8',fontSize:12 }}>No hospitals match filter.</div>
              )}
            </div>
          </div>

          {/* Legend */}
          <div style={{ display:'flex',gap:14,padding:'8px 16px',borderTop:'1px solid #e2e8f0',background:'#f8fafc',fontSize:10,color:'#64748b',flexWrap:'wrap',alignItems:'center' }}>
            <span>🔴 Level 1 Trauma</span>
            <span>🔵 Level 2</span>
            <span>⚫ Level 3</span>
            <span>🟢 Nearest</span>
            <span>🚑 Ambulance</span>
            <span style={{ marginLeft:'auto',color:'#94a3b8' }}>
              {userLocation ? `📍 ${userLocation.lat.toFixed(4)}, ${userLocation.lng.toFixed(4)}` : 'Tap "Locate Me" for routing'}
            </span>
          </div>
        </div>
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </>
  );
}
