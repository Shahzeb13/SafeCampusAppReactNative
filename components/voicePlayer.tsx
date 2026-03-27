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

const { width } = Dimensions.get('window');

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
      <View style={styles.bubble}>
        <Pressable
          onPress={handlePlayPause}
          style={({ pressed }) => [
            styles.playButton,
            pressed && styles.buttonPressed
          ]}
        >
          <MaterialCommunityIcons 
            name={status.playing ? "pause" : "play"} 
            size={28} 
            color="#FF3B70" 
          />
        </Pressable>

        <View style={styles.contentArea}>
          <View style={styles.progressBackground}>
            <View style={[styles.progressForeground, { width: `${progress}%` }]} />
          </View>
          <View style={styles.metaInfo}>
            <Text style={styles.timeText}>
              {formatDuration(status.currentTime)} / {formatDuration(status.duration)}
            </Text>
          </View>
        </View>

        <Pressable
          onPress={handleDelete}
          style={({ pressed }) => [
            styles.deleteButton,
            pressed && styles.buttonPressed
          ]}
        >
          <MaterialCommunityIcons name="trash-can-outline" size={24} color="#6C757D" />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 10,
  },
  bubble: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E9ECEF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  playButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFF1F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  contentArea: {
    flex: 1,
    marginHorizontal: 15,
  },
  progressBackground: {
    height: 4,
    backgroundColor: '#E9ECEF',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressForeground: {
    height: '100%',
    backgroundColor: '#FF3B70',
  },
  metaInfo: {
    marginTop: 6,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  timeText: {
    fontSize: 12,
    color: '#6C757D',
    fontWeight: '500',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  deleteButton: {
    padding: 8,
  },
  buttonPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.95 }],
  },
});