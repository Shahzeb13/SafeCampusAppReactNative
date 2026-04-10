import React from 'react';
import { 
  View, 
  Text, 
  Pressable, 
  StyleSheet, 
  Dimensions,
  Platform
} from 'react-native';
import {
  useAudioPlayer,
  useAudioPlayerStatus,
} from 'expo-audio';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { VoiceNote } from '@/types/voiceNote';
import { formatBytes } from '../utils/formatUtils';

type VoicePlayerProps = {
  voiceNote: VoiceNote;
  setVoiceNote: React.Dispatch<React.SetStateAction<VoiceNote | null>>;
};

export default function VoicePlayer({ voiceNote, setVoiceNote }: VoicePlayerProps) {
  const player = useAudioPlayer(voiceNote);
  const status = useAudioPlayerStatus(player);

  const handlePlayPause = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (status.playing) {
      player.pause();
    } else {
      if (status.didJustFinish) {
        player.seekTo(0);
      }
      player.play();
    }
  };

  const handleDelete = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    setVoiceNote(null);
  };

  const formatDuration = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const progress = status.duration > 0 ? (status.currentTime / status.duration) * 100 : 0;

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <View style={styles.topRow}>
          <View style={styles.badge}>
            <MaterialCommunityIcons name="waveform" size={14} color="#FF3B70" />
            <Text style={styles.badgeText}>Voice Note • {formatBytes(voiceNote.fileSize)}</Text>
          </View>
          <Pressable
            onPress={handleDelete}
            style={({ pressed }) => [
              styles.deleteButton,
              pressed && styles.buttonPressed
            ]}
          >
            <MaterialCommunityIcons name="close-circle-outline" size={22} color="#9E9E9E" />
          </Pressable>
        </View>

        <View style={styles.playerContent}>
          <Pressable
            onPress={handlePlayPause}
            style={({ pressed }) => [
              styles.playFab,
              pressed && styles.buttonPressed
            ]}
          >
            <MaterialCommunityIcons 
              name={status.playing ? "pause" : "play"} 
              size={32} 
              color="white" 
            />
          </Pressable>

          <View style={styles.audioMeta}>
            <View style={styles.timeInfo}>
              <Text style={styles.currentTimeText}>{formatDuration(status.currentTime)}</Text>
              <Text style={styles.durationText}>{formatDuration(status.duration)}</Text>
            </View>
            
            <View style={styles.progressTrack}>
              <View style={[styles.progressIndicator, { width: `${progress}%` }]} />
              <View style={[styles.progressHandle, { left: `${progress}%` }]} />
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 12,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#F0F0F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 15,
    elevation: 4,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF0F4',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FF3B70',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  deleteButton: {
    padding: 4,
  },
  playerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  playFab: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FF3B70',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FF3B70',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 6,
  },
  audioMeta: {
    flex: 1,
    justifyContent: 'center',
  },
  timeInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  currentTimeText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#212121',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  durationText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#9E9E9E',
  },
  progressTrack: {
    height: 8,
    backgroundColor: '#F5F5F5',
    borderRadius: 4,
    overflow: 'visible',
    position: 'relative',
  },
  progressIndicator: {
    height: '100%',
    backgroundColor: '#FF3B70',
    borderRadius: 4,
  },
  progressHandle: {
    position: 'absolute',
    top: -4,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#FF3B70',
    borderWidth: 3,
    borderColor: 'white',
    marginLeft: -8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 2,
  },
  buttonPressed: {
    transform: [{ scale: 0.95 }],
    opacity: 0.85,
  },
});