import { PermissionsAndroid, Platform } from "react-native";
import * as Location from 'expo-location';

export async function getLocationPermission() {
    if (Platform.OS === 'android') {
        try {
            // 1. Request Foreground Location
            const foreground = await PermissionsAndroid.request(
                PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
                {
                    title: 'SafeCampus Location Permission',
                    message: 'SafeCampus needs foreground location to show you on the map.',
                    buttonPositive: 'OK',
                },
            );

            if (foreground !== PermissionsAndroid.RESULTS.GRANTED) return false;

            // 2. Request Background Location (Critical for SOS when app is minimized)
            // On Android 10+, this must be requested separately
            if (Platform.Version >= 29) {
                const background = await PermissionsAndroid.request(
                    PermissionsAndroid.PERMISSIONS.ACCESS_BACKGROUND_LOCATION,
                    {
                        title: 'SafeCampus Background Location',
                        message: 'To protect you when the app is closed, SafeCampus needs permission to access location in the background for SOS alerts.',
                        buttonPositive: 'Allow in Settings',
                    },
                );
                return background === PermissionsAndroid.RESULTS.GRANTED;
            }

            return true;
        } catch (err) {
            console.warn(err);
            return false;
        }
    } else {
        // iOS
        const { status: foregroundStatus } = await Location.requestForegroundPermissionsAsync();
        if (foregroundStatus !== 'granted') return false;

        const { status: backgroundStatus } = await Location.requestBackgroundPermissionsAsync();
        return backgroundStatus === 'granted';
    }
}