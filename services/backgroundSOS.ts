import BackgroundService from 'react-native-background-actions';
import { VolumeManager } from 'react-native-volume-manager';
import { ShakeDetectionService } from './ShakeDetectionService';
import { sosService } from './sosService';
import { getUserLocation } from '../utils/locationUtils';
import { SosMessageSendingService } from './SosMessageSendingService';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getLocationPermission } from './locationService';
import { notificationService } from './notificationService';

const options = {
    taskName: 'SafeCampusBackgroundSOS',
    taskTitle: 'SafeCampus Security Service',
    taskDesc: 'SOS Tracking & Shake Detection Active',
    taskIcon: {
        name: 'ic_launcher',
        type: 'mipmap',
    },
    color: '#FF3B70',
    linkingURI: 'safecampus://', 
    parameters: {
        delay: 1000,
    },
};

let lastVolumeChange = 0;
let volumePressCount = 0;
const VOLUME_PRESS_INTERVAL = 2500; // 2.5 seconds to press 3 times (even more lenient)

const backgroundTask = async (taskData: any) => {
    await new Promise(async (resolve) => {
        console.log("🛡️ [BACKGROUND] Service Thread Active");
        
        // Ensure we have permissions even in background
        const hasPermission = await getLocationPermission();
        console.log("🛡️ [BACKGROUND] Location Permission Status:", hasPermission);

        notificationService.sendLocalNotification(
            "SafeCampus Active",
            "Background protection is now monitoring for shakes and volume shortcuts."
        );

        // 1. Start Shake Detection in Background
        ShakeDetectionService.start();

        // 2. Listen for Volume Button Presses (via volume changes)
        const volumeListener = VolumeManager.addVolumeListener((result) => {
            const now = Date.now();
            console.log(`🎚️ [BACKGROUND] Volume Change: ${result.volume.toFixed(2)}`);
            
            if (now - lastVolumeChange < VOLUME_PRESS_INTERVAL) {
                volumePressCount++;
            } else {
                volumePressCount = 1;
            }
            lastVolumeChange = now;

            if (volumePressCount >= 3) {
                console.log("🚨 [BACKGROUND] VOLUME BUTTON SOS TRIGGERED!");
                volumePressCount = 0;
                triggerBackgroundSOS("Volume Button Shortcut");
            }
        });

        // Keep the task running
        while (BackgroundService.isRunning()) {
            await new Promise(r => setTimeout(r, 10000));
        }
        
        volumeListener.remove();
        ShakeDetectionService.stop();
        console.log("🛑 [BACKGROUND] Service Thread Terminated");
    });
};

const triggerBackgroundSOS = async (reason: string) => {
    try {
        console.log(`🚨 [BACKGROUND] Triggering SOS: ${reason}`);
        const location = await getUserLocation();
        
        // 1. Send to Backend
        await sosService.triggerSOS(
            location.latitude,
            location.longitude,
            `Background Trigger: ${reason}`,
            'button'
        );
        console.log("✅ [BACKGROUND] SOS Sent to Backend");

        // 2. Send to WhatsApp if possible
        const contactsStr = await AsyncStorage.getItem('userData'); // Correct key is userData
        if (contactsStr) {
            const userData = JSON.parse(contactsStr);
            if (userData.personalEmergencyContacts?.length > 0) {
                await SosMessageSendingService.sendWhatsAppSos(
                    userData.personalEmergencyContacts,
                    location.latitude,
                    location.longitude
                );
            }
        }
    } catch (error) {
        console.error("❌ [BACKGROUND] Failed to trigger SOS:", error);
    }
};

export const backgroundSOS = {
    start: async () => {
        if (BackgroundService.isRunning()) {
            console.log("🛡️ [BACKGROUND] Service already running");
            return;
        }
        
        const isEnabled = await AsyncStorage.getItem('background_sos_enabled');
        if (isEnabled === 'false') return;

        try {
            console.log("🚀 [BACKGROUND] Attempting to start service...");
            await BackgroundService.start(backgroundTask, options);
        } catch (e) {
            console.error("❌ [BACKGROUND] Error starting service:", e);
        }
    },
    stop: async () => {
        if (!BackgroundService.isRunning()) return;
        await BackgroundService.stop();
    },
    isEnabled: async () => {
        const val = await AsyncStorage.getItem('background_sos_enabled');
        return val !== 'false';
    },
    setEnabled: async (enabled: boolean) => {
        await AsyncStorage.setItem('background_sos_enabled', enabled ? 'true' : 'false');
        if (enabled) {
            await backgroundSOS.start();
        } else {
            await backgroundSOS.stop();
        }
    }
};
