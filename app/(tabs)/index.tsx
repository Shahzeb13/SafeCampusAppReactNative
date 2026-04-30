import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Platform } from 'react-native';
import { Accelerometer } from 'expo-sensors';
import * as Haptics from 'expo-haptics';
import { useAuth } from '../../context/AuthContext';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { incidentService } from '../../services/incidentService';
import { StatusCard } from '../../components/StatusCard';
import { LiveMapCard } from '../../components/LiveMapCard';
import  MapLive  from '../../components/Map';
import { GridActionCard } from '../../components/GridActionCard';
import { EmergencyButton } from '../../components/EmergencyButton';
import { SOSModal } from '../../components/SOSModal';
import axios from 'axios';
import { API_BASE_URL } from '../../config/api';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';

function HomeScreen() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState({ total: 0, pending: 0, resolved: 0 });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sosVisible, setSosVisible] = useState(false);
  const [isShakeTriggered, setIsShakeTriggered] = useState(false);
  const [showMap, setShowMap] = useState<boolean>(true);
  const [isServerConnected, setIsServerConnected] = useState(false);
  const [monitoringActive, setMonitoringActive] = useState(true);

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
    checkConnection();
  };

  const checkConnection = async () => {
    try {
      await axios.get(`${API_BASE_URL}/sos/active`, { timeout: 3000 });
      setIsServerConnected(true);
    } catch (err) {
      setIsServerConnected(false);
    }
  };

  useEffect(() => {
    let interval: any;
    if (monitoringActive) {
      checkConnection();
      interval = setInterval(checkConnection, 10000);
    } else {
      setIsServerConnected(false);
    }
    return () => clearInterval(interval);
  }, [monitoringActive]);

  useEffect(() => {
    let subscription: any;
    
    const startShakeDetection = async () => {
      // High threshold for safety (8.0+ is a very violent shake)
      const SHAKE_THRESHOLD = 8.0; 
      let lastUpdate = 0;

      subscription = Accelerometer.addListener(accelerometerData => {
        const { x, y, z } = accelerometerData;
        const acceleration = Math.sqrt(x * x + y * y + z * z);
        const currTime = Date.now();

        // Log for debugging (remove in production)
        if (acceleration > 1.2) {
          console.log(`Shake detected! Force: ${acceleration.toFixed(2)}`);
        }

        if (acceleration > SHAKE_THRESHOLD && (currTime - lastUpdate) > 2000) {
          console.log("🔥 VIOLENT SHAKE DETECTED! Triggering SOS...");
          lastUpdate = currTime;
          handleShakeSOS();
        }
      });

      Accelerometer.setUpdateInterval(100);
    };

    const handleShakeSOS = () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      setIsShakeTriggered(true);
      setSosVisible(true);
    };

    startShakeDetection();

    return () => {
      if (subscription) subscription.remove();
    };
  }, []);

  const handleCloseSOS = () => {
    setSosVisible(false);
    setIsShakeTriggered(false);
  };

  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];

  return (
    <View style={[styles.container, { backgroundColor: colorScheme === 'dark' ? '#000' : '#FAF9FB' }]}>
      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#FF3B70']} tintColor="#FF3B70" />
        }
      >
        <StatusCard />
        
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Safety Overview</Text>
          <TouchableOpacity 
            style={[styles.mapToggleButton, { backgroundColor: theme.background }]} 
            onPress={() => setShowMap(!showMap)}
          >
            <MaterialCommunityIcons 
              name={showMap ? "map-check" : "map-outline"} 
              size={20} 
              color={showMap ? "#FF3B70" : theme.icon} 
            />
            <Text style={[styles.mapToggleText, { color: theme.icon }, showMap && { color: "#FF3B70" }]}>
              {showMap ? 'Hide Map' : 'Show Map'}
            </Text>
          </TouchableOpacity>
        </View>

        {showMap && <MapLive mapStyle={'https://tiles.openfreemap.org/styles/liberty'} />}

        <Text style={[styles.sectionTitle, { color: theme.text }]}>Quick Actions</Text>
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
            title="Emergency Contacts"
            subtitle="Close People"
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
        <View style={[styles.statsContainer, { backgroundColor: theme.background }]}>
           <View style={styles.statBox}>
             <Text style={[styles.statValue, { color: colorScheme === 'dark' ? '#FFF' : '#1A237E' }]}>{stats.total}</Text>
             <Text style={[styles.statLabel, { color: theme.icon }]}>Total</Text>
           </View>
           <View style={styles.statBox}>
             <Text style={[styles.statValue, { color: '#FBC02D' }]}>{stats.pending}</Text>
             <Text style={[styles.statLabel, { color: theme.icon }]}>Pending</Text>
           </View>
           <View style={styles.statBox}>
             <Text style={[styles.statValue, { color: '#4CAF50' }]}>{stats.resolved}</Text>
             <Text style={[styles.statLabel, { color: theme.icon }]}>Resolved</Text>
           </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      <SOSModal 
        visible={sosVisible} 
        onClose={handleCloseSOS} 
        autoTrigger={isShakeTriggered} 
      />

      {/* Fixed Emergency Button at Bottom */}
      <View style={[styles.footer, { backgroundColor: colorScheme === 'dark' ? 'rgba(0,0,0,0.8)' : 'rgba(250, 249, 251, 0.9)' }]}>
        <EmergencyButton onPress={() => setSosVisible(true)} />
      </View>
    </View>
  );
}


export default HomeScreen;
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
  appBarRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  connectionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  connectionText: {
    fontSize: 11,
    color: '#666',
    fontFamily: 'Inter_500Medium',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 5,
  },
  mapToggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'white',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    elevation: 1,
  },
  mapToggleText: {
    fontSize: 12,
    fontFamily: 'Outfit_600SemiBold',
    color: '#666',
  },
});
