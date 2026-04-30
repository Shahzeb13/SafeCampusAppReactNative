import { PermissionsAndroid, Platform } from "react-native";
import * as Location from 'expo-location';

export async function getLocationPermission() {
    if (Platform.OS === 'android') {
        try {
            const granted = await PermissionsAndroid.request(
                PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
                {
                    title: 'SafeCampus App Location Permission',
                    message: 'SafeCampus needs access to your Location so you can access Maps Services',
                    buttonNeutral: 'Ask Me Later',
                    buttonNegative: 'Cancel',
                    buttonPositive: 'OK',
                },
            );
            const isPermissionGranted = granted === PermissionsAndroid.RESULTS.GRANTED;
            if (isPermissionGranted) {
                console.log('Location permission granted');
                return true;
            } else {
                console.log('Location permission denied');
                return false;
            }
        } catch (err) {
            console.warn(err);
            return false;
        }
    } else {
        // iOS or other platforms using expo-location as fallback/standard
        const { status } = await Location.requestForegroundPermissionsAsync();
        return status === 'granted';
    }
}