import React from 'react';
import { useAuth } from '../../context/AuthContext';
import StudentDashboard from '../../components/StudentDashboard';
import GuardDashboard from '../../components/GuardDashboard';
import { View, ActivityIndicator } from 'react-native';

export default function HomeSwitcher() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#FF3B70" />
      </View>
    );
  }

  // Switch based on role
  if (user?.role === 'security_personnel') {
    return <GuardDashboard />;
  }

  // Default to Student/Staff dashboard
  return <StudentDashboard />;
}
