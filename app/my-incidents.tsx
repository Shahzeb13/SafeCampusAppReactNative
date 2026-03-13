// Route: my-incidents
import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  ActivityIndicator,
  RefreshControl
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { incidentService } from '../services/incidentService';
import { Incident } from '../types/incident';
import { IncidentCard } from '../components/IncidentCard';

export default function MyIncidentsScreen() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();

  const fetchIncidents = async () => {
    try {
      const data = await incidentService.getMyIncidents();
      setIncidents(data);
    } catch (error) {
      console.error('Error fetching incidents:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchIncidents();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchIncidents();
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#FF3B70" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#1A237E" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Reports</Text>
        <View style={{ width: 24 }} />
      </View>

      <FlatList
        data={incidents}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => (
          <IncidentCard 
            incident={item} 
            onPress={() => router.push(`/incident/${item._id}`)} 
          />
        )}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#FF3B70']} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="file-search-outline" size={80} color="#E0E0E0" />
            <Text style={styles.emptyText}>No incidents reported yet</Text>
            <TouchableOpacity 
              style={styles.reportButton}
              onPress={() => router.push('/submit-incident')}
            >
              <Text style={styles.reportButtonText}>REPORT NOW</Text>
            </TouchableOpacity>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
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
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1A237E',
  },
  listContent: {
    padding: 15,
    flexGrow: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 100,
  },
  emptyText: {
    fontSize: 16,
    color: '#9E9E9E',
    marginTop: 20,
    marginBottom: 30,
  },
  reportButton: {
    backgroundColor: '#FF3B70',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 25,
  },
  reportButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
});
