import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Modal,
  TextInput,
  Platform,
  Linking,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { incidentService } from '../services/incidentService';
import { useSnackbar } from '../context/SnackbarContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';
import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import VoicePlayer from './voicePlayer';
import { notificationService } from '../services/notificationService';
import { sosService } from '../services/sosService';

type AssignmentResponse = 'pending' | 'responding' | 'unavailable' | 'completed';

interface Assignment {
  _id: string;
  title: string;
  description: string;
  incidentType: string;
  locationText?: string; // from incident
  location?: { latitude: number; longitude: number }; // from sos
  status: string;
  isSOS?: boolean;
  assignmentResponse: AssignmentResponse;
  assignmentNote: string | null;
  reporter_id?: {
    username: string;
    email: string;
    phoneNumber?: string;
  };
  createdAt: string;
  latitude?: number;
  longitude?: number;
}

export default function GuardDashboard() {
  const { user } = useAuth();
  const { showSnackbar } = useSnackbar();
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];
  const isDark = colorScheme === 'dark';

  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedIncident, setSelectedIncident] = useState<Assignment | null>(null);
  const [responseNote, setResponseNote] = useState('');
  const [responding, setResponding] = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [imageViewerVisible, setImageViewerVisible] = useState(false);
  const [selectedImageUrl, setSelectedImageUrl] = useState<string | null>(null);

  const fetchAssignments = useCallback(async () => {
    try {
      // Fetch Incidents
      const incRes = await incidentService.getMyAssignments();
      let incAssignments = incRes.data || [];
      incAssignments = incAssignments.map((a: any) => ({ ...a, isSOS: false }));

      // Fetch SOS
      const sosRes = await sosService.getMyAssignments();
      let sosAssignments = sosRes.data || [];
      sosAssignments = sosAssignments.map((a: any) => ({ 
        ...a, 
        isSOS: true, 
        title: '🚨 EMERGENCY SOS ALERT', 
        incidentType: 'emergency_sos',
        latitude: a.location?.latitude,
        longitude: a.location?.longitude,
        locationText: `${a.location?.latitude?.toFixed(5) || 'Unknown'}, ${a.location?.longitude?.toFixed(5) || 'Unknown'}`
      }));

      // Merge and Sort by creation date
      const merged = [...incAssignments, ...sosAssignments].sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      setAssignments(merged);
    } catch (error) {
      console.error('Error fetching assignments:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchAssignments();
  }, [fetchAssignments]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchAssignments();
  };

  const handleResponse = async (incidentId: string, responseType: string) => {
    setResponding(true);
    Haptics.notificationAsync(
      responseType === 'responding'
        ? Haptics.NotificationFeedbackType.Success
        : Haptics.NotificationFeedbackType.Warning
    );
    try {
      if (selectedIncident?.isSOS) {
         await sosService.respondToAssignment(incidentId, responseType, responseNote || undefined);
      } else {
         await incidentService.respondToAssignment(incidentId, responseType, responseNote || undefined);
      }
      
      showSnackbar(
        responseType === 'responding'
          ? '✅ You are now responding to this assignment'
          : responseType === 'completed'
          ? '🎉 Assignment marked as completed'
          : '⚠️ Marked as unavailable',
        responseType === 'responding' ? 'success' : 'info'
      );

      // Add Expo Notification
      await notificationService.sendLocalNotification(
        responseType === 'responding' ? '🚀 Mission Started' : responseType === 'completed' ? '✅ Mission Accomplished' : '⚠️ Availability Updated',
        responseType === 'responding' 
          ? `You are now responding to: ${selectedIncident?.title}` 
          : responseType === 'completed'
          ? `You have successfully completed: ${selectedIncident?.title}`
          : `You marked yourself as unavailable for: ${selectedIncident?.title}`,
        { incidentId, type: 'response_update' }
      );
      setDetailModalVisible(false);
      setSelectedIncident(null);
      setResponseNote('');
      fetchAssignments();
    } catch (error: any) {
      showSnackbar(error.response?.data?.message || 'Failed to respond', 'error');
    } finally {
      setResponding(false);
    }
  };

  const getStatusColor = (response: AssignmentResponse | null) => {
    switch (response) {
      case 'pending': return '#FBC02D';
      case 'responding': return '#2196F3';
      case 'completed': return '#4CAF50';
      case 'unavailable': return '#F44336';
      default: return '#FBC02D';
    }
  };

  const getStatusIcon = (response: AssignmentResponse | null): string => {
    switch (response) {
      case 'pending': return 'clock-alert-outline';
      case 'responding': return 'run-fast';
      case 'completed': return 'check-decagram';
      case 'unavailable': return 'cancel';
      default: return 'clock-alert-outline';
    }
  };

  const getTypeIcon = (type: string): string => {
    const map: Record<string, string> = {
      theft: 'lock-alert',
      property_damage: 'home-alert',
      harassment: 'account-alert',
      fighting: 'sword-cross',
      drug_alcohol: 'bottle-wine',
      unauthorized_access: 'door-open',
      cyber_incident: 'laptop',
      fire_emergency: 'fire',
      medical_emergency: 'hospital-box',
      suspicious_activity: 'eye-outline',
      emergency_sos: 'alert-decagram',
      other: 'alert-circle',
    };
    return map[type] || 'alert-circle';
  };

  const pendingCount = assignments.filter(a => a.assignmentResponse === 'pending').length;
  const activeCount = assignments.filter(a => a.assignmentResponse === 'responding').length;
  const completedCount = assignments.filter(a => a.assignmentResponse === 'completed').length;

  const renderAssignmentCard = (item: Assignment) => (
    <TouchableOpacity
      key={item._id}
      style={[styles.card, { backgroundColor: isDark ? '#1A1A2E' : '#FFF' }]}
      activeOpacity={0.7}
      onPress={() => {
        setSelectedIncident(item);
        setDetailModalVisible(true);
      }}
    >
      {/* Status Strip */}
      <View style={[styles.statusStrip, { backgroundColor: getStatusColor(item.assignmentResponse) }]} />

      <View style={styles.cardContent}>
        {/* Header Row */}
        <View style={styles.cardHeader}>
          <View style={[styles.typeIconContainer, { backgroundColor: getStatusColor(item.assignmentResponse) + '20' }]}>
            <MaterialCommunityIcons
              name={getTypeIcon(item.incidentType) as any}
              size={22}
              color={getStatusColor(item.assignmentResponse)}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.cardTitle, { color: item.isSOS ? '#EF4444' : isDark ? '#FFF' : '#1A237E' }]} numberOfLines={1}>
              {item.title}
            </Text>
            <Text style={[styles.cardType, { color: theme.icon }]}>
              {item.isSOS ? 'HIGH PRIORITY' : item.incidentType?.replace(/_/g, ' ')}
            </Text>
          </View>
          <View style={[styles.responseBadge, { backgroundColor: getStatusColor(item.assignmentResponse) + '20' }]}>
            <MaterialCommunityIcons
              name={getStatusIcon(item.assignmentResponse) as any}
              size={14}
              color={getStatusColor(item.assignmentResponse)}
            />
            <Text style={[styles.responseBadgeText, { color: getStatusColor(item.assignmentResponse) }]}>
              {item.assignmentResponse || 'pending'}
            </Text>
          </View>
        </View>

        {/* Location */}
        <View style={styles.locationRow}>
          <MaterialCommunityIcons name="map-marker" size={14} color={theme.icon} />
          <Text style={[styles.locationText, { color: theme.icon }]} numberOfLines={1}>
            {item.locationText || 'No location'}
          </Text>
        </View>

        {/* Reporter + Time */}
        <View style={styles.cardFooter}>
          <Text style={[styles.reporterText, { color: theme.icon }]}>
            Reported by: {item.reporter_id?.username || item.userId?.username || 'Unknown'}
          </Text>
          <Text style={[styles.timeText, { color: theme.icon }]}>
            {new Date(item.createdAt).toLocaleDateString()}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#000' : '#FAF9FB' }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: isDark ? '#0A0A1A' : '#FFF' }]}>
        <View>
          <Text style={[styles.greeting, { color: theme.icon }]}>On Duty</Text>
          <Text style={[styles.headerTitle, { color: isDark ? '#FFF' : '#1A237E' }]}>
            {user?.username || 'Guard'}
          </Text>
        </View>
        <View style={styles.headerBadge}>
          <MaterialCommunityIcons name="shield-account" size={28} color="#FF3B70" />
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#FF3B70']} tintColor="#FF3B70" />
        }
      >
        {/* Notification Warning Banner */}
        {(!user?.fcmTokens || user.fcmTokens.length === 0) && (
          <View style={styles.warningBanner}>
            <MaterialCommunityIcons name="email-alert" size={20} color="#FFF" />
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={styles.warningText}>Push Notifications might be disabled due to server</Text>
              <Text style={styles.warningSubtext}>Checking for email regularly for updates is a MUST!</Text>
            </View>
          </View>
        )}
        {/* Stats Overview */}
        <View style={styles.statsRow}>
          <View style={[styles.statCard, { backgroundColor: isDark ? '#1A1A2E' : '#FFF' }]}>
            <View style={[styles.statIcon, { backgroundColor: '#FBC02D20' }]}>
              <MaterialCommunityIcons name="clock-alert-outline" size={20} color="#FBC02D" />
            </View>
            <Text style={[styles.statValue, { color: '#FBC02D' }]}>{pendingCount}</Text>
            <Text style={[styles.statLabel, { color: theme.icon }]}>Pending</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: isDark ? '#1A1A2E' : '#FFF' }]}>
            <View style={[styles.statIcon, { backgroundColor: '#2196F320' }]}>
              <MaterialCommunityIcons name="run-fast" size={20} color="#2196F3" />
            </View>
            <Text style={[styles.statValue, { color: '#2196F3' }]}>{activeCount}</Text>
            <Text style={[styles.statLabel, { color: theme.icon }]}>Active</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: isDark ? '#1A1A2E' : '#FFF' }]}>
            <View style={[styles.statIcon, { backgroundColor: '#4CAF5020' }]}>
              <MaterialCommunityIcons name="check-decagram" size={20} color="#4CAF50" />
            </View>
            <Text style={[styles.statValue, { color: '#4CAF50' }]}>{completedCount}</Text>
            <Text style={[styles.statLabel, { color: theme.icon }]}>Done</Text>
          </View>
        </View>

        {/* Section Title */}
        <Text style={[styles.sectionTitle, { color: isDark ? '#FFF' : '#333' }]}>
          My Assignments
        </Text>

        {/* Loading / Empty / List */}
        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color="#FF3B70" />
          </View>
        ) : assignments.length === 0 ? (
          <View style={[styles.emptyState, { backgroundColor: isDark ? '#1A1A2E' : '#FFF' }]}>
            <MaterialCommunityIcons name="shield-check" size={60} color="#4CAF50" />
            <Text style={[styles.emptyTitle, { color: isDark ? '#FFF' : '#333' }]}>
              All Clear!
            </Text>
            <Text style={[styles.emptySubtitle, { color: theme.icon }]}>
              No incidents have been assigned to you yet. Stay alert!
            </Text>
          </View>
        ) : (
          assignments.map(renderAssignmentCard)
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Detail & Response Modal */}
      <Modal
        visible={detailModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setDetailModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: isDark ? '#1A1A2E' : '#FFF' }]}>
            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Close Button */}
              <TouchableOpacity style={styles.modalClose} onPress={() => setDetailModalVisible(false)}>
                <MaterialCommunityIcons name="close" size={24} color={theme.icon} />
              </TouchableOpacity>

              {selectedIncident && (
                <>
                  {/* Incident Title */}
                  <View style={[styles.modalTypeTag, { backgroundColor: getStatusColor(selectedIncident.assignmentResponse) + '20' }]}>
                    <MaterialCommunityIcons
                      name={getTypeIcon(selectedIncident.incidentType) as any}
                      size={16}
                      color={getStatusColor(selectedIncident.assignmentResponse)}
                    />
                    <Text style={{ color: getStatusColor(selectedIncident.assignmentResponse), fontFamily: 'Outfit_600SemiBold', fontSize: 12, textTransform: 'capitalize' }}>
                      {selectedIncident.incidentType?.replace(/_/g, ' ')}
                    </Text>
                  </View>

                  <Text style={[styles.modalTitle, { color: isDark ? '#FFF' : '#1A237E' }]}>
                    {selectedIncident.title}
                  </Text>

                  <Text style={[styles.modalDescription, { color: isDark ? '#CCC' : '#555' }]}>
                    {selectedIncident.description}
                  </Text>

                  {/* Evidence Gallery */}
                  {(selectedIncident as any).images?.length > 0 || (selectedIncident as any).video?.url ? (
                    <View style={styles.evidenceSection}>
                      <Text style={[styles.evidenceTitle, { color: isDark ? '#FFF' : '#333' }]}>Evidence Attached</Text>
                      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.evidenceScroll}>
                        {(selectedIncident as any).images?.map((img: any, idx: number) => (
                          <TouchableOpacity 
                            key={idx} 
                            style={styles.evidenceImageContainer}
                            onPress={() => {
                              setSelectedImageUrl(img.url);
                              setImageViewerVisible(true);
                            }}
                          >
                            <Image 
                              source={{ uri: img.url }} 
                              style={styles.evidenceImage}
                              contentFit="cover"
                              transition={300}
                            />
                            <Text style={styles.evidenceLabel}>Photo {idx + 1}</Text>
                          </TouchableOpacity>
                        ))}
                        {(selectedIncident as any).video?.url && (
                          <View style={styles.evidenceImageContainer}>
                            <View style={[styles.evidenceImage, { backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' }]}>
                               <MaterialCommunityIcons name="play-circle" size={48} color="#FF3B70" />
                            </View>
                            <Text style={styles.evidenceLabel}>Video Evidence</Text>
                          </View>
                        )}
                      </ScrollView>

                      {(selectedIncident as any).audio?.url && (
                        <View style={styles.voiceNoteContainer}>
                          <View style={styles.voiceNoteHeader}>
                            <MaterialCommunityIcons name="microphone" size={20} color="#FF3B70" />
                            <Text style={[styles.voiceNoteTitle, { color: isDark ? '#FFF' : '#333' }]}>Voice Report</Text>
                          </View>
                          <VoicePlayer 
                            audioUri={(selectedIncident as any).audio.url} 
                            duration={(selectedIncident as any).voiceDuration ? parseInt((selectedIncident as any).voiceDuration) : 0} 
                          />
                        </View>
                      )}
                    </View>
                  ) : null}

                  {/* Info Grid */}
                  <View style={styles.infoGrid}>
                    <View style={[styles.infoItem, { backgroundColor: isDark ? '#0D0D1A' : '#F7F7F7' }]}>
                      <MaterialCommunityIcons name="map-marker" size={18} color="#FF3B70" />
                      <Text style={[styles.infoLabel, { color: theme.icon }]}>Location</Text>
                      <Text style={[styles.infoValue, { color: isDark ? '#FFF' : '#333' }]}>
                        {selectedIncident.locationText || 'N/A'}
                      </Text>
                      {selectedIncident.latitude && selectedIncident.longitude && (
                        <TouchableOpacity 
                          style={styles.mapLink}
                          onPress={() => {
                            const url = Platform.select({
                              ios: `maps:0,0?q=${selectedIncident.latitude},${selectedIncident.longitude}`,
                              android: `geo:0,0?q=${selectedIncident.latitude},${selectedIncident.longitude}`,
                            });
                            if (url) Linking.openURL(url);
                          }}
                        >
                          <MaterialCommunityIcons name="google-maps" size={14} color="#2196F3" />
                          <Text style={styles.mapLinkText}>View on Maps</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                    <View style={[styles.infoItem, { backgroundColor: isDark ? '#0D0D1A' : '#F7F7F7' }]}>
                      <MaterialCommunityIcons name="account" size={18} color="#FF3B70" />
                      <Text style={[styles.infoLabel, { color: theme.icon }]}>Reporter</Text>
                      <Text style={[styles.infoValue, { color: isDark ? '#FFF' : '#333' }]}>
                        {selectedIncident.reporter_id?.username || 'Unknown'}
                      </Text>
                    </View>
                    <View style={[styles.infoItem, { backgroundColor: isDark ? '#0D0D1A' : '#F7F7F7' }]}>
                      <MaterialCommunityIcons name="clock-outline" size={18} color="#FF3B70" />
                      <Text style={[styles.infoLabel, { color: theme.icon }]}>Reported</Text>
                      <Text style={[styles.infoValue, { color: isDark ? '#FFF' : '#333' }]}>
                        {new Date(selectedIncident.createdAt).toLocaleString()}
                      </Text>
                    </View>
                    <View style={[styles.infoItem, { backgroundColor: isDark ? '#0D0D1A' : '#F7F7F7' }]}>
                      <MaterialCommunityIcons name="shield-alert" size={18} color="#FF3B70" />
                      <Text style={[styles.infoLabel, { color: theme.icon }]}>Status</Text>
                      <Text style={[styles.infoValue, { color: getStatusColor(selectedIncident.assignmentResponse) }]}>
                        {selectedIncident.assignmentResponse || 'pending'}
                      </Text>
                    </View>
                  </View>

                  {/* Note Input */}
                  {selectedIncident.assignmentResponse === 'pending' && (
                    <>
                      <Text style={[styles.noteLabel, { color: isDark ? '#FFF' : '#333' }]}>Add a note (optional)</Text>
                      <TextInput
                        style={[styles.noteInput, { backgroundColor: isDark ? '#0D0D1A' : '#F7F7F7', color: isDark ? '#FFF' : '#333', borderColor: isDark ? '#333' : '#E0E0E0' }]}
                        placeholder="E.g. ETA 5 minutes..."
                        placeholderTextColor={theme.icon}
                        value={responseNote}
                        onChangeText={setResponseNote}
                        multiline
                      />
                    </>
                  )}

                  {/* Action Buttons */}
                  {selectedIncident.assignmentResponse === 'pending' && (
                    <View style={styles.actionButtons}>
                      <TouchableOpacity
                        style={[styles.respondButton, { backgroundColor: '#2196F3' }]}
                        onPress={() => handleResponse(selectedIncident._id, 'responding')}
                        disabled={responding}
                      >
                        {responding ? (
                          <ActivityIndicator color="#FFF" size="small" />
                        ) : (
                          <>
                            <MaterialCommunityIcons name="run-fast" size={20} color="#FFF" />
                            <Text style={styles.respondButtonText}>Responding</Text>
                          </>
                        )}
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[styles.respondButton, { backgroundColor: '#F44336' }]}
                        onPress={() => handleResponse(selectedIncident._id, 'unavailable')}
                        disabled={responding}
                      >
                        <MaterialCommunityIcons name="cancel" size={20} color="#FFF" />
                        <Text style={styles.respondButtonText}>Unavailable</Text>
                      </TouchableOpacity>
                    </View>
                  )}

                  {selectedIncident.assignmentResponse === 'responding' && (
                    <TouchableOpacity
                      style={[styles.respondButton, { backgroundColor: '#4CAF50', width: '100%', marginTop: 16 }]}
                      onPress={() => handleResponse(selectedIncident._id, 'completed')}
                      disabled={responding}
                    >
                      {responding ? (
                        <ActivityIndicator color="#FFF" size="small" />
                      ) : (
                        <>
                          <MaterialCommunityIcons name="check-decagram" size={20} color="#FFF" />
                          <Text style={styles.respondButtonText}>Mark Completed</Text>
                        </>
                      )}
                    </TouchableOpacity>
                  )}
                </>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
      {/* Full Screen Image Viewer Modal */}
      <Modal
        visible={imageViewerVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setImageViewerVisible(false)}
      >
        <View style={styles.viewerContainer}>
          <TouchableOpacity 
            style={styles.viewerClose}
            onPress={() => setImageViewerVisible(false)}
          >
            <MaterialCommunityIcons name="close" size={30} color="#FFF" />
          </TouchableOpacity>
          
          {selectedImageUrl && (
            <Image 
              source={{ uri: selectedImageUrl }} 
              style={styles.fullImage}
              contentFit="contain"
            />
          )}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 50,
    paddingBottom: 16,
  },
  greeting: {
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontFamily: 'Outfit_700Bold',
    marginTop: 2,
  },
  headerBadge: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: '#FF3B7015',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    padding: 20,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    borderRadius: 20,
    padding: 16,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
  },
  statIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 22,
    fontFamily: 'Outfit_700Bold',
  },
  statLabel: {
    fontSize: 11,
    fontFamily: 'Inter_500Medium',
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Outfit_700Bold',
    marginBottom: 14,
  },
  warningBanner: {
    backgroundColor: '#FF8C00',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderRadius: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    shadowColor: '#FF8C00',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  warningText: {
    color: '#FFF',
    fontSize: 14,
    fontFamily: 'Outfit_700Bold',
  },
  warningSubtext: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    marginTop: 2,
  },
  card: {
    flexDirection: 'row',
    borderRadius: 20,
    marginBottom: 14,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    overflow: 'hidden',
  },
  statusStrip: {
    width: 5,
  },
  cardContent: {
    flex: 1,
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 10,
  },
  typeIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 15,
    fontFamily: 'Outfit_600SemiBold',
  },
  cardType: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    textTransform: 'capitalize',
    marginTop: 2,
  },
  responseBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  responseBadgeText: {
    fontSize: 10,
    fontFamily: 'Outfit_600SemiBold',
    textTransform: 'capitalize',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 8,
  },
  locationText: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    flex: 1,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  reporterText: {
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
  },
  timeText: {
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
  },
  centered: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  emptyState: {
    borderRadius: 24,
    padding: 40,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
  },
  emptyTitle: {
    fontSize: 20,
    fontFamily: 'Outfit_700Bold',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 24,
    maxHeight: '85%',
  },
  modalClose: {
    alignSelf: 'flex-end',
    padding: 4,
    marginBottom: 8,
  },
  modalTypeTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 22,
    fontFamily: 'Outfit_700Bold',
    marginBottom: 10,
  },
  modalDescription: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    lineHeight: 22,
    marginBottom: 20,
  },
  evidenceSection: {
    marginBottom: 24,
  },
  evidenceTitle: {
    fontSize: 16,
    fontFamily: 'Outfit_600SemiBold',
    marginBottom: 12,
  },
  evidenceScroll: {
    gap: 12,
    marginBottom: 16,
  },
  voiceNoteContainer: {
    marginTop: 8,
    padding: 12,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 59, 112, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 59, 112, 0.1)',
  },
  voiceNoteHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  voiceNoteTitle: {
    fontSize: 14,
    fontFamily: 'Outfit_600SemiBold',
  },
  evidenceImageContainer: {
    alignItems: 'center',
    gap: 4,
  },
  evidenceImage: {
    width: 120,
    height: 120,
    borderRadius: 16,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  evidenceLabel: {
    fontSize: 10,
    fontFamily: 'Inter_500Medium',
    color: '#666',
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 20,
  },
  infoItem: {
    width: '47%',
    borderRadius: 14,
    padding: 14,
    gap: 4,
  },
  infoLabel: {
    fontSize: 11,
    fontFamily: 'Inter_500Medium',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  infoValue: {
    fontSize: 13,
    fontFamily: 'Outfit_600SemiBold',
  },
  mapLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 6,
    backgroundColor: 'rgba(33, 150, 243, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  mapLinkText: {
    fontSize: 11,
    fontFamily: 'Inter_600SemiBold',
    color: '#2196F3',
  },
  noteLabel: {
    fontSize: 14,
    fontFamily: 'Outfit_600SemiBold',
    marginBottom: 8,
  },
  noteInput: {
    borderRadius: 14,
    padding: 14,
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    minHeight: 60,
    textAlignVertical: 'top',
    borderWidth: 1,
    marginBottom: 16,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  respondButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    borderRadius: 14,
    paddingVertical: 14,
  },
  viewerContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  viewerClose: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
    padding: 10,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 25,
  },
  fullImage: {
    width: '100%',
    height: '80%',
  },
  respondButtonText: {
    color: '#FFF',
    fontSize: 15,
    fontFamily: 'Outfit_600SemiBold',
  },
});
