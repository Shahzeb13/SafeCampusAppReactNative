import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';

export const unstable_settings = {
  anchor: '(tabs)',
};

import { SnackbarProvider } from '../context/SnackbarContext';
import { AuthProvider } from '../context/AuthContext';

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <SnackbarProvider>
        <AuthProvider>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="login" />
            <Stack.Screen name="register" />
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="submit-incident" options={{ title: 'Report Incident' }} />
            <Stack.Screen name="my-incidents" options={{ title: 'My Reports' }} />
            <Stack.Screen name="incident/[id]" options={{ title: 'Incident Details' }} />
            <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
          </Stack>
        </AuthProvider>
        <StatusBar style="auto" />
      </SnackbarProvider>
    </ThemeProvider>
  );
}
