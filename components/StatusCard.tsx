import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';
import { testService } from '../services/testService';

export const StatusCard: React.FC = () => {
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];
  const isDark = colorScheme === 'dark';
  const [isServerAlive, setIsServerAlive] = useState(false);

  useEffect(() => {
    const checkServer = async () => {
      try {
        const response = await testService.checkServer();
        if (response) {
          console.log('Server Connection Response:', response);
          setIsServerAlive(true);
        }
      } catch (error) {
        console.error('Server is offline:', error);
        setIsServerAlive(false);
      }
    };

    checkServer();
    const intervalId = setInterval(checkServer, 30000);
    return () => clearInterval(intervalId);
  }, []);

  const getBackgroundColor = () => {
    if (!isServerAlive) return isDark ? '#3B1A1A' : '#FFEBEE';
    return isDark ? '#1A237E33' : '#E3F2FD';
  };

  const getBorderColor = () => {
    if (!isServerAlive) return isDark ? '#D32F2F66' : '#FFCDD2';
    return isDark ? '#1976D266' : '#BBDEFB';
  };

  const getIconColor = () => {
    if (!isServerAlive) return '#F44336';
    return '#2196F3';
  };

  return (
    <View style={[
      styles.container, 
      { backgroundColor: getBackgroundColor(), borderColor: getBorderColor() }
    ]}>
      <View style={styles.leftContent}>
        <View style={styles.statusRow}>
          <View style={[styles.dot, { backgroundColor: getIconColor() }]} />
          <Text style={[
            styles.title, 
            { color: isDark ? '#EEE' : (isServerAlive ? '#0D47A1' : '#B71C1C') }
          ]}>
            {isServerAlive ? 'Connected to Emergency Server' : 'Server is offline!'}
          </Text>
        </View>
        <Text style={[
          styles.subtitle, 
          { color: isDark ? '#AAA' : (isServerAlive ? '#1565C0' : '#D32F2F') }
        ]}>
          {isServerAlive ? 'All systems operational' : 'Server is down'}
        </Text>
      </View>
      <View style={styles.rightContent}>
        <View style={styles.checkBadge}>
          <MaterialCommunityIcons 
            name={isServerAlive ? "server-network" : "server-network-off"} 
            size={24} 
            color={getIconColor()} 
          />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 20,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: 10,
    borderWidth: 1,
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
    marginRight: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 13,
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
