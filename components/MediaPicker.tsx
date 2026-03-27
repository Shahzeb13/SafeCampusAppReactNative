import React from 'react';
import { View, Text, Pressable, Alert, StyleSheet } from 'react-native';
import * as ImagePicker from 'expo-image-picker';

type Props = {
  setMedia: (media: any) => void;
};

export default function MediaPicker({ setMedia }: Props) {
  const pickFromGallery = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Alert.alert('Permission required');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images', 'videos'],
      quality: 1,
    });

    if (!result.canceled) {
      const asset = result.assets[0];

      setMedia({
        uri: asset.uri,
        type: asset.type === 'video' ? 'video' : 'image',
        fileName: asset.fileName,
        mimeType: asset.mimeType,
      });
    }
  };

  const openCamera = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();

    if (!permission.granted) {
      Alert.alert('Camera permission required');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images', 'videos'],
      quality: 1,
    });

    if (!result.canceled) {
      const asset = result.assets[0];

      setMedia({
        uri: asset.uri,
        type: asset.type === 'video' ? 'video' : 'image',
        fileName: asset.fileName,
        mimeType: asset.mimeType,
      });
    }
  };

  return (
    <View style={styles.container}>
      <Pressable onPress={openCamera} style={styles.button}>
        <Text style={styles.text}>Camera</Text>
      </Pressable>

      <Pressable onPress={pickFromGallery} style={styles.button}>
        <Text style={styles.text}>Gallery</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
  },
  button: {
    backgroundColor: '#1A237E',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    elevation: 3,
  },
  text: {
    color: 'white',
    fontWeight: '600',
  },
});