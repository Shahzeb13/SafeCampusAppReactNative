import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors, Fonts } from '@/constants/theme';
import { useSnackbar } from '../context/SnackbarContext';
import { API_BASE_URL } from '@/config/api';
import axios from 'axios';
import { handleApiError } from '../utils/errorHandling';

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { showSnackbar } = useSnackbar();

  const handleRequestOTP = async () => {
    if (!email) {
      showSnackbar('Please enter your email address', 'error');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`${API_BASE_URL}/auth/forgot-password`, { email });
      if (response.data.success) {
        showSnackbar('OTP sent to your email', 'success');
        router.push({
          pathname: '/reset-password',
          params: { email }
        });
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
      <LinearGradient colors={['#FF4B6C', '#FF8EBC']} style={styles.topBlob} />
      
      <TouchableOpacity 
        style={styles.backButton} 
        onPress={() => router.back()}
      >
        <MaterialCommunityIcons name="arrow-left" size={28} color="white" />
      </TouchableOpacity>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={[styles.card, { backgroundColor: theme.background }]}>
            <View style={styles.iconContainer}>
              <MaterialCommunityIcons name="lock-reset" size={60} color="#FF3B70" />
            </View>

            <Text style={[styles.title, { color: theme.text }]}>Forgot Password?</Text>
            <Text style={[styles.subtitle, { color: theme.icon }]}>
              Enter your email address and we'll send you an OTP to reset your password.
            </Text>

            <View style={[styles.inputContainer, { backgroundColor: colorScheme === 'dark' ? '#1A1A1A' : '#F7F7F7' }]}>
              <MaterialCommunityIcons name="email-outline" size={24} color="#FF3B70" style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: theme.text }]}
                placeholder="you@example.com"
                placeholderTextColor={theme.icon}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <TouchableOpacity 
              activeOpacity={0.8} 
              onPress={handleRequestOTP}
              disabled={loading}
            >
              <LinearGradient
                colors={['#FF4B6C', '#FF8EBC']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.button}
              >
                <Text style={styles.buttonText}>{loading ? 'SENDING OTP...' : 'SEND OTP'}</Text>
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
    backgroundColor: '#FAF9F6',
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
  backButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    zIndex: 10,
    padding: 10,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  card: {
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
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontFamily: Fonts.regular,
    fontSize: 14,
    marginBottom: 30,
    textAlign: 'center',
    lineHeight: 20,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 15,
    marginBottom: 25,
    paddingHorizontal: 15,
    width: '100%',
    height: 55,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 16,
    fontFamily: Fonts.regular,
  },
  button: {
    width: 250,
    height: 55,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
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
    letterSpacing: 1,
  },
});
