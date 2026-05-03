import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ActivityIndicator, Platform, Switch, ScrollView } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
import { testService } from '../../services/testService';
import { useSnackbar } from '../../context/SnackbarContext';
import { handleApiError } from '../../utils/errorHandling';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';
import { useTheme } from '../../context/ThemeContext';
import { backgroundSOS } from '../../services/backgroundSOS';


export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const { showSnackbar } = useSnackbar();
  const [testing, setTesting] = useState(false);
  const [bgSosEnabled, setBgSosEnabled] = useState(true);
  const isGuard = user?.role === 'security_personnel';

  useEffect(() => {
    backgroundSOS.isEnabled().then(setBgSosEnabled);
  }, []);

  const toggleBgSos = async (value: boolean) => {
    setBgSosEnabled(value);
    await backgroundSOS.setEnabled(value);
    showSnackbar(value ? 'Background SOS Active' : 'Background SOS Disabled', 'info');
  };

  const handleTestServer = async () => {
    setTesting(true);
    try {
      const result = await testService.checkServer();
      showSnackbar(result.message || 'Server is active!', 'success');
    } catch (error: any) {
      handleApiError(error, showSnackbar);
    } finally {
      setTesting(false);
    }
  };


  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];
  const { mode, setMode } = useTheme();

  const toggleTheme = () => {
    setMode(mode === 'light' ? 'dark' : 'light');
  };

  return (
    <View style={[styles.container, { backgroundColor: colorScheme === 'dark' ? '#000' : '#F8F9FA' }]}>
      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={[styles.header, { backgroundColor: theme.background }]}>
          <View style={[styles.avatarContainer, { backgroundColor: colorScheme === 'dark' ? '#1A1A1A' : '#FFF5F7' }]}>
            {user?.avatar ? (
              <Image source={{ uri: user.avatar }} style={styles.avatarImage} />
            ) : (
              <MaterialCommunityIcons name="account" size={60} color="#FF3B70" />
            )}
          </View>
          <Text style={[styles.name, { color: theme.text }]}>{user?.username}</Text>
          <Text style={[styles.email, { color: theme.icon }]}>{user?.email}</Text>
          <View style={[styles.roleBadge, { backgroundColor: colorScheme === 'dark' ? '#333' : '#E8EAF6' }]}>
            <Text style={[styles.roleText, { color: colorScheme === 'dark' ? '#FFF' : '#1A237E' }]}>{user?.role?.toUpperCase()}</Text>
          </View>
        </View>

        <View style={styles.menu}>
          <TouchableOpacity 
            style={[styles.menuItem, { backgroundColor: theme.background }]}
            onPress={() => router.push('/edit-profile')}
          >
            <MaterialCommunityIcons name="account-edit-outline" size={24} color={theme.icon} />
            <Text style={[styles.menuText, { color: theme.text }]}>Edit Profile</Text>
            <MaterialCommunityIcons name="chevron-right" size={24} color={theme.icon} />
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.menuItem, { backgroundColor: theme.background }]}
            onPress={toggleTheme}
          >
            <MaterialCommunityIcons 
              name={mode === 'dark' ? "moon-waning-crescent" : "white-balance-sunny"} 
              size={24} 
              color={mode === 'dark' ? "#BB86FC" : "#FFB300"} 
            />
            <Text style={[styles.menuText, { color: theme.text }]}>Dark Mode</Text>
            <Switch 
              value={mode === 'dark'} 
              onValueChange={toggleTheme}
              trackColor={{ false: "#767577", true: "#FF3B70" }}
              thumbColor="#fff"
            />
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.menuItem, { backgroundColor: theme.background }]}
            onPress={() => router.push('/manage-contacts')}
          >
            <MaterialCommunityIcons name="account-group-outline" size={24} color="#FF3B70" />
            <Text style={[styles.menuText, { color: theme.text }]}>
              {user?.role === 'security_personnel' ? 'Personal SOS Contacts' : 'Trusted Circle (SOS Contacts)'}
            </Text>
            <MaterialCommunityIcons name="chevron-right" size={24} color={theme.icon} />
          </TouchableOpacity>

          {!isGuard && (
            <TouchableOpacity 
                style={[styles.menuItem, { backgroundColor: theme.background }]}
                onPress={() => router.push('/(tabs)/safety')}
            >
              <MaterialCommunityIcons name="shield-outline" size={24} color={theme.icon} />
              <Text style={[styles.menuText, { color: theme.text }]}>Safety Awareness</Text>
              <MaterialCommunityIcons name="chevron-right" size={24} color={theme.icon} />
            </TouchableOpacity>
          )}

          <TouchableOpacity 
            style={[styles.menuItem, { backgroundColor: theme.background }]}
            onPress={() => router.push(isGuard ? '/guard-dashboard' as any : '/sos-history' as any)}
          >
            <MaterialCommunityIcons name="history" size={24} color="#FF3B70" />
            <Text style={[styles.menuText, { color: theme.text }]}>
              {isGuard ? 'Incident History' : 'SOS Alerts History'}
            </Text>
            <MaterialCommunityIcons name="chevron-right" size={24} color={theme.icon} />
          </TouchableOpacity>

          <View style={[styles.menuItem, { backgroundColor: theme.background, flexDirection: 'column', alignItems: 'flex-start', paddingVertical: 15 }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', width: '100%' }}>
              <MaterialCommunityIcons name="shield-lock-outline" size={24} color="#FF3B70" />
              <Text style={[styles.menuText, { color: theme.text }]}>Background Protection</Text>
              <Switch 
                value={bgSosEnabled} 
                onValueChange={toggleBgSos}
                trackColor={{ false: "#767577", true: "#FF3B70" }}
                thumbColor="#fff"
              />
            </View>
            <Text style={{ fontSize: 11, color: theme.icon, marginTop: 5, marginLeft: 39 }}>
              Enables 3x Volume Press & Shake detection when app is minimized or locked.
            </Text>
          </View>

          <TouchableOpacity 
            style={[styles.menuItem, { backgroundColor: theme.background }]} 
            onPress={handleTestServer}
            disabled={testing}
          >
            <MaterialCommunityIcons 
              name={testing ? "loading" : "server-network"} 
              size={24} 
              color={testing ? theme.icon : "#1A237E"} 
            />
            <Text style={[styles.menuText, { color: theme.text }]}>Test Server Connection</Text>
            {testing ? (
              <ActivityIndicator size="small" color="#FF3B70" />
            ) : (
              <MaterialCommunityIcons name="broadcast" size={20} color="#4CAF50" />
            )}
          </TouchableOpacity>

          <TouchableOpacity style={[styles.menuItem, styles.logoutItem, { backgroundColor: theme.background }]} onPress={logout}>
            <MaterialCommunityIcons name="logout" size={24} color="#F44336" />
            <Text style={[styles.menuText, { color: '#F44336' }]}>Logout</Text>
          </TouchableOpacity>
          
          <Text style={[styles.version, { marginVertical: 40 }]}>SafeCampus v1.0.0</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  scrollContent: {
    paddingBottom: 20,
  },
  header: {
    backgroundColor: 'white',
    padding: 30,
    paddingTop: 50,
    alignItems: 'center',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
  },
  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#FFF5F7',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 50,
  },
  name: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1A237E',
    marginBottom: 5,
  },
  email: {
    fontSize: 14,
    color: '#757575',
    marginBottom: 15,
  },
  roleBadge: {
    backgroundColor: '#E8EAF6',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  roleText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1A237E',
  },
  menu: {
    marginTop: 20,
    paddingHorizontal: 20,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 15,
    marginBottom: 10,
  },
  menuText: {
    flex: 1,
    fontSize: 16,
    color: '#424242',
    marginLeft: 15,
  },
  logoutItem: {
    marginTop: 20,
  },
  version: {
    textAlign: 'center',
    fontSize: 12,
    color: '#BDBDBD',
  },
});
