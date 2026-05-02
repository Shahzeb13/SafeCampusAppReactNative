import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types/user';
import { setAuthToken } from '../services/api';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import FcmService from '../services/fcmService';
import { useSnackbar } from './SnackbarContext';

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (userData: User, token: string) => void;
  logout: () => void;
  updateUser: (userData: User) => void;
  isAuthenticated: boolean;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const { showSnackbar } = useSnackbar();

  useEffect(() => {
    loadStoredAuth();
    
    // Set up stylish foreground notification listener
    FcmService.onMessage((remoteMessage) => {
      if (remoteMessage.notification) {
        showSnackbar(
          remoteMessage.notification.body || remoteMessage.notification.title || "New update received", 
          'info'
        );
      }
    });
  }, []);

  const loadStoredAuth = async () => {
    try {
      const storedToken = await AsyncStorage.getItem('userToken');
      const storedUser = await AsyncStorage.getItem('userData');
      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
        setAuthToken(storedToken);
        console.log("🔑 [FRONTEND] Persistent JWT Token:", storedToken);
        
        // Init FCM
        const userObj = JSON.parse(storedUser);
        if (userObj.id) {
          FcmService.init(userObj.id);
        }
      }
    } catch (error) {
      console.error('Failed to load auth state', error);
    } finally {
      setLoading(false);
    }
  };

  const login = async (userData: User, authToken: string) => {
    setUser(userData);
    setToken(authToken);
    setAuthToken(authToken);
    console.log("🔑 [FRONTEND] Login JWT Token:", authToken);
    try {
      await AsyncStorage.setItem('userToken', authToken);
      await AsyncStorage.setItem('userData', JSON.stringify(userData));
      
      // Init FCM
      if (userData.id) {
        console.log("🏁 AuthContext: Triggering FCM Init for", userData.username);
        FcmService.init(userData.id);
      } else {
        console.warn("🏁 AuthContext: Skipping FCM Init - No User ID found");
      }
    } catch (error) {
      console.error('Failed to save auth state', error);
    }
  };

  const logout = async () => {
    setUser(null);
    setToken(null);
    setAuthToken(null);
    try {
      // Cleanup FCM
      if (user?.id) {
        await FcmService.removeToken(user.id);
      }
      FcmService.cleanup();
      
      
      await AsyncStorage.removeItem('userToken');
      await AsyncStorage.removeItem('userData');
      router.push("/login")
    } catch (error) {
      console.error('Failed to clear auth state', error);
    }
  };

  const updateUser = async (userData: User) => {
    setUser(userData);
    try {
      await AsyncStorage.setItem('userData', JSON.stringify(userData));
    } catch (error) {
      console.error('Failed to update user state', error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, updateUser, isAuthenticated: !!token, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
