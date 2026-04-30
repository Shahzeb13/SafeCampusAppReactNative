import axios from 'axios';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────
export interface NearbyPlace {
  id: string;
  latitude: number;
  longitude: number;
  name: string;
  type: 'hospital' | 'police';
}

// ─────────────────────────────────────────────────────────────────────────────
// Config
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Overpass API requires a CUSTOM User-Agent header.
 * Without it, all mirrors return 406 Not Acceptable.
 * Must identify app name + contact info.
 */
const USER_AGENT = 'SafeCampusApp/1.0 (university-safety-project)';

const OVERPASS_URLS = [
  'https://overpass-api.de/api/interpreter',
  'https://lz4.overpass-api.de/api/interpreter',
  'https://z.overpass-api.de/api/interpreter',
];

// In-memory cache to avoid hammering Overpass on every location update
let cachedPlaces: NearbyPlace[] | null = null;
let cacheTimestamp = 0;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

// ─────────────────────────────────────────────────────────────────────────────
// Core Overpass fetcher
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Sends an Overpass QL query using POST with proper headers.
 * Tries each mirror in sequence; returns raw elements array on success.
 */
async function queryOverpass(overpassQL: string): Promise<any[]> {
  let lastError: any = null;

  for (const baseUrl of OVERPASS_URLS) {
    try {
      const response = await axios.post(
        baseUrl,
        `data=${encodeURIComponent(overpassQL)}`,
        {
          timeout: 15000,
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'User-Agent': USER_AGENT,
            'Accept': 'application/json',
          },
        },
      );

      if (response.data?.elements) {
        return response.data.elements;
      }

      // Valid response but no elements — return empty
      return [];
    } catch (error: any) {
      lastError = error;
      const status = error?.response?.status;
      const msg = error?.message || 'Unknown';
      console.warn(`Overpass mirror ${baseUrl} failed [${status || msg}]`);

      // If rate-limited (429), respect Retry-After and don't try other mirrors
      if (status === 429) {
        const retryAfter = error.response?.headers?.['retry-after'];
        console.warn(`Rate limited. Retry after: ${retryAfter || '?'}s`);
        break; // Don't hammer other mirrors, they share the same backend
      }

      continue;
    }
  }

  const detail = lastError?.response
    ? `HTTP ${lastError.response.status}`
    : lastError?.message || 'Unknown error';
  throw new Error(`All Overpass mirrors failed: ${detail}`);
}

// ─────────────────────────────────────────────────────────────────────────────
// Bounding box helper
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Creates a bounding box around a coordinate.
 * bbox is more efficient than `around:` for Overpass because it uses the
 * spatial index directly, whereas `around:` computes distance for every node.
 *
 * @param lat Center latitude
 * @param lng Center longitude
 * @param radiusKm Radius in kilometers
 * @returns [south, west, north, east] bbox string for Overpass QL
 */
function toBBox(lat: number, lng: number, radiusKm: number = 2): string {
  // 1 degree of latitude ≈ 111km
  const latDelta = radiusKm / 111;
  // 1 degree of longitude varies by latitude
  const lngDelta = radiusKm / (111 * Math.cos((lat * Math.PI) / 180));

  const south = (lat - latDelta).toFixed(6);
  const west = (lng - lngDelta).toFixed(6);
  const north = (lat + latDelta).toFixed(6);
  const east = (lng + lngDelta).toFixed(6);

  return `${south},${west},${north},${east}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────────────────────────────────────

export const overpassService = {
  /**
   * Fetch a single type of place nearby.
   */
  fetchNearbyPlaces: async (
    lat: number,
    lng: number,
    type: 'hospital' | 'police',
    radiusKm: number = 2,
  ): Promise<NearbyPlace[]> => {
    const bbox = toBBox(lat, lng, radiusKm);

    // Use bbox instead of `around:` — much faster and less server load
    // Query both nodes AND ways (many hospitals are mapped as building outlines)
    const query = `
      [out:json][timeout:10];
      (
        node["amenity"="${type}"](${bbox});
        way["amenity"="${type}"](${bbox});
        rel["amenity"="${type}"](${bbox});
      );
      out center tags;
    `;

    const elements = await queryOverpass(query);

    return elements.map((el: any) => ({
      id: el.id.toString(),
      latitude: el.center?.lat ?? el.lat,
      longitude: el.center?.lon ?? el.lon,
      name: el.tags?.name || 'Unknown',
      type,
    }));
  },

  /**
   * Fetch hospitals + police in a single combined query.
   * Uses in-memory cache (5 min TTL) to avoid spamming Overpass.
   */
  getNearbyEmergencyPlaces: async (
    lat: number,
    lng: number,
  ): Promise<NearbyPlace[]> => {
    // Return cache if still fresh
    const now = Date.now();
    if (cachedPlaces && now - cacheTimestamp < CACHE_TTL_MS) {
      return cachedPlaces;
    }

    const bbox = toBBox(lat, lng, 2); // 2km radius

    const query = `
      [out:json][timeout:10];
      (
        node["amenity"="hospital"](${bbox});
        way["amenity"="hospital"](${bbox});
        rel["amenity"="hospital"](${bbox});
        node["amenity"="police"](${bbox});
        way["amenity"="police"](${bbox});
        rel["amenity"="police"](${bbox});
      );
      out center tags;
    `;

    const elements = await queryOverpass(query);

    const places: NearbyPlace[] = elements
      .filter((el: any) => (el.lat || el.center?.lat)) // skip elements without coords
      .map((el: any) => ({
        id: el.id.toString(),
        latitude: el.center?.lat ?? el.lat,
        longitude: el.center?.lon ?? el.lon,
        name: el.tags?.name || 'Unknown',
        type: el.tags?.amenity === 'hospital' ? 'hospital' as const : 'police' as const,
      }));

    // Cache the result
    cachedPlaces = places;
    cacheTimestamp = now;

    return places;
  },

  /** Force clear the cache (e.g. when user moves significantly) */
  clearCache: () => {
    cachedPlaces = null;
    cacheTimestamp = 0;
  },
};
