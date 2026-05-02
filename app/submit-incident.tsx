// Route: submit-incident
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Modal
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors, Fonts } from '@/constants/theme';

import * as Location from 'expo-location';
import MapLive from '@/components/Map';
import { useSnackbar } from '../context/SnackbarContext';
import { useTheme } from '../context/ThemeContext';
import { incidentService } from '../services/incidentService';
import { notificationService } from '../services/notificationService';
import { IncidentType } from '../types/incident';
import VoiceRecorder from '@/components/VoiceRecorder';
import VoicePlayer from '@/components/voicePlayer';
import { VoiceNote } from '@/types/voiceNote';
import { IncidentMedia } from '@/types/incidentMedia';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { handleApiError } from '../utils/errorHandling';
import { Video, Image } from 'react-native-compressor';
import * as FileSystem from 'expo-file-system/legacy';

import MediaPreview from '@/components/MediaPreview';
import MediaPicker from '@/components/MediaPicker';
import CameraCapture from '@/components/CameraCapture';

const formatBytes = (bytes: number, decimals = 2) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

const INCIDENT_TYPES: { label: string; value: IncidentType }[] = [
  { label: 'Theft', value: 'theft' },
  { label: 'Property Damage', value: 'property_damage' },
  { label: 'Harassment', value: 'harassment' },
  { label: 'Fighting', value: 'fighting' },
  { label: 'Drug / Alcohol', value: 'drug_alcohol' },
  { label: 'Unauthorized Access', value: 'unauthorized_access' },
  { label: 'Cyber Incident', value: 'cyber_incident' },
  { label: 'Fire Emergency', value: 'fire_emergency' },
  { label: 'Medical Emergency', value: 'medical_emergency' },
  { label: 'Suspicious Activity', value: 'suspicious_activity' },
  { label: 'Other', value: 'other' },
];

const getIconForType = (type: string): any => {
  switch (type) {
    case 'theft': return 'incognito';
    case 'property_damage': return 'home-alert';
    case 'harassment': return 'account-alert';
    case 'fighting': return 'sword-cross';
    case 'drug_alcohol': return 'pill';
    case 'unauthorized_access': return 'shield-alert-outline';
    case 'cyber_incident': return 'laptop-off';
    case 'fire_emergency': return 'fire';
    case 'medical_emergency': return 'medical-bag';
    case 'suspicious_activity': return 'eye-outline';
    default: return 'alert-circle-outline';
  }
};

export default function SubmitIncidentScreen() {
  const { theme: currentTheme } = useTheme();
  const isDark = currentTheme === 'dark';
  const theme = Colors[currentTheme];

  const [title, setTitle] = useState('');

  const [description, setDescription] = useState('');
  const [incidentType, setIncidentType] = useState<IncidentType | ''>('');
  const [locationText, setLocationText] = useState('');
  const [latitude, setLatitude] = useState<number | undefined>();
  const [longitude, setLongitude] = useState<number | undefined>();
  const [loading, setLoading] = useState(false);
  const [locLoading, setLocLoading] = useState(false);
  const [voiceNote, setVoiceNote] = useState<VoiceNote | null>(null);
  const [mediaList, setMediaList] = useState<IncidentMedia[]>([]);
  const [isCameraOpen, setIsCameraOpen] = useState(false);

  const [region, setRegion] = useState({
    latitude: 33.6844, // Default Islamabad
    longitude: 73.0479,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  });

  // Persistent Form State
  React.useEffect(() => {
    const loadDraft = async () => {
      try {
        const draft = await AsyncStorage.getItem('incident_draft');
        if (draft) {
          const { title, description, incidentType, locationText, latitude, longitude } = JSON.parse(draft);
          if (title) setTitle(title);
          if (description) setDescription(description);
          if (incidentType) setIncidentType(incidentType);
          if (locationText) setLocationText(locationText);
          if (latitude) setLatitude(latitude);
          if (longitude) setLongitude(longitude);
        }
      } catch (e) {
        console.error('Failed to load draft from storage');
      }
    };
    loadDraft();
  }, []);

  React.useEffect(() => {
    const saveDraft = async () => {
      try {
        const draft = { title, description, incidentType, locationText, latitude, longitude };
        await AsyncStorage.setItem('incident_draft', JSON.stringify(draft));
      } catch (e) {
        console.error('Failed to save draft to storage');
      }
    };
    saveDraft();
  }, [title, description, incidentType, locationText, latitude, longitude]);

  const clearDraft = async () => {
    try {
      await AsyncStorage.removeItem('incident_draft');
    } catch (e) {
      console.error('Failed to clear draft');
    }
  };

  const router = useRouter();
  const { showSnackbar } = useSnackbar();

  const handleCloseCamera = () => setIsCameraOpen(false);
  const handleOpenCamera = () => setIsCameraOpen(true);

  const handleMediaAdd = (newMedia: IncidentMedia) => {
    if (newMedia.type === 'video') {
      setMediaList(prev => {
        const filtered = prev.filter(m => m.type !== 'video');
        return [...filtered, newMedia];
      });
    } else {
      setMediaList(prev => {
        const imageCount = prev.filter(m => m.type === 'image').length;
        if (imageCount >= 3) {
          showSnackbar('Maximum 3 images allowed', 'error');
          return prev;
        }
        return [...prev, newMedia];
      });
    }
    setIsCameraOpen(false);
  };

  const handleRemoveMedia = (index: number) => {
    setMediaList(prev => prev.filter((_, i) => i !== index));
  };

  const getCurrentLocation = async () => {
    setLocLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        showSnackbar('Permission to access location was denied', 'error');
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = location.coords;

      setLatitude(latitude);
      setLongitude(longitude);
      setRegion({
        ...region,
        latitude,
        longitude,
      });

      const [address] = await Location.reverseGeocodeAsync({ latitude, longitude });
      if (address) {
        const text = `${address.name || ''} ${address.street || ''}, ${address.city || ''}`.trim();
        setLocationText(text);
      }
    } catch (error) {
      showSnackbar('Error getting location', 'error');
    } finally {
      setLocLoading(false);
    }
  };


  const handleSubmit = async () => {
    if (!title || !description || !incidentType || !locationText) {
      showSnackbar('Please fill in all required fields', 'error');
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      
      formData.append('title', title);
      formData.append('description', description);
      formData.append('incidentType', incidentType);
      formData.append('locationText', locationText);

      if (latitude !== undefined) formData.append('latitude', String(latitude));
      if (longitude !== undefined) formData.append('longitude', String(longitude));

      if (voiceNote) {
        formData.append('audio', {
          uri: voiceNote.uri,
          name: voiceNote.uri.split('/').pop() || 'voice_note.m4a',
          type: 'audio/m4a',
        } as any);

        formData.append('voiceDuration', String(voiceNote.durationMs));
      }

      let totalOriginal = 0;
      let totalCompressed = 0;

      // Elite Image Compression
      const imageList = mediaList.filter(item => item.type === 'image');
      for (let i = 0; i < imageList.length; i++) {
        const image = imageList[i];
        try {
          const fileInfo = await FileSystem.getInfoAsync(image.uri);
          const originalSize = fileInfo.exists ? fileInfo.size : 0;
          totalOriginal += (originalSize || 0);
          
          console.log(`[Image ${i+1}] Compressing... Original: ${formatBytes(originalSize || 0)}`);
          
          const compressedUri = await Image.compress(image.uri, {
            compressionMethod: 'auto',
            quality: 0.7,
          });

          const compressedInfo = await FileSystem.getInfoAsync(compressedUri);
          const compressedSize = compressedInfo.exists ? compressedInfo.size : 0;
          totalCompressed += (compressedSize || 0);
          
          console.log(`[Image ${i+1}] Done! Compressed: ${formatBytes(compressedSize || 0)} (Saved ${Math.round((1 - (compressedSize || 0) / (originalSize || 1)) * 100)}%)`);
          
          formData.append('images', {
            uri: compressedUri,
            name: image.fileName || `image_${Date.now()}_${i}.jpg`,
            type: 'image/jpeg',
          } as any);
        } catch (compressionError) {
          console.error('Image compression failed, using original', compressionError);
          formData.append('images', {
            uri: image.uri,
            name: image.fileName || `image_${Date.now()}_${i}.jpg`,
            type: 'image/jpeg',
          } as any);
        }
      }

      // Elite Video Compression
      const videoMedia = mediaList.find(item => item.type === 'video');
      if (videoMedia) {
        try {
          const fileInfo = await FileSystem.getInfoAsync(videoMedia.uri);
          const originalSize = fileInfo.exists ? fileInfo.size : 0;
          totalOriginal += (originalSize || 0);
          
          console.log(`[Video] Compressing... Original: ${formatBytes(originalSize || 0)}`);
          
          const compressedVideoUri = await Video.compress(
            videoMedia.uri,
            {
              compressionMethod: 'auto',
            }
          );

          const compressedInfo = await FileSystem.getInfoAsync(compressedVideoUri);
          const compressedSize = compressedInfo.exists ? compressedInfo.size : 0;
          totalCompressed += (compressedSize || 0);
          
          console.log(`[Video] Done! Compressed: ${formatBytes(compressedSize || 0)} (Saved ${Math.round((1 - (compressedSize || 0) / (originalSize || 1)) * 100)}%)`);

          formData.append('video', {
            uri: compressedVideoUri,
            name: videoMedia.fileName || `video_${Date.now()}.mp4`,
            type: 'video/mp4',
          } as any);
        } catch (compressionError) {
          console.error('Video compression failed, using original', compressionError);
          formData.append('video', {
            uri: videoMedia.uri,
            name: videoMedia.fileName || `video_${Date.now()}.mp4`,
            type: 'video/mp4',
          } as any);
        }
      }

      await incidentService.createIncident(formData as any);

      await clearDraft(); 
      
      const savedText = totalOriginal > 0 
        ? `\nSaved ${formatBytes(totalOriginal - totalCompressed)} of data!`
        : '';
        
      showSnackbar(`✅ Incident reported successfully.${savedText}`, 'success');
      
      // Trigger Local Expo Notification
      await notificationService.sendLocalNotification(
        'Incident Reported',
        'Your report has been successfully transmitted to SafeCampus Security.'
      );

      router.back();
    } catch (error: any) {
      handleApiError(error, showSnackbar);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={[styles.container, { backgroundColor: isDark ? '#000' : '#FAF9FB' }]}>
        {/* Background Blobs for Premium Aesthetic */}
        <LinearGradient colors={['#FF4B6C', '#FF8EBC']} style={styles.topBlob} />
        <LinearGradient colors={['#FF4B6C', '#FF8EBC']} style={styles.bottomBlob} />

        <View style={[styles.techHeader, { backgroundColor: isDark ? 'rgba(10, 12, 16, 0.85)' : 'rgba(255, 255, 255, 0.85)' }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.techBackButton}>
            <MaterialCommunityIcons name="chevron-left" size={28} color="#FF3B70" />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Text style={[styles.headerSubtitle, { color: '#FF3B70' }]}>SECURE CHANNEL // ENCRYPTED</Text>
            <Text style={[styles.headerTitle, { color: theme.text }]}>CLASSIFIED DOSSIER</Text>
          </View>
          <MaterialCommunityIcons name="radar" size={24} color="#FF3B70" style={styles.radarIcon} />
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
          
          {/* Phase 1: Basic Intelligence */}
          <View style={[styles.techSection, { backgroundColor: isDark ? 'rgba(15, 18, 22, 0.7)' : 'rgba(255, 255, 255, 0.85)', borderColor: isDark ? 'rgba(255, 59, 112, 0.3)' : 'rgba(0, 0, 0, 0.1)' }]}>
            <View style={styles.techSectionHeader}>
              <View style={styles.headerGlowLine} />
              <MaterialCommunityIcons name="shield-search" size={20} color="#FF3B70" />
              <Text style={[styles.techSectionTitle, { color: theme.text }]}>SYS.01 // IDENTIFICATION</Text>
            </View>
            
            <TextInput
              style={[styles.techInput, { color: theme.text, borderBottomColor: isDark ? 'rgba(255, 59, 112, 0.5)' : '#FF3B70' }]}
              placeholder="ENTER INCIDENT TITLE..."
              placeholderTextColor={isDark ? '#555' : '#A0A0A0'}
              value={title}
              onChangeText={setTitle}
            />

            <Text style={[styles.techLabel, { color: theme.text }]}>SELECT CLASSIFICATION VECTOR</Text>
            <View style={styles.techTypeContainer}>
              {INCIDENT_TYPES.map((type) => {
                const isSelected = incidentType === type.value;
                return (
                  <TouchableOpacity
                    key={type.value}
                    style={[
                      styles.techTypeCard,
                      { backgroundColor: isDark ? 'rgba(0,0,0,0.4)' : '#F5F5F5', borderColor: isSelected ? '#FF3B70' : (isDark ? '#222' : '#E0E0E0') },
                      isSelected && styles.techTypeCardSelected
                    ]}
                    onPress={() => setIncidentType(type.value)}
                  >
                    <MaterialCommunityIcons 
                      name={getIconForType(type.value)} 
                      size={24} 
                      color={isSelected ? '#fff' : '#FF3B70'} 
                      style={styles.techTypeIcon} 
                    />
                    <Text style={[
                      styles.techTypeCardText,
                      { color: theme.icon },
                      isSelected && styles.techTypeCardTextSelected
                    ]}>
                      {type.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Phase 2: Geolocation */}
          <View style={[styles.techSection, { backgroundColor: isDark ? 'rgba(15, 18, 22, 0.7)' : 'rgba(255, 255, 255, 0.85)', borderColor: isDark ? 'rgba(255, 59, 112, 0.3)' : 'rgba(0, 0, 0, 0.1)' }]}>
            <View style={styles.techSectionHeader}>
              <View style={styles.headerGlowLine} />
              <MaterialCommunityIcons name="map-marker-radius" size={20} color="#FF3B70" />
              <Text style={[styles.techSectionTitle, { color: theme.text }]}>SYS.02 // GEOLOCATION TRACKING</Text>
            </View>

            <View style={[styles.techMapWrapper, { borderColor: isDark ? 'rgba(255, 59, 112, 0.5)' : '#FF3B70' }]}>
              {/* Map Corner Brackets for tech look */}
              <View style={[styles.cornerBracket, styles.topLeftBracket]} />
              <View style={[styles.cornerBracket, styles.topRightBracket]} />
              <View style={[styles.cornerBracket, styles.bottomLeftBracket]} />
              <View style={[styles.cornerBracket, styles.bottomRightBracket]} />

              <MapLive 
                id="incident-submit-map"
               mapStyle = {'https://tiles.openfreemap.org/styles/liberty'}
                height={200}
                initialLocation={longitude && latitude ? [longitude, latitude] : undefined}
                onLocationChange={(lat, lng, name) => {
                  setLatitude(lat);
                  setLongitude(lng);
                  setLocationText(name);
                }}
              />
            </View>

            <TextInput
              style={[styles.techInput, { color: theme.text, borderBottomColor: isDark ? 'rgba(255, 59, 112, 0.5)' : '#FF3B70' }]}
              placeholder="INPUT COORD/LOCATION DATA..."
              placeholderTextColor={isDark ? '#555' : '#A0A0A0'}
              value={locationText}
              onChangeText={setLocationText}
            />
          </View>

          {/* Phase 3: Evidence Collection */}
          <View style={[styles.techSection, { backgroundColor: isDark ? 'rgba(15, 18, 22, 0.7)' : 'rgba(255, 255, 255, 0.85)', borderColor: isDark ? 'rgba(255, 59, 112, 0.3)' : 'rgba(0, 0, 0, 0.1)' }]}>
            <View style={styles.techSectionHeader}>
              <View style={styles.headerGlowLine} />
              <MaterialCommunityIcons name="database-eye" size={20} color="#FF3B70" />
              <Text style={[styles.techSectionTitle, { color: theme.text }]}>SYS.03 // EVIDENCE VAULT</Text>
            </View>

            <VoiceRecorder setVoiceNote={setVoiceNote} />
            {voiceNote && <VoicePlayer voiceNote={voiceNote} setVoiceNote={setVoiceNote} />}

            <View style={[styles.techDivider, { backgroundColor: isDark ? 'rgba(255, 59, 112, 0.2)' : '#E0E0E0' }]} />

            <MediaPicker 
              onPickMedia={handleMediaAdd} 
              onOpenCamera={handleOpenCamera} 
            />

            {mediaList.length > 0 ? (
              <View style={styles.mediaListContainer}>
                <Text style={[styles.techSelectedCountText, { color: '#FF3B70' }]}>
                  &gt; {mediaList.length} ASSET{mediaList.length > 1 ? 'S' : ''} DETECTED IN VAULT
                </Text>
                {mediaList.map((item, index) => (
                  <MediaPreview 
                    key={index} 
                    media={item} 
                    onRemove={() => handleRemoveMedia(index)} 
                  />
                ))}
              </View>
            ) : (
              <View style={[styles.techEmptyMediaBox, { backgroundColor: isDark ? 'rgba(0, 0, 0, 0.5)' : '#FAFAFA', borderColor: isDark ? 'rgba(255, 59, 112, 0.3)' : '#EEEEEE' }]}>
                <MaterialCommunityIcons name="database-alert" size={28} color={isDark ? 'rgba(255, 59, 112, 0.5)' : '#999'} />
                <Text style={[styles.techEmptyMediaText, { color: isDark ? 'rgba(255, 59, 112, 0.8)' : '#999' }]}>AWAITING SECURE UPLOAD...</Text>
              </View>
            )}
          </View>

          {/* Phase 4: Narrative */}
          <View style={[styles.techSection, { backgroundColor: isDark ? 'rgba(15, 18, 22, 0.7)' : 'rgba(255, 255, 255, 0.85)', borderColor: isDark ? 'rgba(255, 59, 112, 0.3)' : 'rgba(0, 0, 0, 0.1)' }]}>
            <View style={styles.techSectionHeader}>
              <View style={styles.headerGlowLine} />
              <MaterialCommunityIcons name="console-network" size={20} color="#FF3B70" />
              <Text style={[styles.techSectionTitle, { color: theme.text }]}>SYS.04 // INCIDENT NARRATIVE</Text>
            </View>
            <TextInput
              style={[styles.techInput, styles.techTextArea, { color: theme.text, borderColor: isDark ? 'rgba(255, 59, 112, 0.3)' : '#E0E0E0', backgroundColor: isDark ? 'rgba(0,0,0,0.3)' : 'transparent' }]}
              placeholder="INITIATE LOG SEQUENCE..."
              placeholderTextColor={isDark ? '#555' : '#A0A0A0'}
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>

          <Modal visible={isCameraOpen} animationType="slide">
            <CameraCapture 
              onCapture={handleMediaAdd} 
              onClose={handleCloseCamera} 
            />
          </Modal>

          <TouchableOpacity
            style={[styles.techSubmitButtonContainer, loading && styles.disabledButton]}
            onPress={handleSubmit}
            disabled={loading}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#FF4B6C', '#FF8EBC']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.techSubmitGradientButton}
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <View style={styles.techSubmitButtonContent}>
                  <MaterialCommunityIcons name="shield-check" size={24} color="white" />
                  <Text style={styles.techSubmitButtonText}>INITIATE PROTOCOL // SUBMIT</Text>
                </View>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: 'hidden',
  },
  topBlob: {
    position: 'absolute',
    top: -100,
    right: -80,
    width: 300,
    height: 300,
    borderRadius: 150,
    opacity: 0.15,
  },
  bottomBlob: {
    position: 'absolute',
    bottom: -150,
    left: -100,
    width: 400,
    height: 400,
    borderRadius: 200,
    opacity: 0.15,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  techHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 55,
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 59, 112, 0.2)',
    shadowColor: '#FF3B70',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 4,
  },
  techBackButton: {
    padding: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 59, 112, 0.3)',
    borderRadius: 8,
    backgroundColor: 'rgba(255, 59, 112, 0.05)',
  },
  headerTitleContainer: {
    flex: 1,
    marginLeft: 15,
  },
  headerSubtitle: {
    fontSize: 10,
    fontFamily: Fonts.regular,
    letterSpacing: 2,
    marginBottom: 2,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: Fonts.heading,
    letterSpacing: 1.5,
  },
  radarIcon: {
    opacity: 0.8,
  },
  techSection: {
    marginBottom: 25,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 5,
  },
  techSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 10,
  },
  headerGlowLine: {
    width: 3,
    height: 18,
    backgroundColor: '#FF3B70',
    shadowColor: '#FF3B70',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 5,
    elevation: 5,
  },
  techSectionTitle: {
    fontSize: 13,
    fontFamily: Fonts.bold,
    letterSpacing: 2,
  },
  techInput: {
    fontSize: 14,
    fontFamily: Fonts.regular,
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    marginBottom: 15,
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  techTextArea: {
    height: 120,
    borderWidth: 1,
    borderRadius: 8,
    padding: 15,
    lineHeight: 22,
  },
  techLabel: {
    fontSize: 11,
    fontFamily: Fonts.subheading,
    letterSpacing: 1.5,
    marginTop: 10,
    marginBottom: 15,
  },
  techTypeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  techTypeCard: {
    width: '47%',
    paddingVertical: 15,
    paddingHorizontal: 10,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  techTypeCardSelected: {
    backgroundColor: '#FF3B70',
    shadowColor: '#FF3B70',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 5,
  },
  techTypeIcon: {
    marginBottom: 2,
  },
  techTypeCardText: {
    fontSize: 10,
    fontFamily: Fonts.bold,
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  techTypeCardTextSelected: {
    color: '#FFF',
  },
  techMapWrapper: {
    height: 200,
    borderWidth: 1,
    marginBottom: 20,
    position: 'relative',
    backgroundColor: '#000',
  },
  cornerBracket: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderColor: '#FF3B70',
    zIndex: 10,
  },
  topLeftBracket: {
    top: -1, left: -1,
    borderTopWidth: 2, borderLeftWidth: 2,
  },
  topRightBracket: {
    top: -1, right: -1,
    borderTopWidth: 2, borderRightWidth: 2,
  },
  bottomLeftBracket: {
    bottom: -1, left: -1,
    borderBottomWidth: 2, borderLeftWidth: 2,
  },
  bottomRightBracket: {
    bottom: -1, right: -1,
    borderBottomWidth: 2, borderRightWidth: 2,
  },
  techLocationButton: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF3B70',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    gap: 6,
    shadowColor: '#FF3B70',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
    elevation: 5,
  },
  techLocationButtonText: {
    fontSize: 10,
    fontFamily: Fonts.bold,
    letterSpacing: 1,
    color: '#FFF',
  },
  techDivider: {
    height: 1,
    marginVertical: 20,
  },
  techSelectedCountText: {
    fontSize: 10,
    fontFamily: Fonts.bold,
    letterSpacing: 2,
    marginBottom: 10,
  },
  techEmptyMediaBox: {
    marginTop: 10,
    borderRadius: 8,
    padding: 25,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderStyle: 'dashed',
    gap: 12,
  },
  techEmptyMediaText: {
    fontSize: 10,
    fontFamily: Fonts.subheading,
    letterSpacing: 1.5,
  },
  techSubmitButtonContainer: {
    marginTop: 15,
    shadowColor: '#FF3B70',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.5,
    shadowRadius: 15,
    elevation: 10,
  },
  techSubmitGradientButton: {
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
  },
  techSubmitButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  techSubmitButtonText: {
    color: 'white',
    fontSize: 14,
    fontFamily: Fonts.heading,
    letterSpacing: 2.5,
  },
  mediaListContainer: {
    marginTop: 15,
    gap: 12,
  },
  disabledButton: {
    opacity: 0.6,
  },
});
