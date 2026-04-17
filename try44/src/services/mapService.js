/**
 * Fetch nearby hospitals using OpenStreetMap Overpass API
 * @param {number} lat Latitude
 * @param {number} lon Longitude
 * @param {number} radius Radius in meters (default 5000 = 5km)
 * @returns Promise<Array> list of hospitals
 */
export async function fetchNearbyHospitals(lat, lon, radius = 5000) {
  // Construct Overpass QL query
  const query = `
    [out:json];
    (
      node["amenity"="hospital"](around:${radius},${lat},${lon});
      way["amenity"="hospital"](around:${radius},${lat},${lon});
      relation["amenity"="hospital"](around:${radius},${lat},${lon});
      node["amenity"="clinic"](around:${radius},${lat},${lon});
    );
    out center;
  `;

  try {
    // Send request to public Overpass API endpoint
    const response = await fetch("https://overpass-api.de/api/interpreter", {
      method: "POST",
      body: query,
      headers: {
        "Content-Type": "text/plain",
      },
    });

    if (!response.ok) {
      throw new Error("Network response was not ok");
    }

    const data = await response.json();
    
    // Parse results
    return data.elements.map(el => {
      // For ways and relations, the center coordinates are provided instead of raw node lats
      const entityLat = el.lat || (el.center && el.center.lat);
      const entityLon = el.lon || (el.center && el.center.lon);
      const name = el.tags?.name || "Unknown Healthcare Facility";
      
      return {
        id: el.id,
        lat: entityLat,
        lon: entityLon,
        name: name,
        type: el.tags?.amenity || 'hospital',
        contact: el.tags?.['contact:phone'] || el.tags?.phone || 'No phone listed',
        address: el.tags?.['addr:full'] || el.tags?.['addr:street'] || 'Unknown address'
      };
    }).filter(h => h.lat && h.lon); // Filter out any elements without valid coordinates

  } catch (err) {
    console.error("Error fetching hospitals from Overpass API:", err);
    return [];
  }
}
