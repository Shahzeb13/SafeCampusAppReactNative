import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  SafeAreaView,
  Linking,
  Platform,
  Modal,
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { sosService, SOSHistoryItem } from '../services/sosService';
import { useSnackbar } from '../context/SnackbarContext';
import { handleApiError } from '../utils/errorHandling';

const TimelineStep = ({ 
  icon, 
  color, 
  label, 
  time, 
  isFirst = false, 
  isLast = false, 
  isActive = false 
}: any) => (
  <View style={styles.stepContainer}>
    <View style={styles.leftLineContainer}>
      {!isFirst && <View style={[styles.verticalLine, isActive && { backgroundColor: color }]} />}
      <View style={[styles.stepIconContainer, { backgroundColor: isActive ? color : '#E0E0E0' }]}>
        <MaterialCommunityIcons name={icon} size={14} color="white" />
      </View>
      {!isLast && <View style={[styles.verticalLine, isActive && { backgroundColor: color }]} />}
    </View>
    <View style={styles.stepContent}>
      <Text style={[styles.stepLabel, isActive && { color: '#333' }]}>{label}</Text>
      <Text style={styles.stepTime}>{time}</Text>
    </View>
  </View>
);

export default function SOSHistoryScreen() {
  const [history, setHistory] = useState<SOSHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number, lng: number } | null>(null);
  const router = useRouter();
  const { showSnackbar } = useSnackbar();

  const fetchSOSHistory = async () => {
    try {
      const data = await sosService.getSOSHistory();
      setHistory(data);
    } catch (error) {
      handleApiError(error, showSnackbar);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchSOSHistory();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchSOSHistory();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return '#FF3B30';
      case 'acknowledged': return '#FF9800';
      case 'responding': return '#2196F3';
      case 'resolved': return '#4CAF50';
      default: return '#666';
    }
  };

  const openInMaps = (lat: number, lng: number) => {
    setSelectedLocation({ lat, lng });
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return null;
    return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const renderSOSItem = ({ item }: { item: SOSHistoryItem }) => (
    <View style={styles.sosCard}>
      <View style={styles.cardHeader}>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '15' }]}>
          <View style={[styles.statusDot, { backgroundColor: getStatusColor(item.status) }]} />
          <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
            {item.status.toUpperCase()}
          </Text>
        </View>
        <Text style={styles.dateText}>
          {new Date(item.createdAt).toLocaleDateString()} {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </View>

      <View style={styles.cardContent}>
        <View style={styles.infoRow}>
          <MaterialCommunityIcons name="map-marker" size={20} color="#1A237E" />
          <Text style={styles.infoText}>
            {item.location.latitude.toFixed(6)}, {item.location.longitude.toFixed(6)}
          </Text>
        </View>
        
        {item.note && (
          <View style={styles.noteBox}>
            <Text style={styles.noteLabel}>Note:</Text>
            <Text style={styles.noteText}>{item.note}</Text>
          </View>
        )}

        {/* Modern Vertical Timeline */}
        <View style={styles.modernTimeline}>
          <TimelineStep 
            icon="bell-ring" 
            color="#FF3B30" 
            label="Triggered" 
            time={formatDate(item.createdAt)} 
            isFirst 
            isActive
          />
          {item.acknowledgedAt && (
            <TimelineStep 
              icon="eye-check" 
              color="#FF9800" 
              label="Seen by Security" 
              time={formatDate(item.acknowledgedAt)} 
              isActive
            />
          )}
          {item.respondedAt && (
            <TimelineStep 
              icon="truck-fast" 
              color="#2196F3" 
              label="Help Dispatched" 
              time={formatDate(item.respondedAt)} 
              isActive
            />
          )}
          {item.resolvedAt && (
            <TimelineStep 
              icon="check-decagram" 
              color="#4CAF50" 
              label="Resolved" 
              time={formatDate(item.resolvedAt)} 
              isLast
              isActive
            />
          )}
        </View>
      </View>

      <View style={styles.cardFooter}>
         <TouchableOpacity 
            style={styles.mapLink}
            onPress={() => openInMaps(item.location.latitude, item.location.longitude)}
         >
            <View style={styles.mapIconCircle}>
               <MaterialCommunityIcons name="google-maps" size={18} color="white" />
            </View>
            <Text style={styles.mapLinkText}>Navigate to Location</Text>
            <MaterialCommunityIcons name="chevron-right" size={18} color="#1A237E" />
         </TouchableOpacity>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#FF3B30" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#1A237E" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>SOS History</Text>
        <View style={{ width: 40 }} />
      </View>

      <FlatList
        data={history}
        keyExtractor={(item) => item._id}
        renderItem={renderSOSItem}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#FF3B30']} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="shield-off-outline" size={80} color="#E0E0E0" />
            <Text style={styles.emptyText}>No SOS alerts recorded</Text>
          </View>
        }
      />

      {/* In-App Map Modal */}
      <Modal
        visible={!!selectedLocation}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setSelectedLocation(null)}
      >
        <SafeAreaView style={{ flex: 1 }}>
          <View style={styles.mapHeader}>
            <TouchableOpacity onPress={() => setSelectedLocation(null)} style={styles.backButton}>
              <MaterialCommunityIcons name="close" size={28} color="#1A237E" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>SOS Location</Text>
            <View style={{ width: 40 }} />
          </View>
          
          {selectedLocation && (
            <MapView
              style={{ flex: 1 }}
              provider={PROVIDER_GOOGLE}
              initialRegion={{
                latitude: selectedLocation.lat,
                longitude: selectedLocation.lng,
                latitudeDelta: 0.005,
                longitudeDelta: 0.005,
              }}
            >
              <Marker
                coordinate={{
                  latitude: selectedLocation.lat,
                  longitude: selectedLocation.lng,
                }}
                title="SOS Triggered Here"
                pinColor="#FF3B30"
              />
            </MapView>
          )}
          
          <TouchableOpacity 
            style={styles.floatingClose} 
            onPress={() => setSelectedLocation(null)}
          >
            <Text style={styles.closeBtnText}>Close Map</Text>
          </TouchableOpacity>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
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
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: 'white',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: 'Outfit_700Bold',
    color: '#1A237E',
  },
  listContent: {
    padding: 20,
    gap: 16,
    flexGrow: 1,
  },
  sosCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 12,
    fontFamily: 'Inter_700Bold',
  },
  dateText: {
    fontSize: 12,
    color: '#666',
    fontFamily: 'Inter_500Medium',
  },
  cardContent: {
    gap: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoText: {
    fontSize: 15,
    color: '#333',
    fontFamily: 'Inter_500Medium',
  },
  noteBox: {
    backgroundColor: '#F5F6F9',
    padding: 12,
    borderRadius: 12,
  },
  noteLabel: {
    fontSize: 12,
    color: '#666',
    fontFamily: 'Inter_700Bold',
    marginBottom: 4,
  },
  noteText: {
    fontSize: 14,
    color: '#444',
    fontFamily: 'Inter_400Regular',
  },
  cardFooter: {
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  mapLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0F2F5',
    paddingVertical: 10,
    borderRadius: 12,
    gap: 8,
  },
  mapIconCircle: {
    backgroundColor: '#34A853',
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapLinkText: {
    fontSize: 14,
    color: '#1A237E',
    fontFamily: 'Outfit_600SemiBold',
    flex: 1,
    marginLeft: 4,
  },
  modernTimeline: {
    marginTop: 15,
    paddingLeft: 5,
  },
  stepContainer: {
    flexDirection: 'row',
    height: 45,
  },
  leftLineContainer: {
    width: 30,
    alignItems: 'center',
  },
  verticalLine: {
    width: 2,
    flex: 1,
    backgroundColor: '#EEEEEE',
  },
  stepIconContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  stepContent: {
    flex: 1,
    paddingLeft: 10,
    justifyContent: 'center',
  },
  stepLabel: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
    color: '#999',
  },
  stepTime: {
    fontSize: 11,
    color: '#AAA',
    fontFamily: 'Inter_400Regular',
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
    fontFamily: 'Inter_500Medium',
    marginTop: 20,
  },
  mapHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  floatingClose: {
    position: 'absolute',
    bottom: 40,
    alignSelf: 'center',
    backgroundColor: '#1A237E',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 30,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  closeBtnText: {
    color: 'white',
    fontFamily: 'Outfit_600SemiBold',
    fontSize: 16,
  },
});
