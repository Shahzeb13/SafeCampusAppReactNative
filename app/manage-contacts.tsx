import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../context/AuthContext';
import { User, PersonalContact } from '../types/user';
import { useSnackbar } from '../context/SnackbarContext';
import { Colors, Fonts } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import axios from 'axios';
import { API_BASE_URL } from '@/config/api';
import { handleApiError } from '../utils/errorHandling';

export default function ManageContactsScreen() {
  const { user, updateUser, token } = useAuth();
  const { showSnackbar } = useSnackbar();
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];

  const [name, setName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAddContact = async () => {
    if (!name || !phoneNumber) {
      showSnackbar('Please enter both name and phone number', 'error');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(
        `${API_BASE_URL}/users/emergency-contacts`,
        { name, phoneNumber },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        // Update local user state
        const updatedUser = { ...user!, personalEmergencyContacts: response.data.contacts };
        updateUser(updatedUser);
        
        setName('');
        setPhoneNumber('');
        showSnackbar('Emergency contact added', 'success');
      }
    } catch (error) {
      handleApiError(error, showSnackbar);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveContact = (index: number) => {
    Alert.alert(
      'Remove Contact',
      'Are you sure you want to remove this emergency contact?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await axios.delete(
                `${API_BASE_URL}/users/emergency-contacts/${index}`,
                { headers: { Authorization: `Bearer ${token}` } }
              );
              if (response.data.success) {
                const updatedUser = { ...user!, personalEmergencyContacts: response.data.contacts };
                updateUser(updatedUser);
                showSnackbar('Contact removed', 'success');
              }
            } catch (error) {
              handleApiError(error, showSnackbar);
            }
          },
        },
      ]
    );
  };

  const renderContactItem = ({ item, index }: { item: PersonalContact, index: number }) => (
    <View style={[styles.contactCard, { backgroundColor: colorScheme === 'dark' ? '#1A1A1A' : 'white' }]}>
      <View style={styles.contactInfo}>
        <View style={styles.contactIcon}>
          <MaterialCommunityIcons name="account-alert-outline" size={24} color="#FF3B70" />
        </View>
        <View>
          <Text style={[styles.contactName, { color: theme.text }]}>{item.name}</Text>
          <Text style={[styles.contactPhone, { color: theme.icon }]}>{item.phoneNumber}</Text>
        </View>
      </View>
      <TouchableOpacity onPress={() => handleRemoveContact(index)} style={styles.removeButton}>
        <MaterialCommunityIcons name="trash-can-outline" size={24} color="#FF5252" />
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colorScheme === 'dark' ? '#000' : '#F8F9FA' }]}>
      <LinearGradient colors={['#FF4B6C', '#FF8EBC']} style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <MaterialCommunityIcons name="chevron-left" size={30} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Emergency Contacts</Text>
          <View style={{ width: 30 }} />
        </View>
        <Text style={styles.headerSubtitle}>
          These contacts will be notified instantly when you trigger an SOS alert.
        </Text>
      </LinearGradient>

      <View style={styles.content}>
        <View style={[styles.addForm, { backgroundColor: colorScheme === 'dark' ? '#1A1A1A' : 'white' }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Add New Contact</Text>
          
          <View style={[styles.inputWrapper, { backgroundColor: colorScheme === 'dark' ? '#2A2A2A' : '#F5F5F5' }]}>
            <MaterialCommunityIcons name="account-outline" size={20} color="#FF3B70" />
            <TextInput
              style={[styles.input, { color: theme.text }]}
              placeholder="Contact Name"
              placeholderTextColor={theme.icon}
              value={name}
              onChangeText={setName}
            />
          </View>

          <View style={[styles.inputWrapper, { backgroundColor: colorScheme === 'dark' ? '#2A2A2A' : '#F5F5F5' }]}>
            <MaterialCommunityIcons name="phone-outline" size={20} color="#FF3B70" />
            <TextInput
              style={[styles.input, { color: theme.text }]}
              placeholder="Phone Number (e.g. +923001234567)"
              placeholderTextColor={theme.icon}
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              keyboardType="phone-pad"
            />
          </View>

          <TouchableOpacity
            style={[styles.addButton, loading && { opacity: 0.7 }]}
            onPress={handleAddContact}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <>
                <MaterialCommunityIcons name="plus" size={20} color="white" />
                <Text style={styles.addButtonText}>Add Contact</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.listSection}>
          <Text style={[styles.sectionTitle, { color: theme.text, marginBottom: 15 }]}>
            Your Trusted Circle ({user?.personalEmergencyContacts?.length || 0}/5)
          </Text>
          
          <FlatList
            data={user?.personalEmergencyContacts || []}
            renderItem={renderContactItem}
            keyExtractor={(_, index) => index.toString()}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <MaterialCommunityIcons name="account-multiple-plus-outline" size={60} color="#E0E0E0" />
                <Text style={styles.emptyText}>No emergency contacts added yet.</Text>
              </View>
            }
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 30,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 22,
    fontFamily: Fonts.heading,
    color: 'white',
    fontWeight: 'bold',
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    fontFamily: Fonts.regular,
    textAlign: 'center',
    lineHeight: 20,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  addForm: {
    padding: 20,
    borderRadius: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: Fonts.heading,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    height: 50,
    borderRadius: 12,
    marginBottom: 12,
  },
  input: {
    flex: 1,
    marginLeft: 10,
    fontSize: 15,
    fontFamily: Fonts.regular,
  },
  addButton: {
    backgroundColor: '#FF3B70',
    height: 50,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 5,
    gap: 8,
  },
  addButtonText: {
    color: 'white',
    fontSize: 16,
    fontFamily: Fonts.bold,
    fontWeight: 'bold',
  },
  listSection: {
    flex: 1,
  },
  contactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 15,
    borderRadius: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
  },
  contactInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  contactIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFF0F3',
    justifyContent: 'center',
    alignItems: 'center',
  },
  contactName: {
    fontSize: 16,
    fontFamily: Fonts.heading,
    fontWeight: '600',
  },
  contactPhone: {
    fontSize: 14,
    fontFamily: Fonts.regular,
  },
  removeButton: {
    padding: 8,
  },
  emptyState: {
    alignItems: 'center',
    marginTop: 40,
  },
  emptyText: {
    color: '#9E9E9E',
    marginTop: 15,
    fontFamily: Fonts.regular,
  },
});
