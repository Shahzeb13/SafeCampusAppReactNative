import axios from 'axios';

export interface NearbyPlace {
  id: string;
  latitude: number;
  longitude: number;
  name: string;
  type: 'hospital' | 'police';
}

const OVERPASS_URLS = [
  'https://overpass-api.de/api/interpreter',
  'https://lz4.overpass-api.de/api/interpreter',
  'https://z.overpass-api.de/api/interpreter'
];

export const overpassService = {
  /**
   * Fetch nearby hospitals or police stations using Overpass API
   */
  fetchNearbyPlaces: async (
    lat: number,
    lng: number,
    type: 'hospital' | 'police',
    radius: number = 1500 // Reduced from 2000 to prevent 504 timeouts
  ): Promise<NearbyPlace[]> => {
    let lastError: any = null;

    // Try multiple mirrors to ensure reliability
    for (const baseUrl of OVERPASS_URLS) {
      try {
        const query = `[out:json];node["amenity"="${type}"](around:${radius},${lat},${lng});out;`;
        const response = await axios.get(`${baseUrl}?data=${encodeURIComponent(query)}`, {
          timeout: 8000, 
        });

        if (response.data?.elements) {
          return response.data.elements.map((element: any) => ({
            id: element.id.toString(),
            latitude: element.lat,
            longitude: element.lon,
            name: element.tags?.name || 'Unknown',
            type: type,
          }));
        }
      } catch (error: any) {
        lastError = error;
        console.warn(`Mirror ${baseUrl} failed, trying next...`);
        continue;
      }
    }

    const errorDetail = lastError?.response ? `Status: ${lastError.response.status}` : lastError?.message;
    throw new Error(`Overpass fetch failed after trying mirrors: ${errorDetail}`);
  },

  /**
   * Helper to fetch both hospitals and police stations
   */
  getNearbyEmergencyPlaces: async (lat: number, lng: number): Promise<NearbyPlace[]> => {
    const radius = 1500; // 1.5km is usually plenty for emergency services
    let lastError: any = null;

    for (const baseUrl of OVERPASS_URLS) {
      try {
        const combinedQuery = `[out:json];(node["amenity"="hospital"](around:${radius},${lat},${lng});node["amenity"="police"](around:${radius},${lat},${lng}););out;`;
        
        const response = await axios.get(`${baseUrl}?data=${encodeURIComponent(combinedQuery)}`, {
          timeout: 10000
        });

        if (response.data?.elements) {
          return response.data.elements.map((element: any) => ({
            id: element.id.toString(),
            latitude: element.lat,
            longitude: element.lon,
            name: element.tags?.name || 'Unknown',
            type: element.tags?.amenity === 'hospital' ? 'hospital' : 'police',
          }));
        }
      } catch (error: any) {
        lastError = error;
        console.warn(`Mirror ${baseUrl} failed (Combined Query), trying next...`);
        continue;
      }
    }

    throw new Error(`Combined Overpass fetch failed: ${lastError?.message || 'Unknown error'}`);
  }
};
