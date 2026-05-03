import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, useColorScheme } from 'react-native';
import { Incident } from '../types/incident';
import { StatusBadge } from './StatusBadge';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';

interface IncidentCardProps {
  incident: Incident;
  onPress: () => void;
}

export const IncidentCard: React.FC<IncidentCardProps> = ({ incident, onPress }) => {
  const date = new Date(incident.createdAt).toLocaleDateString();
  const { theme: appTheme } = useTheme();
  const colorScheme = appTheme ?? 'light';
  const theme = Colors[colorScheme];
  const isDark = colorScheme === 'dark';

  return (
    <TouchableOpacity 
      style={[styles.card, { backgroundColor: theme.background, borderColor: isDark ? '#333' : '#F0F0F0' }]} 
      onPress={onPress} 
      activeOpacity={0.7}
    >
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Text style={[styles.title, { color: isDark ? '#fff' : '#1A237E' }]} numberOfLines={1}>
            {incident.title}
          </Text>
          <Text style={[styles.typeText, { color: theme.icon }]}>
            {incident.incidentType.replace('_', ' ')}
          </Text>
        </View>
        <StatusBadge status={incident.status} />
      </View>
      
      <Text style={[styles.description, { color: isDark ? '#CCC' : '#424242' }]} numberOfLines={2}>
        {incident.description}
      </Text>
      
      <View style={[styles.footer, { borderTopColor: isDark ? '#333' : '#F5F5F5' }]}>
        <View style={styles.footerItem}>
          <MaterialCommunityIcons name="map-marker-outline" size={14} color={isDark ? '#AAA' : '#757575'} />
          <Text style={[styles.footerText, { color: isDark ? '#AAA' : '#757575' }]} numberOfLines={1}>
            {incident.locationText}
          </Text>
        </View>
        <Text style={[styles.dateText, { color: theme.icon }]}>{date}</Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
    borderWidth: 1,
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
    fontFamily: 'Inter_700Bold',
  },
  typeText: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    textTransform: 'capitalize',
    marginTop: 2,
  },
  description: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    lineHeight: 20,
    marginBottom: 12,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    paddingTop: 10,
  },
  footerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  footerText: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    marginLeft: 4,
  },
  dateText: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
  },
});

