import React from 'react';
import { View, Image, Text, Pressable, StyleSheet } from 'react-native';
import { Video } from 'expo-av';

type Props = {
  media: any;
  setMedia: (media: null) => void;
};

export default function MediaPreview({ media, setMedia }: Props) {
  return (
    <View style={styles.container}>
      {media.type === 'image' ? (
        <Image source={{ uri: media.uri }} style={styles.media} />
      ) : (
        <Video
          source={{ uri: media.uri }}
          style={styles.media}
          useNativeControls
          resizeMode="cover"
        />
      )}

      <Pressable onPress={() => setMedia(null)} style={styles.removeButton}>
        <Text style={styles.removeText}>Remove</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 15,
    borderRadius: 15,
    overflow: 'hidden',
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  media: {
    width: '100%',
    height: 220,
  },
  removeButton: {
    backgroundColor: '#FF3B70',
    paddingVertical: 12,
    alignItems: 'center',
  },
  removeText: {
    color: 'white',
    fontWeight: 'bold',
  },
});