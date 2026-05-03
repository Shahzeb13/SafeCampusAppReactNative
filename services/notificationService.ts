import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Configure how notifications are handled when the app is in the foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export const notificationService = {
  /**
   * Initialize and request permissions
   */
  init: async () => {
    if (Platform.OS === 'web') return;

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.warn('Failed to get push token for push notification!');
      return false;
    }

    if (Platform.OS === 'android') {
      Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }

    return true;
  },

  /**
   * Trigger a local notification immediately
   */
  sendLocalNotification: async (title: string, body: string, data?: any) => {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data: data || {},
          sound: 'default',
          priority: Notifications.AndroidNotificationPriority.HIGH,
        },
        trigger: null, // Trigger immediately
      });
    } catch (error) {
      console.error('Error sending local notification:', error);
    }
  },

  /**
   * Notify user of a successful interaction
   */
  notifySuccess: async (action: string, details?: string) => {
    await notificationService.sendLocalNotification(
      'Action Successful ✅',
      details || `${action} has been completed successfully.`
    );
  },

  /**
   * Notify user of an error or warning
   */
  notifyError: async (title: string, message: string) => {
    await notificationService.sendLocalNotification(
      `⚠️ ${title}`,
      message
    );
  },

  /**
   * Special notification for Emergency/SOS actions
   */
  notifyEmergency: async (title: string, message: string) => {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: `🚨 ${title}`,
        body: message,
        sound: 'default',
        priority: Notifications.AndroidNotificationPriority.MAX,
        sticky: true,
      },
      trigger: null,
    });
  },
};
