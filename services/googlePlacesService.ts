import axios from 'axios';
import { GOOGLE_MAPS_API_KEY } from '../config/api';

export interface Place {
  place_id: string;
  name: string;
  vicinity: string;
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
  };
  types: string[];
  phoneNumber?: string;
}

export const googlePlacesService = {
  /**
   * Fetch nearby hospitals and police stations using Google Places Nearby Search
   */
  getNearbyEmergencyPlaces: async (lat: number, lng: number): Promise<Place[]> => {
    try {
      const radius = 2000; // 2km
      const types = ['hospital', 'police'];
      
      const requests = types.map(type => 
        axios.get(`https://maps.googleapis.com/maps/api/place/nearbysearch/json`, {
          params: {
            location: `${lat},${lng}`,
            radius: radius,
            type: type,
            key: GOOGLE_MAPS_API_KEY
          }
        })
      );

      const responses = await Promise.all(requests);
      const allPlaces: Place[] = [];

      responses.forEach(response => {
        if (response.data.status === 'OK') {
          allPlaces.push(...response.data.results);
        }
      });

      return allPlaces;
    } catch (error) {
      console.error('Google Places Nearby Search Error:', error);
      throw error;
    }
  },

  /**
   * Fetch additional details (like phone number) for a specific place
   */
  getPlaceDetails: async (placeId: string): Promise<{ phoneNumber?: string }> => {
    try {
      const response = await axios.get(`https://maps.googleapis.com/maps/api/place/details/json`, {
        params: {
          place_id: placeId,
          fields: 'formatted_phone_number',
          key: GOOGLE_MAPS_API_KEY
        }
      });

      if (response.data.status === 'OK') {
        return {
          phoneNumber: response.data.result.formatted_phone_number
        };
      }
      return {};
    } catch (error) {
      console.error('Google Places Details Error:', error);
      return {};
    }
  }
};
