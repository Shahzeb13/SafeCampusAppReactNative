import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../context/AuthContext';
import { useSnackbar } from '../context/SnackbarContext';
import { Colors, Fonts } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import axios from 'axios';
import { API_BASE_URL } from '@/config/api';
import { handleApiError } from '../utils/errorHandling';

export default function EditProfileScreen() {
  const { user, updateUser, token } = useAuth();
  const { showSnackbar } = useSnackbar();
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];

  const [username, setUsername] = useState(user?.username || '');
  const [rollNumber, setRollNumber] = useState(user?.rollNumber || '');
  const [universityName, setUniversityName] = useState(user?.universityName || '');
  const [departmentName, setDepartmentName] = useState(user?.departmentName || '');
  const [program, setProgram] = useState(user?.program || '');
  const [semester, setSemester] = useState(user?.semester || '');
  const [section, setSection] = useState(user?.section || '');
  const [avatar, setAvatar] = useState<string | null>(user?.avatar || null);
  const [loading, setLoading] = useState(false);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      setAvatar(result.assets[0].uri);
    }
  };

  const handleUpdate = async () => {
    if (!username) {
      showSnackbar('Username is required', 'error');
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('username', username);
      formData.append('rollNumber', rollNumber);
      formData.append('universityName', universityName);
      formData.append('departmentName', departmentName);
      formData.append('program', program);
      formData.append('semester', semester);
      formData.append('section', section);

      if (avatar && avatar !== user?.avatar) {
        formData.append('avatar', {
          uri: avatar,
          name: 'avatar.jpg',
          type: 'image/jpeg',
        } as any);
      }

      const response = await axios.put(`${API_BASE_URL}/users/profile`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`
        },
      });

      if (response.data.success) {
        updateUser(response.data.user);
        showSnackbar('Profile updated successfully', 'success');
        router.back();
      }
    } catch (error) {
      handleApiError(error, showSnackbar);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colorScheme === 'dark' ? '#000' : '#FAF9FB' }]}>
      <LinearGradient colors={['#FF4B6C', '#FF8EBC']} style={styles.topBlob} />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <MaterialCommunityIcons name="chevron-left" size={30} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Edit Profile</Text>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          <View style={styles.avatarSection}>
            <TouchableOpacity onPress={pickImage} style={styles.avatarContainer}>
              {avatar ? (
                <Image source={{ uri: avatar }} style={styles.avatar} />
              ) : (
                <View style={[styles.avatarPlaceholder, { backgroundColor: colorScheme === 'dark' ? '#1A1A1A' : '#F5F5F5' }]}>
                  <MaterialCommunityIcons name="account" size={60} color="#FF3B70" />
                </View>
              )}
              <View style={styles.editIconContainer}>
                <MaterialCommunityIcons name="camera" size={20} color="white" />
              </View>
            </TouchableOpacity>
            <Text style={[styles.avatarText, { color: theme.icon }]}>Tap to change avatar</Text>
          </View>

          <View style={styles.form}>
            <Text style={[styles.label, { color: theme.text }]}>Full Name</Text>
            <View style={[styles.inputContainer, { backgroundColor: colorScheme === 'dark' ? '#1A1A1A' : '#F5F5F5' }]}>
              <MaterialCommunityIcons name="account-outline" size={20} color="#FF3B70" style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: theme.text }]}
                value={username}
                onChangeText={setUsername}
                placeholder="Enter your name"
                placeholderTextColor={theme.icon}
              />
            </View>

            <Text style={[styles.label, { color: theme.text }]}>Roll Number</Text>
            <View style={[styles.inputContainer, { backgroundColor: colorScheme === 'dark' ? '#1A1A1A' : '#F5F5F5' }]}>
              <MaterialCommunityIcons name="card-account-details-outline" size={20} color="#FF3B70" style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: theme.text }]}
                value={rollNumber}
                onChangeText={setRollNumber}
                placeholder="e.g. 21F-BSCS-01"
                placeholderTextColor={theme.icon}
              />
            </View>

            <Text style={[styles.label, { color: theme.text }]}>University</Text>
            <View style={[styles.inputContainer, { backgroundColor: colorScheme === 'dark' ? '#1A1A1A' : '#F5F5F5' }]}>
              <MaterialCommunityIcons name="school-outline" size={20} color="#FF3B70" style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: theme.text }]}
                value={universityName}
                onChangeText={setUniversityName}
                placeholder="University Name"
                placeholderTextColor={theme.icon}
              />
            </View>

            <View style={styles.row}>
              <View style={{ flex: 1, marginRight: 10 }}>
                <Text style={[styles.label, { color: theme.text }]}>Department</Text>
                <View style={[styles.inputContainer, { backgroundColor: colorScheme === 'dark' ? '#1A1A1A' : '#F5F5F5' }]}>
                  <TextInput
                    style={[styles.input, { color: theme.text }]}
                    value={departmentName}
                    onChangeText={setDepartmentName}
                    placeholder="e.g. CS"
                    placeholderTextColor={theme.icon}
                  />
                </View>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.label, { color: theme.text }]}>Program</Text>
                <View style={[styles.inputContainer, { backgroundColor: colorScheme === 'dark' ? '#1A1A1A' : '#F5F5F5' }]}>
                  <TextInput
                    style={[styles.input, { color: theme.text }]}
                    value={program}
                    onChangeText={setProgram}
                    placeholder="e.g. BSCS"
                    placeholderTextColor={theme.icon}
                  />
                </View>
              </View>
            </View>

            <View style={styles.row}>
              <View style={{ flex: 1, marginRight: 10 }}>
                <Text style={[styles.label, { color: theme.text }]}>Semester</Text>
                <View style={[styles.inputContainer, { backgroundColor: colorScheme === 'dark' ? '#1A1A1A' : '#F5F5F5' }]}>
                  <TextInput
                    style={[styles.input, { color: theme.text }]}
                    value={semester}
                    onChangeText={setSemester}
                    placeholder="e.g. 6th"
                    placeholderTextColor={theme.icon}
                  />
                </View>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.label, { color: theme.text }]}>Section</Text>
                <View style={[styles.inputContainer, { backgroundColor: colorScheme === 'dark' ? '#1A1A1A' : '#F5F5F5' }]}>
                  <TextInput
                    style={[styles.input, { color: theme.text }]}
                    value={section}
                    onChangeText={setSection}
                    placeholder="e.g. A"
                    placeholderTextColor={theme.icon}
                  />
                </View>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.updateButton, loading && { opacity: 0.7 }]}
              onPress={handleUpdate}
              disabled={loading}
            >
              <LinearGradient
                colors={['#FF4B6C', '#FF8EBC']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.gradient}
              >
                {loading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text style={styles.updateButtonText}>Save Changes</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topBlob: {
    position: 'absolute',
    top: -100,
    right: -100,
    width: 300,
    height: 300,
    borderRadius: 150,
    opacity: 0.1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: Fonts.heading,
    fontWeight: 'bold',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  avatarSection: {
    alignItems: 'center',
    marginVertical: 20,
  },
  avatarContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    position: 'relative',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  avatarPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  editIconContainer: {
    position: 'absolute',
    bottom: 5,
    right: 5,
    backgroundColor: '#FF3B70',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'white',
  },
  avatarText: {
    marginTop: 10,
    fontSize: 14,
    fontFamily: Fonts.regular,
  },
  form: {
    marginTop: 10,
  },
  label: {
    fontSize: 14,
    fontFamily: Fonts.bold,
    marginBottom: 8,
    marginLeft: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 15,
    marginBottom: 20,
    paddingHorizontal: 15,
    height: 55,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    fontFamily: Fonts.regular,
  },
  row: {
    flexDirection: 'row',
  },
  updateButton: {
    marginTop: 20,
    height: 60,
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#FF4B6C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  gradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  updateButtonText: {
    color: 'white',
    fontSize: 18,
    fontFamily: Fonts.bold,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
});
