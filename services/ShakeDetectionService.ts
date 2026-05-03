import { Accelerometer } from 'expo-sensors';
import { sosService } from './sosService';
import { getUserLocation } from '../utils/locationUtils';
import * as Haptics from 'expo-haptics';
import { notificationService } from './notificationService';

let subscription: any = null;
let lastTriggerTime = 0;
const TRIGGER_COOLDOWN = 10000; // 10 seconds cooldown
const G_FORCE_THRESHOLD = 2.8; // Trigger on 2.8G+ forces (easier to trigger)

/**
 * Service to detect violent phone movement (G-Force > 4) and automatically trigger SOS.
 * This is useful for hands-free emergency alerts when the user cannot physically press the button.
 */
export const ShakeDetectionService = {
  /**
   * Start listening to accelerometer data.
   * @param onTrigger Optional callback to execute when SOS is successfully triggered.
   */
  start: (onTrigger?: (data: any) => void) => {
    if (subscription) {
        console.log("📡 ShakeDetectionService: Already running");
        return;
    }

    console.log("🚀 ShakeDetectionService: Starting monitoring (Threshold: 4G)");

    // Set high frequency for accurate shake detection
    Accelerometer.setUpdateInterval(100); 

    subscription = Accelerometer.addListener(async (data) => {
      const { x, y, z } = data;
      
      // Calculate total acceleration (G-Force)
      // Normal gravity is 1G (sqrt(x^2 + y^2 + z^2) ≈ 1 when stationary)
      const gForce = Math.sqrt(x * x + y * y + z * z);

      // LOGS FOR DEBUGGING (Visible in Metro Bundler / Terminal)
      if (gForce > 1.5) {
        console.log(`📳 Shake Activity: ${gForce.toFixed(2)}G`);
      }

      if (gForce > G_FORCE_THRESHOLD) {
        const currentTime = Date.now();
        
        // Cooldown check to prevent multiple triggers for the same event
        if (currentTime - lastTriggerTime > TRIGGER_COOLDOWN) {
          lastTriggerTime = currentTime;
          
          console.log(`⚠️ VIOLENT SHAKE DETECTED: ${gForce.toFixed(2)}G`);
          
          try {
            // 1. Give immediate haptic feedback
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);

            // 2. Notify the user via local notification that SOS is being sent
            notificationService.sendLocalNotification(
              "🚨 Emergency SOS Triggered!",
              "Violent movement detected. Sending your location to security..."
            );

            // 3. Get precise GPS location
            const location = await getUserLocation();
            
            // 4. Dispatch the SOS to the Command Center
            const response = await sosService.triggerSOS(
              location.latitude, 
              location.longitude, 
              `Automatic SOS: Violent shake detected (${gForce.toFixed(2)}G)`,
              'shake'
            );

            console.log("✅ Automatic SOS successfully dispatched");

            if (onTrigger) {
              onTrigger(response);
            }
          } catch (error) {
            console.error('❌ Failed to trigger automatic SOS:', error);
            
            notificationService.sendLocalNotification(
              "⚠️ SOS Trigger Failed",
              "We detected an emergency but couldn't reach the server. Please try the manual button."
            );
          }
        }
      }
    });
  },

  /**
   * Stop monitoring accelerometer data.
   */
  stop: () => {
    if (subscription) {
      console.log("🛑 ShakeDetectionService: Stopping monitoring");
      subscription.remove();
      subscription = null;
    }
  }
};
