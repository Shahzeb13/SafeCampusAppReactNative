import React from 'react';
import { View, Text, StyleSheet, Switch } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface StatusCardProps {
  isEnabled: boolean;
  onToggle: () => void;
}

export const StatusCard: React.FC<StatusCardProps> = ({ isEnabled, onToggle }) => {
  return (
    <View style={[styles.container, !isEnabled && styles.containerDisabled]}>
      <View style={styles.leftContent}>
        <View style={styles.statusRow}>
          <View style={[styles.dot, !isEnabled && styles.dotDisabled]} />
          <Text style={[styles.title, !isEnabled && styles.titleDisabled]}>
            {isEnabled ? 'Connected to Emergency Server' : 'Monitoring Paused'}
          </Text>
        </View>
        <Text style={[styles.subtitle, !isEnabled && styles.subtitleDisabled]}>
          {isEnabled ? 'All systems operational' : 'Private mode active'}
        </Text>
      </View>
      <View style={styles.rightContent}>
        <View style={styles.checkBadge}>
          <MaterialCommunityIcons 
            name={isEnabled ? "check-circle" : "shield-off"} 
            size={20} 
            color={isEnabled ? "#4CAF50" : "#757575"} 
          />
        </View>
        <Switch 
          value={isEnabled} 
          onValueChange={onToggle}
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
  containerDisabled: {
    backgroundColor: '#F5F5F5',
    borderColor: '#E0E0E0',
  },
  dotDisabled: {
    backgroundColor: '#9E9E9E',
  },
  titleDisabled: {
    color: '#616161',
  },
  subtitleDisabled: {
    color: '#9E9E9E',
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
