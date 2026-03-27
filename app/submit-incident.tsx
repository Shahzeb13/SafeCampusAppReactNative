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
  Platform
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

import MediaPreview from '@/components/MediaPreview';
import MediaPicker from '@/components/MediaPicker';



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
  const [media, setMedia] = useState<IncidentMedia | null>(null);

  const [region, setRegion] = useState<Region>({
    latitude: 33.6844, // Default Islamabad
    longitude: 73.0479,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  });

  const router = useRouter();
  const { showSnackbar } = useSnackbar();

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
      formData.append('title', title);
      formData.append('description', description);
      formData.append('incidentType', incidentType);
      formData.append('locationText', locationText);

      if (latitude !== undefined) formData.append('latitude', latitude.toString());
      if (longitude !== undefined) formData.append('longitude', longitude.toString());

      // Append voice note if it exists
      if (voiceNote) {
        // Extract filename from URI or provide a default
        const fileName = voiceNote.uri.split('/').pop() || 'voiceNote.m4a';

        formData.append('voiceNote', {
          uri: voiceNote.uri,
          name: fileName,
          type: 'audio/m4a', // Defaulting to m4a as it's common for Expo
        } as any);

        formData.append('voiceDuration', voiceNote.durationMs.toString());
      }

      // Note: Passing formData to createIncident. 
      // The current service expects CreateIncidentBody object, 
      // but we are preparing it for FormData as requested.
      await incidentService.createIncident(formData as any);

      showSnackbar('Incident reported successfully', 'success');
      router.back();
    } catch (error: any) {
      showSnackbar(error.response?.data?.message || 'Failed to report incident', 'error');
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

          <Text style={styles.label}>Location</Text>

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
                <MaterialCommunityIcons name="crosshairs-gps" size={20} color="#1A237E" />
              )}
              <Text style={styles.locationButtonText}>Get Location</Text>
            </TouchableOpacity>
          </View>

          <TextInput
            style={styles.input}
            placeholder="Where did it happen? (e.g. Library 2nd Floor)"
            value={locationText}
            onChangeText={setLocationText}
          />

          <VoiceRecorder setVoiceNote={setVoiceNote} />

          {voiceNote && <VoicePlayer voiceNote={voiceNote} setVoiceNote={setVoiceNote} />}


          <MediaPicker setMedia={setMedia} />

          {media && <MediaPreview media={media} setMedia={setMedia} />}
          <Text style={styles.label}>Description</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Provide details about what happened..."
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />


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
    gap: 15,
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
