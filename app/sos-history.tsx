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
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { sosService, SOSHistoryItem } from '../services/sosService';
import { useSnackbar } from '../context/SnackbarContext';
import { handleApiError } from '../utils/errorHandling';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';

const TimelineStep = ({ 
  icon, 
  color, 
  label, 
  time, 
  isFirst = false, 
  isLast = false, 
  isActive = false 
}: any) => {
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];
  const isDark = colorScheme === 'dark';

  return (
    <View style={styles.stepContainer}>
      <View style={styles.leftLineContainer}>
        {!isFirst && <View style={[styles.verticalLine, isActive && { backgroundColor: color }, isDark && !isActive && { backgroundColor: '#333' }]} />}
        <View style={[styles.stepIconContainer, { backgroundColor: isActive ? color : (isDark ? '#333' : '#E0E0E0') }]}>
          <MaterialCommunityIcons name={icon} size={14} color="white" />
        </View>
        {!isLast && <View style={[styles.verticalLine, isActive && { backgroundColor: color }, isDark && !isActive && { backgroundColor: '#333' }]} />}
      </View>
      <View style={styles.stepContent}>
        <Text style={[styles.stepLabel, isActive && { color: theme.text }]}>{label}</Text>
        <Text style={[styles.stepTime, { color: theme.icon }]}>{time}</Text>
      </View>
    </View>
  );
};

export default function SOSHistoryScreen() {
  const [history, setHistory] = useState<SOSHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  const router = useRouter();
  const { showSnackbar } = useSnackbar();
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];
  const isDark = colorScheme === 'dark';

  const fetchSOSHistory = async () => {
    try {
      const data = await sosService.getSOSHistory();
      setHistory(data.slice(0, 15)); 
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

  const openInGoogleMaps = (lat: number, lng: number, title: string) => {
    const scheme = Platform.select({ ios: 'maps://0,0?q=', android: 'geo:0,0?q=' });
    const latLng = `${lat},${lng}`;
    const url = Platform.select({
      ios: `${scheme}${title}@${latLng}`,
      android: `${scheme}${latLng}(${title})`
    });

    if (url) {
        Linking.openURL(url).catch(() => {
            Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`);
        });
    }
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

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return null;
    return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const renderSOSItem = ({ item }: { item: SOSHistoryItem }) => (
    <View style={[styles.sosCard, { backgroundColor: theme.background }]}>
      <View style={styles.cardHeader}>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '15' }]}>
          <View style={[styles.statusDot, { backgroundColor: getStatusColor(item.status) }]} />
          <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
            {item.status.toUpperCase()}
          </Text>
        </View>
        <Text style={[styles.dateText, { color: theme.icon }]}>
          {new Date(item.createdAt).toLocaleDateString()}
        </Text>
      </View>

      <View style={styles.cardContent}>
        <TouchableOpacity 
            style={styles.locationSummary}
            onPress={() => openInGoogleMaps(item.location.latitude, item.location.longitude, `SOS Event: ${new Date(item.createdAt).toLocaleDateString()}`)}
            activeOpacity={0.7}
        >
            <View style={styles.iconCircle}>
                <MaterialCommunityIcons name="google-maps" size={22} color="#FF3B70" />
            </View>
            <View style={{ flex: 1 }}>
                <Text style={[styles.locationLabel, { color: theme.icon }]}>TAP TO NAVIGATE</Text>
                <Text style={[styles.locationText, { color: theme.text }]}>
                    {item.location.latitude.toFixed(5)}, {item.location.longitude.toFixed(5)}
                </Text>
            </View>
            <MaterialCommunityIcons name="open-in-new" size={20} color="#FF3B70" />
        </TouchableOpacity>
        
        {item.note && (
          <View style={[styles.noteBox, { backgroundColor: isDark ? '#1A1A1A' : '#F5F6F9' }]}>
            <Text style={[styles.noteLabel, { color: theme.icon }]}>Incident Note:</Text>
            <Text style={[styles.noteText, { color: theme.text }]}>{item.note}</Text>
          </View>
        )}

        <View style={styles.modernTimeline}>
          <TimelineStep icon="bell-ring" color="#FF3B30" label="SOS Sent" time={formatDate(item.createdAt)} isFirst isActive />
          {item.acknowledgedAt && <TimelineStep icon="eye-check" color="#FF9800" label="Acknowledged" time={formatDate(item.acknowledgedAt)} isActive />}
          {item.respondedAt && <TimelineStep icon="truck-fast" color="#2196F3" label="Responding" time={formatDate(item.respondedAt)} isActive />}
          {item.resolvedAt && <TimelineStep icon="check-decagram" color="#4CAF50" label="Resolved" time={formatDate(item.resolvedAt)} isLast isActive />}
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: isDark ? '#000' : '#F8F9FA' }]}>
      <View style={[styles.header, { backgroundColor: theme.background }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>SOS Logs</Text>
        <View style={{ width: 40 }} />
      </View>

      <FlatList
        data={history}
        keyExtractor={(item) => item._id}
        renderItem={renderSOSItem}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#FF3B30']} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="shield-off-outline" size={80} color="#E0E0E0" />
            <Text style={styles.emptyText}>No logs found</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  backButton: { width: 40, height: 40, justifyContent: 'center' },
  headerTitle: { fontSize: 22, fontFamily: 'Outfit_700Bold' },
  listContent: { padding: 20, gap: 16 },
  sosCard: { borderRadius: 24, padding: 18, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10, gap: 5 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 10, fontFamily: 'Inter_700Bold', letterSpacing: 0.5 },
  dateText: { fontSize: 11, fontFamily: 'Inter_600SemiBold', color: '#666' },
  cardContent: { gap: 12 },
  locationSummary: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#FFF', 
    padding: 15, 
    borderRadius: 18, 
    gap: 12,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFF0F3',
    justifyContent: 'center',
    alignItems: 'center',
  },
  locationLabel: { fontSize: 9, fontFamily: 'Inter_800ExtraBold', letterSpacing: 1.2 },
  locationText: { fontSize: 15, fontFamily: 'Inter_600SemiBold' },
  noteBox: { padding: 14, borderRadius: 16, borderLeftWidth: 4, borderLeftColor: '#FF3B70' },
  noteLabel: { fontSize: 11, fontFamily: 'Inter_700Bold', marginBottom: 3 },
  noteText: { fontSize: 13, fontFamily: 'Inter_400Regular', lineHeight: 18 },
  modernTimeline: { marginTop: 8, paddingLeft: 10 },
  stepContainer: { flexDirection: 'row', height: 42 },
  leftLineContainer: { width: 25, alignItems: 'center' },
  verticalLine: { width: 2, flex: 1, backgroundColor: '#F0F0F0' },
  stepIconContainer: { width: 18, height: 18, borderRadius: 9, justifyContent: 'center', alignItems: 'center', zIndex: 1 },
  stepContent: { flex: 1, paddingLeft: 10, justifyContent: 'center' },
  stepLabel: { fontSize: 13, fontFamily: 'Inter_600SemiBold', color: '#AAA' },
  stepTime: { fontSize: 10, color: '#CCC' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 100 },
  emptyText: { fontSize: 16, color: '#9E9E9E', marginTop: 20 },
});
