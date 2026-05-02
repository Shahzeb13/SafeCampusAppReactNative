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
import { File } from 'expo-file-system';
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
  const glowAnim = useRef(new Animated.Value(0)).current;

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
      Animated.parallel([
        Animated.loop(
          Animated.sequence([
            Animated.timing(pulseAnim, {
              toValue: 1.15,
              duration: 1000,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: true,
            }),
            Animated.timing(pulseAnim, {
              toValue: 1,
              duration: 1000,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: true,
            }),
          ])
        ),
        Animated.loop(
          Animated.sequence([
            Animated.timing(glowAnim, {
              toValue: 0.6,
              duration: 1000,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: true,
            }),
            Animated.timing(glowAnim, {
              toValue: 0.2,
              duration: 1000,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: true,
            }),
          ])
        )
      ]).start();
    } else {
      pulseAnim.setValue(1);
      glowAnim.setValue(0);
    }
  }, [recorderState.isRecording]);

  const startRecording = async () => {
    try {
      console.log("start recording button presssed");
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await recorder.prepareToRecordAsync();
      // console.log("hey form here");
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
        const file = new File(recorder.uri);
        setVoiceNote({
          uri: recorder.uri,
          durationMs: recorderState.durationMillis,
          fileSize: file.exists ? file.size : undefined,
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
      <View style={styles.headerRow}>
        <MaterialCommunityIcons name="microphone-outline" size={20} color="#1A237E" />
        <Text style={styles.sectionTitle}>Audio Description</Text>
      </View>
      
      <View style={[styles.card, recorderState.isRecording && styles.cardActive]}>
        <View style={styles.content}>
          <View style={styles.textContainer}>
            <Text style={[styles.statusText, recorderState.isRecording && styles.statusTextActive]}>
              {recorderState.isRecording ? 'Capturing your voice...' : 'Record a voice description'}
            </Text>
            {recorderState.isRecording && (
              <View style={styles.timerContainer}>
                <View style={styles.redDot} />
                <Text style={styles.timerText}>{formatDuration(recorderState.durationMillis)}</Text>
              </View>
            )}
          </View>

          {!recorderState.isRecording ? (
            <Pressable
              onPress={startRecording}
              style={({ pressed }) => [
                styles.mainButton,
                pressed && styles.buttonPressed
              ]}
            >
              <MaterialCommunityIcons name="microphone" size={28} color="white" />
            </Pressable>
          ) : (
            <Pressable
              onPress={stopRecording}
              style={({ pressed }) => [
                styles.mainButtonActive,
                pressed && styles.buttonPressed
              ]}
            >
              <Animated.View style={[
                styles.glowLayer,
                { opacity: glowAnim, transform: [{ scale: pulseAnim }] }
              ]} />
              <Animated.View style={[
                styles.iconContainerActive,
                { transform: [{ scale: pulseAnim }] }
              ]}>
                <MaterialCommunityIcons name="stop" size={28} color="white" />
              </Animated.View>
            </Pressable>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 12,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
    marginLeft: 4,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1A237E',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#F0F0F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  cardActive: {
    borderColor: '#FF3B7020',
    backgroundColor: '#FFF8F9',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  textContainer: {
    flex: 1,
  },
  statusText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#616161',
  },
  statusTextActive: {
    color: '#FF3B70',
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    gap: 8,
  },
  redDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF3B70',
  },
  timerText: {
    fontSize: 20,
    fontWeight: '800',
    color: '#212121',
    letterSpacing: 1,
  },
  mainButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#1A237E',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#1A237E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  mainButtonActive: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainerActive: {
    width: 56,
    height: 56,
    backgroundColor: '#FF3B70',
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  glowLayer: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FF3B70',
    zIndex: 1,
  },
  buttonPressed: {
    transform: [{ scale: 0.95 }],
    opacity: 0.9,
  },
});