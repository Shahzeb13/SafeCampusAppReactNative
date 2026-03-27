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
import { useSnackbar } from '../context/SnackbarContext';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '@/config/api';
import axios from 'axios';
import { handleApiError } from '../utils/errorHandling';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { showSnackbar } = useSnackbar();
  const { login } = useAuth();

  const handleLogin = async () => {
    if (!email || !password) {
      showSnackbar('Please fill in all fields', 'error');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`${API_BASE_URL}/auth/login`, {
        email,
        password,
      }, {
        timeout: 10000,
      });

      if (response.data) {
        showSnackbar('Logged in successfully', 'success');
        
        // Use the context login function
        // setting up login context  here 
        login({
          id: response.data.id || response.data.userId,
          username: response.data.username,
          email: response.data.email,
          role: response.data.role,
          avatar: response.data.avatar,
        }, response.data.token);

        // Navigate to main app
        router.replace('/(tabs)');
      }
    } catch (error) {
      handleApiError(error, showSnackbar);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
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
          <View style={styles.card}>
            <View style={styles.iconContainer}>
              <MaterialCommunityIcons name="login-variant" size={60} color="#FF3B70" />
            </View>

            <Text style={styles.title}>Welcome Back to SafeCampus</Text>
            <Text style={styles.subtitle}>Sign in to continue to your account</Text>

            <View style={styles.inputContainer}>
              <MaterialCommunityIcons name="email-outline" size={24} color="#FF3B70" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="you@example.com"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputContainer}>
              <MaterialCommunityIcons name="lock-outline" size={24} color="#FF3B70" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Enter your Password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
            </View>

            <TouchableOpacity 
              activeOpacity={0.8} 
              onPress={handleLogin}
              disabled={loading}
            >
              <LinearGradient
                colors={['#FF4B6C', '#FF8EBC']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.button}
              >
                <Text style={styles.buttonText}>{loading ? 'SIGNING IN...' : 'SIGN IN'}</Text>
              </LinearGradient>
            </TouchableOpacity>

            <View style={styles.footer}>
              <Text style={styles.footerText}>Don't have an Account? </Text>
              <Link href="/register" asChild>
                <TouchableOpacity>
                  <Text style={styles.linkText}>Sign up</Text>
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
    letterSpacing: 1,
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
});
