import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Incident } from '../types/incident';
import { StatusBadge } from './StatusBadge';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface IncidentCardProps {
  incident: Incident;
  onPress: () => void;
}

export const IncidentCard: React.FC<IncidentCardProps> = ({ incident, onPress }) => {
  const date = new Date(incident.createdAt).toLocaleDateString();

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Text style={styles.title} numberOfLines={1}>{incident.title}</Text>
          <Text style={styles.typeText}>{incident.incidentType.replace('_', ' ')}</Text>
        </View>
        <StatusBadge status={incident.status} />
      </View>
      
      <Text style={styles.description} numberOfLines={2}>
        {incident.description}
      </Text>
      
      <View style={styles.footer}>
        <View style={styles.footerItem}>
          <MaterialCommunityIcons name="map-marker-outline" size={14} color="#757575" />
          <Text style={styles.footerText} numberOfLines={1}>{incident.locationText}</Text>
        </View>
        <Text style={styles.dateText}>{date}</Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  titleContainer: {
    flex: 1,
    marginRight: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1A237E',
  },
  typeText: {
    fontSize: 12,
    color: '#757575',
    textTransform: 'capitalize',
  },
  description: {
    fontSize: 14,
    color: '#424242',
    lineHeight: 20,
    marginBottom: 12,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F5F5F5',
    paddingTop: 10,
  },
  footerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  footerText: {
    fontSize: 12,
    color: '#757575',
    marginLeft: 4,
  },
  dateText: {
    fontSize: 12,
    color: '#9E9E9E',
  },
});
