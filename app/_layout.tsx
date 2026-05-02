import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts, Inter_400Regular, Inter_500Medium, Inter_700Bold } from '@expo-google-fonts/inter';
import { Outfit_400Regular, Outfit_600SemiBold, Outfit_700Bold } from '@expo-google-fonts/outfit';



import { useColorScheme } from '@/hooks/use-color-scheme';
import { SnackbarProvider } from '../context/SnackbarContext';
import { AuthProvider } from '../context/AuthContext';
import { ThemeProvider as AppThemeProvider, useTheme } from '../context/ThemeContext';
import { notificationService } from '../services/notificationService';
import * as Notifications from 'expo-notifications';

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  return (
    <AppThemeProvider>
      <LayoutContent />
    </AppThemeProvider>
  );
}

function LayoutContent() {
  const { theme } = useTheme();

  const [loaded, error] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_700Bold,
    Outfit_400Regular,
    Outfit_600SemiBold,
    Outfit_700Bold,
  });

  useEffect(() => {
    if (loaded || error) {
      SplashScreen.hideAsync();
      notificationService.requestPermissions();
    }
  }, [loaded, error]);

  if (!loaded && !error) {
    return null;
  }

  const CustomDefaultTheme = {
    ...DefaultTheme,
    colors: {
      ...DefaultTheme.colors,
      background: 'white',
    },
  };

  return (
    <ThemeProvider value={theme === 'dark' ? DarkTheme : CustomDefaultTheme}>
      <SnackbarProvider>
        <AuthProvider>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" options={{ headerShown: false }} />
            <Stack.Screen name="login" options={{ headerShown: false }} />
            <Stack.Screen name="register" options={{ headerShown: false }} />
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="submit-incident" options={{ headerShown: false }} />
            <Stack.Screen name="my-incidents" options={{ headerShown: false }} />
            <Stack.Screen name="incident/[id]" options={{ headerShown: false }} />
            <Stack.Screen name="modal" options={{ presentation: 'modal', headerShown: false }} />
          </Stack>
        </AuthProvider>
        <StatusBar style="auto" />
      </SnackbarProvider>
    </ThemeProvider>
  );
}

