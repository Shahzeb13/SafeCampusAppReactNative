import React, { useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  Pressable, 
  Alert, 
  StyleSheet, 
  Animated, 
  Easing 
} from 'react-native';
import {
  AudioModule,
  RecordingPresets,
  setAudioModeAsync,
  useAudioRecorder,
  useAudioRecorderState,
} from 'expo-audio';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { VoiceNote } from '@/types/voiceNote';

type VoiceRecorderProps = {
  setVoiceNote: React.Dispatch<React.SetStateAction<VoiceNote | null>>;
};

export default function VoiceRecorder({ setVoiceNote }: VoiceRecorderProps) {
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recorderState = useAudioRecorderState(recorder);
  
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const setup = async () => {
      const status = await AudioModule.requestRecordingPermissionsAsync();
      if (!status.granted) {
        Alert.alert('Permission denied', 'Microphone access is required.');
        return;
      }
      await setAudioModeAsync({
        allowsRecording: true,
        playsInSilentMode: true,
      });
    };
    setup();
  }, []);

  useEffect(() => {
    if (recorderState.isRecording) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 800,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [recorderState.isRecording]);

  const startRecording = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await recorder.prepareToRecordAsync();
      recorder.record();
    } catch (error) {
      console.log('startRecording error:', error);
    }
  };

  const stopRecording = async () => {
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      await recorder.stop();
      if (recorder.uri) {
        setVoiceNote({
          uri: recorder.uri,
          durationMs: recorderState.durationMillis,
        });
      }
    } catch (error) {
      console.log('stopRecording error:', error);
    }
  };

  const formatDuration = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Audio Description</Text>
      
      <View style={styles.card}>
        <View style={styles.infoArea}>
          <Text style={styles.statusText}>
            {recorderState.isRecording ? 'RECORDING' : 'Tap to start recording'}
          </Text>
          {recorderState.isRecording && (
            <Text style={styles.timerText}>{formatDuration(recorderState.durationMillis)}</Text>
          )}
        </View>

        {!recorderState.isRecording ? (
          <Pressable
            onPress={startRecording}
            style={({ pressed }) => [
              styles.recordButton,
              pressed && styles.buttonPressed
            ]}
          >
            <View style={styles.iconContainer}>
              <MaterialCommunityIcons name="microphone" size={32} color="white" />
            </View>
          </Pressable>
        ) : (
          <Pressable
            onPress={stopRecording}
            style={({ pressed }) => [
              styles.stopButton,
              pressed && styles.buttonPressed
            ]}
          >
            <Animated.View style={[
              styles.iconContainerActive,
              { transform: [{ scale: pulseAnim }] }
            ]}>
              <MaterialCommunityIcons name="stop" size={32} color="white" />
            </Animated.View>
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 10,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#424242',
    marginBottom: 8,
  },
  card: {
    backgroundColor: '#F8F9FA',
    borderRadius: 20,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#E9ECEF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  infoArea: {
    flex: 1,
  },
  statusText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#6C757D',
  },
  timerText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FF3B70',
    marginTop: 4,
  },
  recordButton: {
    marginLeft: 15,
  },
  stopButton: {
    marginLeft: 15,
  },
  buttonPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.95 }],
  },
  iconContainer: {
    width: 64,
    height: 64,
    backgroundColor: '#1A237E',
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainerActive: {
    width: 64,
    height: 64,
    backgroundColor: '#FF3B70',
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FF3B70',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 5,
  },
});