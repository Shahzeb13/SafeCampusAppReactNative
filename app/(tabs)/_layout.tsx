import { Tabs } from 'expo-router';
import React from 'react';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#FF3B70',
        headerShown: true,
        headerStyle: { backgroundColor: '#fff' },
        headerTitleStyle: { fontWeight: 'bold' },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'SafeCampus',
          tabBarLabel: 'Home',
          tabBarIcon: ({ color }) => <MaterialCommunityIcons size={28} name="home" color={color} />,
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          title: 'Notifications',
          tabBarIcon: ({ color }) => <MaterialCommunityIcons size={28} name="bell" color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => <MaterialCommunityIcons size={28} name="account" color={color} />,
        }}
      />
    </Tabs>
  );
}
