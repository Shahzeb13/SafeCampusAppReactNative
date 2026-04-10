import React, { useState, useRef, useEffect } from 'react';
import { StyleSheet, Text, TouchableOpacity, View, Alert, Dimensions } from 'react-native';
import { CameraView, useCameraPermissions, useMicrophonePermissions } from 'expo-camera';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { File } from 'expo-file-system';
import { IncidentMedia } from '@/types/incidentMedia';

const { width } = Dimensions.get('window');

type Props = {
  onCapture: (media: IncidentMedia) => void;
  onClose: () => void;
};

export default function CameraCapture({ onCapture, onClose }: Props) {
  const [facing, setFacing] = useState<'back' | 'front'>('back');
  const [isRecording, setIsRecording] = useState(false);
  const [timer, setTimer] = useState(0);
  const [cameraMode, setCameraMode] = useState<'picture' | 'video'>('picture');
  const cameraRef = useRef<CameraView>(null);
  const timerInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [microphonePermission, requestMicrophonePermission] = useMicrophonePermissions();

  useEffect(() => {
    if (isRecording) {
      setTimer(0);
      timerInterval.current = setInterval(() => {
        setTimer((prev) => {
          if (prev >= 14) {
            stopVideoRecording();
            return 15;
          }
          return prev + 1;
        });
      }, 1000);
    } else {
      if (timerInterval.current) clearInterval(timerInterval.current);
    }
    return () => {
      if (timerInterval.current) clearInterval(timerInterval.current);
    };
  }, [isRecording]);

  if (!cameraPermission || !microphonePermission) {
    return <View style={styles.loadingContainer} />;
  }

  if (!cameraPermission.granted || !microphonePermission.granted) {
    return (
      <View style={styles.permissionContainer}>
        <MaterialCommunityIcons name="camera-off" size={64} color="#757575" />
        <Text style={styles.message}>Camera and Microphone permissions are required to capture evidence.</Text>
        <TouchableOpacity 
          onPress={async () => {
            await requestCameraPermission();
            await requestMicrophonePermission();
          }} 
          style={styles.permissionButton}
        >
          <Text style={styles.permissionButtonText}>Allow Access</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={onClose} style={styles.cancelLink}>
          <Text style={styles.cancelLinkText}>Not Now</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const toggleCameraFacing = () => {
    setFacing(current => (current === 'back' ? 'front' : 'back'));
  };

  const takePhoto = async () => {
    if (!cameraRef.current || isRecording) return;

    try {
      setCameraMode('picture');
      // Small delay to ensure mode switch
      setTimeout(async () => {
        const photo = await cameraRef.current?.takePictureAsync({ quality: 0.7 });
        if (photo) {
          const file = new File(photo.uri);
          onCapture({
            uri: photo.uri,
            type: 'image',
            fileSize: file.exists ? file.size : undefined,
          });
        }
      }, 100);
    } catch (err) {
      Alert.alert('Error', 'Failed to take photo');
    }
  };

  const startVideoRecording = async () => {
    if (!cameraRef.current || isRecording) return;

    try {
      setCameraMode('video');
      setTimeout(async () => {
        setIsRecording(true);
        const video = await cameraRef.current?.recordAsync({
          maxDuration: 15,
        });

        setIsRecording(false);
        if (video) {
          const file = new File(video.uri);
          onCapture({
            uri: video.uri,
            type: 'video',
            fileSize: file.exists ? file.size : undefined,
            duration: timer * 1000, 
          });
        }
      }, 200);
    } catch (err) {
      setIsRecording(false);
      Alert.alert('Error', 'Failed to start recording');
    }
  };

  const stopVideoRecording = () => {
    if (cameraRef.current && isRecording) {
      cameraRef.current.stopRecording();
      setIsRecording(false);
    }
  };

  return (
    <View style={styles.container}>
      <CameraView 
        style={styles.camera} 
        facing={facing} 
        ref={cameraRef}
        mode={cameraMode}
        videoQuality="720p"
      />
      <View style={styles.overlay} pointerEvents="box-none">
        <View style={styles.topBar}>
          <TouchableOpacity style={styles.iconButton} onPress={onClose}>
            <MaterialCommunityIcons name="close" size={28} color="white" />
          </TouchableOpacity>
          
          {isRecording && (
            <View style={styles.timerContainer}>
              <View style={styles.recordingDot} />
              <Text style={styles.timerText}>00:{timer < 10 ? `0${timer}` : timer}</Text>
            </View>
          )}

          <TouchableOpacity style={styles.iconButton} onPress={toggleCameraFacing}>
            <MaterialCommunityIcons name="camera-flip" size={28} color="white" />
          </TouchableOpacity>
        </View>

        <View style={styles.bottomBar}>
          <View style={styles.modeIndicator}>
             <Text style={styles.modeText}>MAX 15 SEC VIDEO</Text>
          </View>

          <View style={styles.controlsRow}>
            <TouchableOpacity 
              style={[styles.captureOuter, isRecording && styles.recordingOuter]} 
              onPress={takePhoto}
              onLongPress={startVideoRecording}
              onPressOut={isRecording ? stopVideoRecording : undefined}
              activeOpacity={0.8}
            >
              <View style={[styles.captureInner, isRecording && styles.recordingInner]} />
            </TouchableOpacity>
          </View>
          
          <Text style={styles.hintText}>
            {isRecording ? 'RELEASE TO STOP' : 'TAP FOR PHOTO • HOLD FOR VIDEO'}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  permissionContainer: {
    flex: 1,
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    gap: 20,
  },
  camera: {
    flex: 1,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    justifyContent: 'space-between',
    paddingVertical: 50,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 25,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 8,
  },
  recordingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF3B30',
  },
  timerText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  bottomBar: {
    alignItems: 'center',
    gap: 20,
  },
  modeIndicator: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 15,
  },
  modeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
  controlsRow: {
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureOuter: {
    width: 84,
    height: 84,
    borderRadius: 42,
    borderWidth: 4,
    borderColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 4,
  },
  recordingOuter: {
    borderColor: '#FF3B30',
    transform: [{ scale: 1.1 }],
  },
  captureInner: {
    width: '100%',
    height: '100%',
    borderRadius: 40,
    backgroundColor: 'white',
  },
  recordingInner: {
    backgroundColor: '#FF3B30',
    width: 32,
    height: 32,
    borderRadius: 6,
  },
  hintText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
    textShadowColor: 'rgba(0,0,0,0.4)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  message: {
    textAlign: 'center',
    fontSize: 16,
    color: '#424242',
    lineHeight: 24,
  },
  permissionButton: {
    backgroundColor: '#1A237E',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 25,
  },
  permissionButtonText: {
    color: 'white',
    fontWeight: '700',
    fontSize: 16,
  },
  cancelLink: {
    marginTop: 10,
  },
  cancelLinkText: {
    color: '#757575',
    fontWeight: '600',
  },
});
