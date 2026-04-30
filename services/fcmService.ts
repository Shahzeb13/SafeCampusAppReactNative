import messaging from '@react-native-firebase/messaging';
import { fcmToken as getFcmToken } from '../utils/FcmToken';
import axios from 'axios';
import { API_BASE_URL } from '../config/api';

type UserId = string;
type Token = string;

type FcmServiceType = {
  init: (userId: UserId) => Promise<void>;
  cleanup: () => void;
  onMessage: (callback: (remoteMessage: any) => void) => void;
};

const FcmService = (() => {
  let listener: (() => void) | null = null;
  let messageCallback: ((remoteMessage: any) => void) | null = null;

  // send token to backend
  const sendTokenToBackend = async (
    userId: UserId,
    token: Token
  ): Promise<void> => {
    try {
      await axios.post(`${API_BASE_URL}/users/save-fcm-token`, {
        userId,
        token,
      });

      console.log('✅ Token sent to backend');
    } catch (err: any) {
      console.log('❌ Error sending token:', err.message);
    }
  };

  // init fcm flow
  const init = async (userId: UserId): Promise<void> => {
    console.log('🚀 FCM Service Initializing for user:', userId);
    try {
      const authStatus = await messaging().requestPermission();
      console.log('📡 Permission status:', authStatus);

      const token: Token | null = await getFcmToken();
      console.log('🔑 Fetched Token:', token ? 'YES (truncated)' : 'NULL');

      if (token) {
        console.log('📤 Attempting to send token to backend...');
        await sendTokenToBackend(userId, token);
      } else {
        console.warn('⚠️ No token retrieved, skipping backend sync');
      }

      // remove old listener if exists
      if (listener) listener();

      listener = messaging().onTokenRefresh(async (newToken: Token) => {
        console.log('🔄 Token refreshed by Firebase:', newToken);
        await sendTokenToBackend(userId, newToken);
      });

      // Handle Foreground Messages
      messaging().onMessage(async (remoteMessage) => {
        console.log('📱 Foreground FCM Message received:', remoteMessage);
        if (messageCallback) {
          messageCallback(remoteMessage);
        }
      });
    } catch (err: any) {
      console.error('❌ FCM init error:', err.message);
    }
  };

  const onMessage = (callback: (remoteMessage: any) => void): void => {
    messageCallback = callback;
  };

  // cleanup listener
  const cleanup = (): void => {
    if (listener) listener();
    listener = null;
    messageCallback = null;
  };

  return {
    init,
    cleanup,
    onMessage,
  } as FcmServiceType;
})();

export default FcmService;