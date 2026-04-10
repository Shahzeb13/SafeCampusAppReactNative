import React from 'react';
import { View, Text, Pressable, Alert, StyleSheet } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { File } from 'expo-file-system';
import { IncidentMedia } from '@/types/incidentMedia';

type Props = {
  onPickMedia: (media: IncidentMedia) => void;
  onOpenCamera: () => void;
};

export default function MediaPicker({ onPickMedia, onOpenCamera }: Props) {
  const pickFromGallery = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (!permission.granted) {
      Alert.alert('Permission required', 'Gallery access is needed.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images', 'videos'],
      quality: 1,
      videoExportPreset: ImagePicker.VideoExportPreset.H264_640x480,
    });

    try {
      if (!result.canceled) {
        const asset = result.assets[0];
        
        // Enforce 15s limit for gallery videos
        if (asset.type === 'video' && asset.duration && asset.duration > 15000) {
           Alert.alert('Video Too Long', 'Please select a video shorter than 15 seconds.');
           return;
        }

        const file = new File(asset.uri);

        onPickMedia({
          uri: asset.uri,
          type: asset.type === 'video' ? 'video' : 'image',
          fileName: asset.fileName ?? undefined,
          mimeType: asset.mimeType ?? undefined,
          fileSize: file.exists ? file.size : undefined,
          duration: asset.duration ? asset.duration : undefined,
        });
      }
    } catch (err) {
      console.error('Pick error:', err);
      Alert.alert('Error', 'Failed to process selected media');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerArea}>
        <View style={styles.headerRow}>
          <MaterialCommunityIcons name="paperclip" size={20} color="#1A237E" />
          <Text style={styles.sectionTitle}>Attachments</Text>
        </View>
        <Text style={styles.helperText}>Max 3 images • Max 15s short video</Text>
      </View>

      <View style={styles.pickerRow}>
        <Pressable 
          onPress={onOpenCamera} 
          style={({ pressed }) => [
            styles.actionCard,
            styles.cameraCard,
            pressed && styles.cardPressed
          ]}
        >
          <View style={styles.iconCircle}>
            <MaterialCommunityIcons name="camera-plus" size={28} color="#FFFFFF" />
          </View>
          <View style={styles.textStack}>
            <Text style={styles.cardTitle}>Camera</Text>
            <Text style={styles.cardSubtitle}>Capture Live</Text>
          </View>
        </Pressable>

        <Pressable 
          onPress={pickFromGallery} 
          style={({ pressed }) => [
            styles.actionCard,
            styles.galleryCard,
            pressed && styles.cardPressed
          ]}
        >
          <View style={styles.iconCircleWhite}>
            <MaterialCommunityIcons name="image-album" size={28} color="#1A237E" />
          </View>
          <View style={styles.textStack}>
            <Text style={styles.cardTitleDark}>Gallery</Text>
            <Text style={styles.cardSubtitleDark}>Import File</Text>
          </View>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 10,
  },
  headerArea: {
    marginBottom: 12,
    marginLeft: 4,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1A237E',
    letterSpacing: 0.3,
  },
  helperText: {
    fontSize: 11,
    color: '#757575',
    fontWeight: '500',
  },
  pickerRow: {
    flexDirection: 'row',
    gap: 12,
  },
  actionCard: {
    flex: 1,
    height: 110,
    borderRadius: 20,
    padding: 14,
    justifyContent: 'space-between',
    borderWidth: 1,
  },
  cameraCard: {
    backgroundColor: '#1A237E',
    borderColor: '#1A237E',
  },
  galleryCard: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E0E0E0',
  },
  cardPressed: {
    transform: [{ scale: 0.97 }],
    opacity: 0.9,
  },
  iconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCircleWhite: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textStack: {
    gap: 1,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  cardSubtitle: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.7)',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  cardTitleDark: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1A237E',
  },
  cardSubtitleDark: {
    fontSize: 10,
    color: '#757575',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
});