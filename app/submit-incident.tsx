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
import * as Location from 'expo-location';
import MapView, { Marker, Region } from 'react-native-maps';
import { useSnackbar } from '../context/SnackbarContext';
import { incidentService } from '../services/incidentService';
import { IncidentType } from '../types/incident';
import VoiceRecorder from '@/components/VoiceRecorder';
import VoicePlayer from '@/components/voicePlayer';
import { VoiceNote } from '@/types/voiceNote';
import { IncidentMedia } from '@/types/incidentMedia';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { handleApiError } from '../utils/errorHandling';


import MediaPreview from '@/components/MediaPreview';
import MediaPicker from '@/components/MediaPicker';
import CameraCapture from '@/components/CameraCapture';

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

export default function SubmitIncidentScreen() {
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

  const [region, setRegion] = useState<Region>({
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
      // Replace existing video if any, or just add if none
      setMediaList(prev => {
        const filtered = prev.filter(m => m.type !== 'video');
        return [...filtered, newMedia];
      });
    } else {
      // Add image if under limit
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

      // Reverse geocode
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

  const handleMapPress = async (e: any) => {
    const { latitude, longitude } = e.nativeEvent.coordinate;
    setLatitude(latitude);
    setLongitude(longitude);

    try {
      const [address] = await Location.reverseGeocodeAsync({ latitude, longitude });
      if (address) {
        const text = `${address.name || ''} ${address.street || ''}, ${address.city || ''}`.trim();
        setLocationText(text);
      }
    } catch (error) {
      console.log('Reverse geocode error', error);
    }
  };

  const handleSubmit = async () => {
    if (!title || !description || !incidentType || !locationText) {
      showSnackbar('Please fill in all required fields', 'error');
      return;
    }

    setLoading(true);

    try {
      // Prepare FormData for backend integration
      const formData = new FormData();
      
      // Append text fields
      formData.append('title', title);
      formData.append('description', description);
      formData.append('incidentType', incidentType);
      formData.append('locationText', locationText);

      // Append numeric values as strings (FormData expects strings)
      if (latitude !== undefined) formData.append('latitude', String(latitude));
      if (longitude !== undefined) formData.append('longitude', String(longitude));

      // Append audio (voice note) if it exists
      if (voiceNote) {
        formData.append('audio', {
          uri: voiceNote.uri,
          name: voiceNote.uri.split('/').pop() || 'voice_note.m4a',
          type: 'audio/m4a',
        } as any);

        formData.append('voiceDuration', String(voiceNote.durationMs));
      }

      // Append multiple images using the 'images' key
      mediaList
        .filter(item => item.type === 'image')
        .forEach((image, index) => {
          formData.append('images', {
            uri: image.uri,
            name: image.fileName || `image_${Date.now()}_${index}.jpg`,
            type: 'image/jpeg',
          } as any);
        });

      // Append single video using the 'video' key
      const videoMedia = mediaList.find(item => item.type === 'video');
      if (videoMedia) {
        formData.append('video', {
          uri: videoMedia.uri,
          name: videoMedia.fileName || `video_${Date.now()}.mp4`,
          type: 'video/mp4',
        } as any);
      }

      // Submit to service (axios automatically handles Content-Type for FormData)
      await incidentService.createIncident(formData as any);

      await clearDraft(); // Clear draft on successful submission
      showSnackbar('Incident reported successfully', 'success');
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
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <MaterialCommunityIcons name="arrow-left" size={24} color="#1A237E" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Report Incident</Text>
          <View style={{ width: 24 }} />
        </View>

        <View style={styles.form}>
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons name="information-outline" size={20} color="#1A237E" />
              <Text style={styles.sectionTitle}>Incident Details</Text>
            </View>
            
            <Text style={styles.label}>Title</Text>
            <TextInput
              style={styles.input}
              placeholder="Brief title of the incident"
              value={title}
              onChangeText={setTitle}
            />

            <Text style={styles.label}>Incident Type</Text>
            <View style={styles.typeContainer}>
              {INCIDENT_TYPES.map((type) => (
                <TouchableOpacity
                  key={type.value}
                  style={[
                    styles.typeChip,
                    incidentType === type.value && styles.selectedChip
                  ]}
                  onPress={() => setIncidentType(type.value)}
                >
                  <Text style={[
                    styles.chipText,
                    incidentType === type.value && styles.selectedChipText
                  ]}>
                    {type.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons name="map-marker-radius-outline" size={20} color="#1A237E" />
              <Text style={styles.sectionTitle}>Location Information</Text>
            </View>

            <View style={styles.mapWrapper}>
              <MapView
                style={styles.map}
                region={region}
                onPress={handleMapPress}
                showsUserLocation
              >
                {(latitude && longitude) && (
                  <Marker coordinate={{ latitude, longitude }} />
                )}
              </MapView>

              <TouchableOpacity
                style={styles.locationButton}
                onPress={getCurrentLocation}
                disabled={locLoading}
              >
                {locLoading ? (
                  <ActivityIndicator color="#1A237E" size="small" />
                ) : (
                  <MaterialCommunityIcons name="crosshairs-gps" size={18} color="#1A237E" />
                )}
                <Text style={styles.locationButtonText}>Detect Location</Text>
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.input}
              placeholder="e.g. Near Library, Main Entrance"
              value={locationText}
              onChangeText={setLocationText}
            />
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons name="paperclip" size={20} color="#1A237E" />
              <Text style={styles.sectionTitle}>EVIDENCE & RECORDINGS</Text>
            </View>

            {/* Voice Recording Section */}
            <VoiceRecorder setVoiceNote={setVoiceNote} />
            {voiceNote && <VoicePlayer voiceNote={voiceNote} setVoiceNote={setVoiceNote} />}

            <View style={styles.divider} />

            {/* Visual Media Section */}
            <MediaPicker 
              onPickMedia={handleMediaAdd} 
              onOpenCamera={handleOpenCamera} 
            />

            {mediaList.length > 0 ? (
              <View style={styles.mediaListContainer}>
                <Text style={styles.selectedCountText}>
                  {mediaList.length} attachment{mediaList.length > 1 ? 's' : ''} selected
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
              <View style={styles.emptyMediaBox}>
                <MaterialCommunityIcons name="image-off-outline" size={24} color="#BDBDBD" />
                <Text style={styles.emptyMediaText}>No images or video attached yet</Text>
              </View>
            )}
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons name="text-box-outline" size={20} color="#1A237E" />
              <Text style={styles.sectionTitle}>Narrative</Text>
            </View>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Provide more specific details about the event..."
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
            style={[styles.submitButton, loading && styles.disabledButton]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.submitButtonText}>SUBMIT REPORT</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  content: {
    padding: 20,
    paddingTop: 50,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1A237E',
  },
  form: {
    gap: 20,
  },
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    gap: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
    paddingBottom: 8,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1A237E',
    letterSpacing: 0.5,
  },
  divider: {
    height: 1,
    backgroundColor: '#F0F0F0',
    marginVertical: 16,
    width: '100%',
  },
  mediaListContainer: {
    marginTop: 20,
    gap: 12,
  },
  selectedCountText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#757575',
    marginBottom: 4,
    marginLeft: 4,
    textTransform: 'uppercase',
  },
  emptyMediaBox: {
    marginTop: 10,
    backgroundColor: '#FAFAFA',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#EEEEEE',
    borderStyle: 'dashed',
    gap: 8,
  },
  emptyMediaText: {
    fontSize: 13,
    color: '#9E9E9E',
    fontWeight: '600',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#424242',
    marginBottom: 5,
  },
  input: {
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 15,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  textArea: {
    height: 120,
  },
  typeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 10,
  },
  typeChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  selectedChip: {
    backgroundColor: '#FF3B70',
    borderColor: '#FF3B70',
  },
  chipText: {
    fontSize: 13,
    color: '#666',
  },
  selectedChipText: {
    color: 'white',
    fontWeight: 'bold',
  },
  submitButton: {
    backgroundColor: '#FF3B70',
    borderRadius: 15,
    padding: 18,
    alignItems: 'center',
    marginTop: 20,
    shadowColor: '#FF3B70',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  disabledButton: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  mapWrapper: {
    height: 200,
    borderRadius: 15,
    overflow: 'hidden',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    position: 'relative',
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  locationButton: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    backgroundColor: 'white',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    gap: 5,
  },
  locationButtonText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1A237E',
  },
});
