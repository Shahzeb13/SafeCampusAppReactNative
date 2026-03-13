import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { IncidentStatus } from '../types/incident';

interface StatusBadgeProps {
  status: IncidentStatus;
}

const statusColors: Record<IncidentStatus, string> = {
  pending: '#FBC02D',
  under_review: '#2196F3',
  assigned: '#9C27B0',
  resolved: '#4CAF50',
  rejected: '#F44336',
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  return (
    <View style={[styles.badge, { backgroundColor: statusColors[status] + '20' }]}>
      <View style={[styles.dot, { backgroundColor: statusColors[status] }]} />
      <Text style={[styles.text, { color: statusColors[status] }]}>
        {status.replace('_', ' ').toUpperCase()}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  text: {
    fontSize: 10,
    fontWeight: 'bold',
  },
});
