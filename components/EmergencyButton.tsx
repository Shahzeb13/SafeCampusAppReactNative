import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

interface EmergencyButtonProps {
  onPress: () => void;
}

export const EmergencyButton: React.FC<EmergencyButtonProps> = ({ onPress }) => {
  return (
    <TouchableOpacity style={styles.container} activeOpacity={0.9} onPress={onPress}>
      <LinearGradient
        colors={['#FF4B6C', '#FF3B30']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.gradient}
      >
        <View style={styles.content}>
          <MaterialCommunityIcons name="alert" size={24} color="white" />
          <View style={styles.textContainer}>
            <Text style={styles.title}>EMERGENCY</Text>
            <Text style={styles.subtitle}>Tap to send alert</Text>
          </View>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    margin: 20,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#FF3B30',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  gradient: {
    paddingVertical: 18,
    paddingHorizontal: 20,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  textContainer: {
    alignItems: 'center',
  },
  title: {
    color: 'white',
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 1,
  },
  subtitle: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
    fontWeight: '600',
  },
});
