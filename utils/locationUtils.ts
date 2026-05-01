import * as Location from 'expo-location';
import { getLocationPermission } from '../services/locationService';

export const getUserLocation = async () => {
    try {
        const hasPermission = await getLocationPermission();
        if (!hasPermission) {
            throw new Error('Location permission not granted');
        }

        const location = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.High,
        });
        
        return {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
        };
    } catch (error) {
        console.error('Error getting user location:', error);
        throw error;
    }
};
