// Route: incident/[id]
import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  ActivityIndicator,
  Image
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { incidentService } from '../../services/incidentService';
import { Incident } from '../../types/incident';
import { StatusBadge } from '../../components/StatusBadge';

export default function IncidentDetailScreen() {
  const { id } = useLocalSearchParams();
  const [incident, setIncident] = useState<Incident | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (id) fetchIncident();
  }, [id]);

  const fetchIncident = async () => {
    try {
      const data = await incidentService.getIncidentById(id as string);
      setIncident(data);
    } catch (error) {
      console.error('Error fetching incident detail:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#FF3B70" />
      </View>
    );
  }

  if (!incident) {
    return (
      <View style={styles.center}>
        <Text>Incident not found</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={{ color: '#FF3B70', marginTop: 10 }}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#1A237E" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Report Details</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.card}>
        <View style={styles.statusRow}>
          <StatusBadge status={incident.status} />
          <Text style={styles.dateText}>{new Date(incident.createdAt).toLocaleString()}</Text>
        </View>

        <Text style={styles.title}>{incident.title}</Text>
        <View style={styles.typeTag}>
          <MaterialCommunityIcons name="tag-outline" size={14} color="#FF3B70" />
          <Text style={styles.typeText}>{incident.incidentType.replace('_', ' ')}</Text>
        </View>

        <View style={styles.divider} />

        <Text style={styles.label}>Location</Text>
        <View style={styles.infoRow}>
          <MaterialCommunityIcons name="map-marker" size={18} color="#FF3B70" />
          <Text style={styles.infoValue}>{incident.locationText}</Text>
        </View>
        {(incident.latitude && incident.longitude) && (
           <Text style={styles.coordsText}>
             Coords: {incident.latitude.toFixed(4)}, {incident.longitude.toFixed(4)}
           </Text>
        )}

        <View style={styles.divider} />

        <Text style={styles.label}>Description</Text>
        <Text style={styles.description}>{incident.description}</Text>

        {incident.mediaUrls && incident.mediaUrls.length > 0 && (
          <>
            <View style={styles.divider} />
            <Text style={styles.label}>Attachments</Text>
            <View style={styles.mediaGrid}>
              {incident.mediaUrls.map((url, index) => (
                <View key={index} style={styles.mediaItem}>
                   <MaterialCommunityIcons name="image" size={40} color="#E0E0E0" />
                </View>
              ))}
            </View>
          </>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  content: {
    paddingBottom: 30,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 50,
    backgroundColor: 'white',
    marginBottom: 15,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1A237E',
  },
  card: {
    backgroundColor: 'white',
    margin: 15,
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  dateText: {
    fontSize: 12,
    color: '#9E9E9E',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1A237E',
    marginBottom: 10,
  },
  typeTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF5F7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginBottom: 20,
  },
  typeText: {
    fontSize: 13,
    color: '#FF3B70',
    fontWeight: '600',
    marginLeft: 5,
    textTransform: 'capitalize',
  },
  divider: {
    height: 1,
    backgroundColor: '#F5F5F5',
    marginVertical: 15,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: '#424242',
    marginBottom: 8,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoValue: {
    fontSize: 16,
    color: '#616161',
    marginLeft: 8,
  },
  coordsText: {
    fontSize: 12,
    color: '#9E9E9E',
    marginLeft: 26,
    marginTop: 4,
  },
  description: {
    fontSize: 15,
    color: '#616161',
    lineHeight: 24,
  },
  mediaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 10,
  },
  mediaItem: {
    width: 80,
    height: 80,
    borderRadius: 10,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  }
});
