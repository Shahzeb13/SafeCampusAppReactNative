import { overpassService, NearbyPlace } from './overpassService';

/**
 * ⚠️ DEPRECATED: This service previously used Google Places API.
 * 
 * Now refactored to use FREE OpenStreetMap via Overpass API.
 * No API keys, no billing, fully production-ready.
 * 
 * @deprecated Use overpassService directly
 */

export interface Place extends NearbyPlace {
  place_id?: string;
  vicinity?: string;
  geometry?: {
    location: {
      lat: number;
      lng: number;
    };
  };
  types?: string[];
  phoneNumber?: string;
}

/**
 * Legacy wrapper for backward compatibility.
 * All calls now use Overpass API (OpenStreetMap) instead of Google Places.
 */
export const googlePlacesService = {
  /**
   * Fetch nearby hospitals and police stations using FREE Overpass API (OpenStreetMap)
   * 
   * Replaces: Google Places Nearby Search
   * Cost: FREE (no API key required)
   * Data Source: OpenStreetMap
   */
  getNearbyEmergencyPlaces: async (lat: number, lng: number): Promise<Place[]> => {
    try {
      const places = await overpassService.getNearbyEmergencyPlaces(lat, lng);
      
      // Convert to Place interface for backward compatibility
      return places.map(p => ({
        ...p,
        place_id: p.id,
        vicinity: 'OpenStreetMap Location',
        geometry: {
          location: {
            lat: p.latitude,
            lng: p.longitude
          }
        },
        types: [p.type]
      }));
    } catch (error) {
      console.error('Overpass API Error:', error);
      throw error;
    }
  },

  /**
   * Fetch place details - Overpass has limited metadata.
   * For phone numbers, you'd need reverse geocoding (Nominatim).
   * 
   * Replaces: Google Places Details API
   * Cost: FREE
   */
  getPlaceDetails: async (placeId: string): Promise<{ phoneNumber?: string }> => {
    // Overpass API doesn't provide phone numbers directly
    // For a production app, you could use Nominatim reverse geocoding
    // or crowdsourced OSM data, but it's not standardized
    console.warn('Phone numbers not available from Overpass API. Consider Nominatim for reverse geocoding.');
    return {};
  }
};

