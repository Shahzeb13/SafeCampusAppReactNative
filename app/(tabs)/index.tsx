import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { incidentService } from '../../services/incidentService';
import { StatusCard } from '../../components/StatusCard';
import { LiveMapCard } from '../../components/LiveMapCard';
import { GridActionCard } from '../../components/GridActionCard';
import { EmergencyButton } from '../../components/EmergencyButton';

export default function HomeScreen() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState({ total: 0, pending: 0, resolved: 0 });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStats = async () => {
    try {
      const incidents = await incidentService.getMyIncidents();
      const total = incidents.length;
      const pending = incidents.filter(i => i.status === 'pending').length;
      const resolved = incidents.filter(i => i.status === 'resolved').length;
      setStats({ total, pending, resolved });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchStats();
  };

  return (
    <View style={styles.container}>
      {/* Custom App Bar */}
      <View style={styles.appBar}>
        {/* <TouchableOpacity style={styles.menuButton}>
          <MaterialCommunityIcons name="menu" size={28} color="#333" />
        </TouchableOpacity> */}
        <View style={styles.logoContainer}>
          <View style={styles.logoIcon}>
            <MaterialCommunityIcons name="shield" size={20} color="white" />
          </View>
          <Text style={styles.logoText}>SafeCampus</Text>
        </View>
        <TouchableOpacity onPress={logout} style={styles.profileButton}>
          <MaterialCommunityIcons name="logout" size={24} color="#FF3B70" />
        </TouchableOpacity>
      </View>

      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#FF3B70']} />
        }
      >
        <StatusCard />
        
        <LiveMapCard />

        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.grid}>
          <GridActionCard
            title="Report"
            subtitle="Submit incident"
            icon="alert-octagon"
            color="#FF3B70"
            onPress={() => router.push('/submit-incident')}
          />
          <GridActionCard
            title="My Reports"
            subtitle="View history"
            icon="file-document-outline"
            color="#673AB7"
            onPress={() => router.push('/my-incidents')}
          />
          <GridActionCard
            title="Emergency"
            subtitle="Rapid response"
            icon="phone-alert"
            color="#F44336"
            onPress={() => router.push('/(tabs)/emergency')}
          />
          <GridActionCard
            title="Safety Tips"
            subtitle="Campus guide"
            icon="shield-check-outline"
            color="#4CAF50"
            onPress={() => router.push('/(tabs)/safety')}
          />
        </View>

        {/* Stats Section */}
        <View style={styles.statsContainer}>
           <View style={styles.statBox}>
             <Text style={styles.statValue}>{stats.total}</Text>
             <Text style={styles.statLabel}>Total</Text>
           </View>
           <View style={styles.statBox}>
             <Text style={[styles.statValue, { color: '#FBC02D' }]}>{stats.pending}</Text>
             <Text style={styles.statLabel}>Pending</Text>
           </View>
           <View style={styles.statBox}>
             <Text style={[styles.statValue, { color: '#4CAF50' }]}>{stats.resolved}</Text>
             <Text style={styles.statLabel}>Resolved</Text>
           </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Fixed Emergency Button at Bottom */}
      <View style={styles.footer}>
        <EmergencyButton onPress={() => router.push('/(tabs)/emergency')} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF9FB',
  },
  appBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 15,
    backgroundColor: 'white',
  },
  menuButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logoIcon: {
    backgroundColor: '#FF4B6C',
    width: 32,
    height: 32,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoText: {
    fontSize: 20,
    fontWeight: '900',
    color: '#1A237E',
    letterSpacing: -0.5,
  },
  profileButton: {
    width: 40,
    height: 40,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  scrollContent: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 20,
    marginBottom: 15,
    paddingLeft: 4,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 24,
    padding: 20,
    marginTop: 10,
    justifyContent: 'space-around',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
  },
  statBox: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1A237E',
  },
  statLabel: {
    fontSize: 12,
    color: '#9E9E9E',
    marginTop: 4,
    fontWeight: '600',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(250, 249, 251, 0.9)',
  },
});
