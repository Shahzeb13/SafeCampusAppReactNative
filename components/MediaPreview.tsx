import React from 'react';
import { View, Image, Text, Pressable, StyleSheet } from 'react-native';
import { VideoView, useVideoPlayer } from 'expo-video';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { IncidentMedia } from '@/types/incidentMedia';
import { formatBytes, formatDurationMs } from '../utils/formatUtils';

type Props = {
  media: IncidentMedia;
  onRemove: () => void;
};

export default function MediaPreview({ media, onRemove }: Props) {
  const player = useVideoPlayer(media.uri, (player) => {
    player.loop = true;
    player.muted = true;
    player.play();
  });

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <View style={styles.mediaWrapper}>
          {media.type === 'image' ? (
            <Image source={{ uri: media.uri }} style={styles.media} resizeMode="cover" />
          ) : (
            <VideoView 
              style={styles.media} 
              player={player} 
              allowsFullscreen 
              nativeControls={true}
            />
          )}
          
          <View style={styles.overlay}>
             <View style={styles.typeBadge}>
                <MaterialCommunityIcons 
                  name={media.type === 'image' ? "image" : "movie-play"} 
                  size={14} 
                  color="white" 
                />
                <Text style={styles.typeText}>
                  {media.type.toUpperCase()}{' • '}{formatBytes(media.fileSize)}
                  {media.type === 'video' && media.duration && ` • ${formatDurationMs(media.duration)}`}
                </Text>
             </View>
             
             <Pressable 
               onPress={onRemove} 
               style={({ pressed }) => [
                 styles.removeButton,
                 pressed && styles.buttonPressed
               ]}
             >
               <MaterialCommunityIcons name="trash-can" size={20} color="white" />
             </Pressable>
          </View>
        </View>
        
        <View style={styles.footer}>
          <View style={styles.statusRow}>
            <MaterialCommunityIcons name="check-decagram" size={16} color="#4CAF50" />
            <Text style={styles.footerText}>Ready for submission</Text>
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
    borderRadius: 28,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: '#F0F0F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 5,
  },
  mediaWrapper: {
    width: '100%',
    height: 260,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  media: {
    width: '100%',
    height: '100%',
  },
  overlay: {
    position: 'absolute',
    top: 16,
    left: 16,
    right: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 10,
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 6,
  },
  typeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
  removeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FF3B70',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  playIconOverlay: {
    position: 'absolute',
    zIndex: 2,
  },
  footer: {
    padding: 12,
    backgroundColor: '#F8F9FA',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  footerText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#4CAF50',
    letterSpacing: 0.3,
  },
  buttonPressed: {
    transform: [{ scale: 0.9 }],
    opacity: 0.9,
  },
});