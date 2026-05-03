import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  ActivityIndicator,
  RefreshControl,
  SafeAreaView
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { incidentService } from '../services/incidentService';
import { Incident } from '../types/incident';
import { IncidentCard } from '../components/IncidentCard';
import { Colors } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';

export default function MyIncidentsScreen() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();
  
  const { theme: appTheme } = useTheme();
  const colorScheme = appTheme ?? 'light';
  const theme = Colors[colorScheme];
  const isDark = colorScheme === 'dark';

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
      <View style={[styles.center, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color="#FF3B70" />
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: isDark ? '#000' : '#F8F9FA' }]}>
      <View style={[styles.header, { backgroundColor: theme.background, borderBottomColor: isDark ? '#333' : '#F0F0F0' }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>My Reports</Text>
        <View style={{ width: 40 }} />
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
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh} 
            colors={['#FF3B70']} 
            tintColor={isDark ? '#fff' : '#FF3B70'}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="file-search-outline" size={80} color={isDark ? '#333' : '#E0E0E0'} />
            <Text style={[styles.emptyText, { color: theme.icon }]}>No incidents reported yet</Text>
            <TouchableOpacity 
              style={styles.reportButton}
              onPress={() => router.push('/submit-incident')}
            >
              <Text style={styles.reportButtonText}>REPORT NOW</Text>
            </TouchableOpacity>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: 'Outfit_700Bold',
  },
  listContent: {
    padding: 20,
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
    fontFamily: 'Inter_400Regular',
    marginTop: 20,
    marginBottom: 30,
  },
  reportButton: {
    backgroundColor: '#FF3B70',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 25,
    elevation: 4,
    shadowColor: '#FF3B70',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  reportButtonText: {
    color: 'white',
    fontFamily: 'Inter_700Bold',
    letterSpacing: 0.5,
  },
});

