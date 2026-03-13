import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function ProfileScreen() {
  const { user, logout } = useAuth();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.avatarContainer}>
          <MaterialCommunityIcons name="account" size={60} color="#FF3B70" />
        </View>
        <Text style={styles.name}>{user?.username}</Text>
        <Text style={styles.email}>{user?.email}</Text>
        <View style={styles.roleBadge}>
          <Text style={styles.roleText}>{user?.role?.toUpperCase()}</Text>
        </View>
      </View>

      <View style={styles.menu}>
        <TouchableOpacity style={styles.menuItem}>
          <MaterialCommunityIcons name="account-edit-outline" size={24} color="#616161" />
          <Text style={styles.menuText}>Edit Profile</Text>
          <MaterialCommunityIcons name="chevron-right" size={24} color="#BDBDBD" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem}>
          <MaterialCommunityIcons name="shield-outline" size={24} color="#616161" />
          <Text style={styles.menuText}>Safety Awareness</Text>
          <MaterialCommunityIcons name="chevron-right" size={24} color="#BDBDBD" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem}>
          <MaterialCommunityIcons name="help-circle-outline" size={24} color="#616161" />
          <Text style={styles.menuText}>Help & Support</Text>
          <MaterialCommunityIcons name="chevron-right" size={24} color="#BDBDBD" />
        </TouchableOpacity>

        <TouchableOpacity style={[styles.menuItem, styles.logoutItem]} onPress={logout}>
          <MaterialCommunityIcons name="logout" size={24} color="#F44336" />
          <Text style={[styles.menuText, { color: '#F44336' }]}>Logout</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.version}>SafeCampus v1.0.0</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    backgroundColor: 'white',
    padding: 30,
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
    marginTop: 'auto',
    marginBottom: 20,
  },
});
