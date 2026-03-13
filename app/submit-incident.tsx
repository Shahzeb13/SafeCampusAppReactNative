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
import { useSnackbar } from '../context/SnackbarContext';
import { incidentService } from '../services/incidentService';
import { IncidentType } from '../types/incident';

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
  const [loading, setLoading] = useState(false);
  
  const router = useRouter();
  const { showSnackbar } = useSnackbar();

  const handleSubmit = async () => {
    if (!title || !description || !incidentType || !locationText) {
      showSnackbar('Please fill in all required fields', 'error');
      return;
    }

    setLoading(true);
    try {
      await incidentService.createIncident({
        title,
        description,
        incidentType: incidentType as IncidentType,
        locationText,
        mediaUrls: [],
      });
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
          <TextInput
            style={styles.input}
            placeholder="Where did it happen? (e.g. Library 2nd Floor)"
            value={locationText}
            onChangeText={setLocationText}
          />

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
});
