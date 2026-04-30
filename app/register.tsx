import React, { useState } from 'react';
import { Fonts } from '@/constants/theme';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Link, useRouter } from 'expo-router';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';
import { useSnackbar } from '../context/SnackbarContext';
import { API_BASE_URL } from '@/config/api';
import axios from 'axios';
import { handleApiError } from '../utils/errorHandling';

export default function RegisterScreen() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'student' | 'staff'>('student');
  const [rollNumber, setRollNumber] = useState('');
  const [universityName, setUniversityName] = useState('');
  const [departmentName, setDepartmentName] = useState('');
  const [program, setProgram] = useState('');
  const [semester, setSemester] = useState('');
  const [section, setSection] = useState('');
  const [loading, setLoading] = useState(false);
  
  const router = useRouter();
  const { showSnackbar } = useSnackbar();

  const handleRegister = async () => {
    if (!username || !email || !password || !universityName || !departmentName) {
      showSnackbar('Please fill in all required fields', 'error');
      return;
    }

    if (role === 'student' && (!rollNumber || !program || !semester)) {
      showSnackbar('Please fill in student details', 'error');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`${API_BASE_URL}/auth/register`, {
        username,
        email,
        password,
        role,
        rollNumber,
        universityName,
        departmentName,
        program,
        semester,
        section,
        avatar: null
      }, {
        timeout: 10000,
      });

      if (response.data) {
        showSnackbar('Account created successfully', 'success');
        router.replace('/login');
      }
    } catch (error) {
      handleApiError(error, showSnackbar);
    } finally {
      setLoading(false); 
    }
  };

  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];

  return (
    <View style={[styles.container, { backgroundColor: colorScheme === 'dark' ? '#000' : '#FAF9F6' }]}>
      {/* Background Blobs */}
      <LinearGradient
        colors={['#FF4B6C', '#FF8EBC']}
        style={styles.topBlob}
      />
      <LinearGradient
        colors={['#FF4B6C', '#FF8EBC']}
        style={styles.bottomBlob}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={[styles.card, { backgroundColor: theme.background }]}>
            <View style={styles.iconContainer}>
              <MaterialCommunityIcons name="account-plus" size={60} color="#FF3B70" />
            </View>

            <Text style={[styles.title, { color: theme.text }]}>Welcome Back</Text>
            <Text style={[styles.subtitle, { color: theme.icon }]}>Sign up to continue to your account</Text>

            <View style={[styles.inputContainer, { backgroundColor: colorScheme === 'dark' ? '#1A1A1A' : '#F7F7F7' }]}>
              <MaterialCommunityIcons name="account-outline" size={24} color="#FF3B70" style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: theme.text }]}
                placeholder="Username"
                placeholderTextColor={theme.icon}
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
              />
            </View>

            <View style={[styles.inputContainer, { backgroundColor: colorScheme === 'dark' ? '#1A1A1A' : '#F7F7F7' }]}>
              <MaterialCommunityIcons name="email-outline" size={24} color="#FF3B70" style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: theme.text }]}
                placeholder="Email"
                placeholderTextColor={theme.icon}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={[styles.inputContainer, { backgroundColor: colorScheme === 'dark' ? '#1A1A1A' : '#F7F7F7' }]}>
              <MaterialCommunityIcons name="lock-outline" size={24} color="#FF3B70" style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: theme.text }]}
                placeholder="Type Your Password Here"
                placeholderTextColor={theme.icon}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
            </View>

            {/* Role Selection */}
            <View style={styles.roleContainer}>
              <TouchableOpacity 
                style={[
                  styles.roleButton, 
                  { backgroundColor: colorScheme === 'dark' ? '#1A1A1A' : '#F7F7F7', borderColor: colorScheme === 'dark' ? '#333' : '#E0E0E0' },
                  role === 'student' && styles.activeRoleButton
                ]}
                onPress={() => setRole('student')}
              >
                <Text style={[styles.roleButtonText, { color: theme.icon }, role === 'student' && styles.activeRoleButtonText]}>Student</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[
                  styles.roleButton, 
                  { backgroundColor: colorScheme === 'dark' ? '#1A1A1A' : '#F7F7F7', borderColor: colorScheme === 'dark' ? '#333' : '#E0E0E0' },
                  role === 'staff' && styles.activeRoleButton
                ]}
                onPress={() => setRole('staff')}
              >
                <Text style={[styles.roleButtonText, { color: theme.icon }, role === 'staff' && styles.activeRoleButtonText]}>Staff</Text>
              </TouchableOpacity>
            </View>

            {/* University Fields */}
            <View style={[styles.inputContainer, { backgroundColor: colorScheme === 'dark' ? '#1A1A1A' : '#F7F7F7' }]}>
              <MaterialCommunityIcons name="school-outline" size={24} color="#FF3B70" style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: theme.text }]}
                placeholder="University Name"
                placeholderTextColor={theme.icon}
                value={universityName}
                onChangeText={setUniversityName}
              />
            </View>

            <View style={[styles.inputContainer, { backgroundColor: colorScheme === 'dark' ? '#1A1A1A' : '#F7F7F7' }]}>
              <MaterialCommunityIcons name="office-building-marker-outline" size={24} color="#FF3B70" style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: theme.text }]}
                placeholder="Department Name"
                placeholderTextColor={theme.icon}
                value={departmentName}
                onChangeText={setDepartmentName}
              />
            </View>

            {role === 'student' && (
              <>
                <View style={[styles.inputContainer, { backgroundColor: colorScheme === 'dark' ? '#1A1A1A' : '#F7F7F7' }]}>
                  <MaterialCommunityIcons name="card-account-details-outline" size={24} color="#FF3B70" style={styles.inputIcon} />
                  <TextInput
                    style={[styles.input, { color: theme.text }]}
                    placeholder="Roll Number"
                    placeholderTextColor={theme.icon}
                    value={rollNumber}
                    onChangeText={setRollNumber}
                  />
                </View>

                <View style={[styles.inputContainer, { backgroundColor: colorScheme === 'dark' ? '#1A1A1A' : '#F7F7F7' }]}>
                  <MaterialCommunityIcons name="book-open-outline" size={24} color="#FF3B70" style={styles.inputIcon} />
                  <TextInput
                    style={[styles.input, { color: theme.text }]}
                    placeholder="Program (e.g. BSCS)"
                    placeholderTextColor={theme.icon}
                    value={program}
                    onChangeText={setProgram}
                  />
                </View>

                <View style={[styles.inputContainer, { backgroundColor: colorScheme === 'dark' ? '#1A1A1A' : '#F7F7F7' }]}>
                  <MaterialCommunityIcons name="numeric" size={24} color="#FF3B70" style={styles.inputIcon} />
                  <TextInput
                    style={[styles.input, { color: theme.text }]}
                    placeholder="Semester"
                    placeholderTextColor={theme.icon}
                    value={semester}
                    onChangeText={setSemester}
                    keyboardType="numeric"
                  />
                </View>
              </>
            )}

            <View style={[styles.inputContainer, { backgroundColor: colorScheme === 'dark' ? '#1A1A1A' : '#F7F7F7' }]}>
              <MaterialCommunityIcons name="group" size={24} color="#FF3B70" style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: theme.text }]}
                placeholder="Section (Optional)"
                placeholderTextColor={theme.icon}
                value={section}
                onChangeText={setSection}
              />
            </View>

            <TouchableOpacity 
              activeOpacity={0.8} 
              onPress={handleRegister}
              disabled={loading}
            >
              <LinearGradient
                colors={['#FF4B6C', '#FF8EBC']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.button}
              >
                <Text style={styles.buttonText}>{loading ? 'Signing up...' : 'Sign up'}</Text>
              </LinearGradient>
            </TouchableOpacity>

            <View style={styles.footer}>
              <Text style={[styles.footerText, { color: theme.text }]}>Already Have an Account! </Text>
              <Link href="/login" asChild>
                <TouchableOpacity>
                  <Text style={styles.linkText}>Sign In</Text>
                </TouchableOpacity>
              </Link>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF9F6',
    overflow: 'hidden',
  },
  topBlob: {
    position: 'absolute',
    top: -80,
    right: -50,
    width: 280,
    height: 280,
    borderRadius: 140,
    opacity: 0.8,
  },
  bottomBlob: {
    position: 'absolute',
    bottom: -150,
    left: -100,
    width: 400,
    height: 400,
    borderRadius: 200,
    opacity: 0.8,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
    zIndex: 1,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 40,
    padding: 30,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 15 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 8,
  },
  iconContainer: {
    marginBottom: 20,
  },
  title: {
    fontFamily: Fonts.heading,
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1A237E',
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontFamily: Fonts.regular,
    fontSize: 14,
    color: '#9E9E9E',
    marginBottom: 30,
    textAlign: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F7F7F7',
    borderRadius: 15,
    marginBottom: 15,
    paddingHorizontal: 15,
    width: '100%',
    height: 55,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    color: '#333',
    fontSize: 16,
    fontFamily: Fonts.regular,
  },
  button: {
    width: 250,
    height: 55,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
    shadowColor: '#FF4B6C',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: Fonts.bold,
  },
  footer: {
    flexDirection: 'row',
    marginTop: 25,
  },
  footerText: {
    color: '#333',
    fontSize: 14,
    fontFamily: Fonts.regular,
  },
  linkText: {
    color: '#FF3B70',
    fontSize: 14,
    fontWeight: 'bold',
    fontFamily: Fonts.bold,
  },
  roleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 20,
    gap: 10,
  },
  roleButton: {
    flex: 1,
    height: 45,
    borderRadius: 12,
    backgroundColor: '#F7F7F7',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  activeRoleButton: {
    backgroundColor: '#FF3B70',
    borderColor: '#FF3B70',
  },
  roleButtonText: {
    color: '#666',
    fontWeight: '600',
    fontFamily: Fonts.medium,
  },
  activeRoleButtonText: {
    color: 'white',
  },
});
