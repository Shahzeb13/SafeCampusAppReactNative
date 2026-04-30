import messaging from '@react-native-firebase/messaging';

/**
 * Fetches the FCM token from Firebase.
 * Handles permissions and platform-specific logic.
 */
export async function fcmToken(): Promise<string | null> {
    console.log("🔍 [FcmToken] Requesting token...");
    try {
        // Request permission (Required for iOS, good practice for Android 13+)
        const authStatus = await messaging().requestPermission();
        const enabled = authStatus === messaging.AuthorizationStatus.AUTHORIZED || 
                        authStatus === messaging.AuthorizationStatus.PROVISIONAL;

        console.log("📡 [FcmToken] Permission status:", authStatus);

        if (!enabled) {
            console.error("❌ [FcmToken] Notification permission denied");
            return null;
        }

        // Get the device token
        const token = await messaging().getToken();
        
        if (!token) {
            console.error("❌ [FcmToken] Token was empty");
            return null;
        }

        console.log("✅ [FcmToken] Token generated successfully");
        return token;
    }
    catch (err: any) {
        console.error("❌ [FcmToken] Error getting token:", err.message);
        return null;
    }
}
