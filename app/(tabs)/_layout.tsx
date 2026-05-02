import { Tabs } from 'expo-router';
import React from 'react';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';
import { View, StyleSheet, Platform } from 'react-native';
import { useAuth } from '../../context/AuthContext';

export default function TabLayout() {
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];
  const { user } = useAuth();

  const isGuard = user?.role === 'security_personnel';

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#FF3B70',
        tabBarInactiveTintColor: theme.icon,
        headerShown: false,
        tabBarStyle: {
          backgroundColor: theme.background,
          borderTopWidth: 0,
          elevation: 0,
          height: Platform.OS === 'ios' ? 88 : 68,
          paddingBottom: Platform.OS === 'ios' ? 30 : 12,
          paddingTop: 8,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: colorScheme === 'dark' ? 0.4 : 0.05,
          shadowRadius: 10,
        },
        tabBarLabelStyle: {
          fontFamily: 'Inter_500Medium',
          fontSize: 12,
          marginTop: -4,
        },
        headerStyle: { backgroundColor: theme.background },
        headerTitleStyle: { fontWeight: 'bold', fontFamily: 'Outfit_700Bold', color: theme.text },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: isGuard ? 'Duty' : 'Home',
          href: undefined, // Always show the first tab
          tabBarIcon: ({ color, focused }) => (
            <View style={focused ? styles.activeIconContainer : null}>
              <MaterialCommunityIcons 
                size={28} 
                name={isGuard 
                  ? (focused ? "shield-account" : "shield-account-outline")
                  : (focused ? "home" : "home-outline")
                } 
                color={color} 
              />
            </View>
          ),
        }}
      />
      {/* Hide guard-dashboard tab as it's now the root index for guards */}
      <Tabs.Screen
        name="guard-dashboard"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="safety"
        options={{
          title: 'Safety',
          href: isGuard ? null : undefined, // hide from guards
          tabBarIcon: ({ color, focused }) => (
            <View style={focused ? styles.activeIconContainer : null}>
              <MaterialCommunityIcons size={28} name={focused ? "shield-check" : "shield-check-outline"} color={color} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="heatmaps"
        options={{
          title: 'Radar',
          // Keep heatmaps visible for guards as requested
          tabBarIcon: ({ color, focused }) => (
            <View style={focused ? styles.activeIconContainer : null}>
              <MaterialCommunityIcons size={28} name={focused ? "radar" : "radar"} color={color} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="emergency"
        options={{
          title: 'SOS',
          href: isGuard ? null : undefined,
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.sosIconContainer, focused && styles.sosIconActive]}>
              <MaterialCommunityIcons size={32} name="phone-alert" color="white" />
            </View>
          ),
          tabBarLabel: () => null, // Hide label for SOS
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          title: 'Alerts',
          href: isGuard ? null : undefined,
          tabBarIcon: ({ color, focused }) => (
            <View style={focused ? styles.activeIconContainer : null}>
              <MaterialCommunityIcons size={28} name={focused ? "bell" : "bell-outline"} color={color} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, focused }) => (
            <View style={focused ? styles.activeIconContainer : null}>
              <MaterialCommunityIcons size={28} name={focused ? "account" : "account-outline"} color={color} />
            </View>
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  activeIconContainer: {
    // Optional: add a subtle background circle for active icons
  },
  sosIconContainer: {
    backgroundColor: '#FF3B70',
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: -20, // Float effect
    shadowColor: '#FF3B70',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  sosIconActive: {
    transform: [{ scale: 1.1 }],
    backgroundColor: '#E63462',
  },
});
