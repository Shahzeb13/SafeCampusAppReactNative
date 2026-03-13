import React from 'react';
import { View, Text, StyleSheet, Switch } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export const StatusCard = () => {
  return (
    <View style={styles.container}>
      <View style={styles.leftContent}>
        <View style={styles.statusRow}>
          <View style={styles.dot} />
          <Text style={styles.title}>Connected to Emergency Server</Text>
        </View>
        <Text style={styles.subtitle}>All systems operational</Text>
      </View>
      <View style={styles.rightContent}>
        <View style={styles.checkBadge}>
          <MaterialCommunityIcons name="check-circle" size={20} color="#4CAF50" />
        </View>
        <Switch 
          value={true} 
          trackColor={{ false: "#767577", true: "#673AB7" }}
          thumbColor="#fff"
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#E8F5E9',
    borderRadius: 20,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: 10,
    borderWidth: 1,
    borderColor: '#C8E6C9',
  },
  leftContent: {
    flex: 1,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4CAF50',
    marginRight: 8,
  },
  title: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#2E7D32',
  },
  subtitle: {
    fontSize: 13,
    color: '#4CAF50',
    marginLeft: 16,
  },
  rightContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  checkBadge: {
    marginRight: 4,
  }
});
