import React, { useState, useEffect, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  SafeAreaView,
  Animated,
  Easing,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import * as Haptics from 'expo-haptics';
import { sosService } from '../services/sosService';
import { SosMessageSendingService } from '../services/SosMessageSendingService';
import { useAuth } from '../context/AuthContext';
import { useSnackbar } from '../context/SnackbarContext';
import { handleApiError } from '../utils/errorHandling';


const { width } = Dimensions.get('window');

interface SOSModalProps {
  visible: boolean;
  onClose: () => void;
  autoTrigger?: boolean;
}

type SOSStatus = 'confirming' | 'sending' | 'success' | 'error';
type LiveSOSStatus = 'active' | 'acknowledged' | 'responding' | 'resolved';

export const SOSModal: React.FC<SOSModalProps> = ({ visible, onClose, autoTrigger = false }) => {
  const { user } = useAuth();
  const { showSnackbar } = useSnackbar();

  const TimelineStep = ({ icon, color, label, isActive, isFirst, isLast }: any) => (
    <View style={styles.modalStepContainer}>
      <View style={styles.modalLeftLineContainer}>
        {!isFirst && <View style={[styles.modalVerticalLine, isActive && { backgroundColor: color }]} />}
        <View style={[styles.modalStepDot, { backgroundColor: isActive ? color : '#E0E0E0' }]}>
          <MaterialCommunityIcons name={icon} size={10} color="white" />
        </View>
        {!isLast && <View style={[styles.modalVerticalLine, isActive && { backgroundColor: color }]} />}
      </View>
      <View style={styles.modalStepContent}>
        <Text style={[styles.modalStepLabel, isActive && { color: '#333' }]}>{label}</Text>
      </View>
    </View>
  );
  const [status, setStatus] = useState<SOSStatus>('confirming');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [timestamp, setTimestamp] = useState<string | null>(null);
  const [currentSosId, setCurrentSosId] = useState<string | null>(null);
  const [liveStatus, setLiveStatus] = useState<LiveSOSStatus>('active');

  // Handle immediate trigger for shake event
  useEffect(() => {
    if (visible && autoTrigger && status === 'confirming') {
      handleConfirm();
    }
  }, [visible, autoTrigger]);

  // Pulse animation for the "Sending" state
  const pulseScale = useRef(new Animated.Value(1)).current;
  const pulseOpacity = useRef(new Animated.Value(0.6)).current;
  const pulseAnimation = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    if (status === 'sending') {
      pulseAnimation.current = Animated.loop(
        Animated.parallel([
          Animated.timing(pulseScale, {
            toValue: 1.5,
            duration: 1000,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulseOpacity, {
            toValue: 0,
            duration: 1000,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      );
      pulseAnimation.current.start();
    } else {
      if (pulseAnimation.current) {
        pulseAnimation.current.stop();
      }
      pulseScale.setValue(1);
      pulseOpacity.setValue(0.6);
    }
    
    return () => {
      if (pulseAnimation.current) pulseAnimation.current.stop();
    }
  }, [status]);

  // Polling for status updates
  useEffect(() => {
    let interval: any = null;

    if (status === 'success' && currentSosId && liveStatus !== 'resolved') {
      interval = setInterval(async () => {
        try {
          const details = await sosService.getSOSDetails(currentSosId);
          if (details.status !== liveStatus) {
            setLiveStatus(details.status as LiveSOSStatus);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          }
        } catch (err) {
          console.error("Polling error:", err);
        }
      }, 5000); // Poll every 5 seconds
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [status, currentSosId, liveStatus]);

  const handleConfirm = async () => {
    try {
      setStatus('sending');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);

      const { status: foregroundStatus } = await Location.requestForegroundPermissionsAsync();
      if (foregroundStatus !== 'granted') {
        throw new Error('Location permission denied. Help cannot find you without GPS.');
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Highest,
      });

      const response = await sosService.triggerSOS(
        location.coords.latitude,
        location.coords.longitude
      );

        if (response.success) {
          setTimestamp(new Date().toLocaleTimeString());
          setCurrentSosId(response.sosId || null);
          setLiveStatus('active');
          setStatus('success');
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          
          showSnackbar('🚨 SOS Sent! Help is on the way.', 'success');

          // Notify personal contacts via WhatsApp
          if (user?.personalEmergencyContacts && user.personalEmergencyContacts.length > 0) {
            await SosMessageSendingService.sendWhatsAppSos(
              user.personalEmergencyContacts,
              location.coords.latitude,
              location.coords.longitude
            );
            showSnackbar('📱 Trusted circle notified via WhatsApp', 'info');
          }
        }

    } catch (err: any) {
      handleApiError(err, showSnackbar);
      setErrorMsg(err.response?.data?.message || err.message || 'Alert broadcast failed.');
      setStatus('error');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  const handleClose = () => {
    setStatus('confirming');
    setErrorMsg(null);
    setTimestamp(null);
    setCurrentSosId(null);
    setLiveStatus('active');
    onClose();
  };

  const getStatusText = (s: LiveSOSStatus) => {
    switch (s) {
      case 'active': return 'Emergency alert sent';
      case 'acknowledged': return 'Security acknowledged your alert';
      case 'responding': return 'Help is on the way';
      case 'resolved': return 'Situation resolved';
      default: return 'Emergency alert sent';
    }
  };

  const getStatusColor = (s: LiveSOSStatus) => {
    switch (s) {
      case 'active': return '#FF3B30';
      case 'acknowledged': return '#FF9800';
      case 'responding': return '#2196F3';
      case 'resolved': return '#4CAF50';
      default: return '#FF3B30';
    }
  };

  const renderContent = () => {
    switch (status) {
      case 'confirming':
        return (
          <View style={styles.card}>
            <View style={[styles.iconCircle, { backgroundColor: '#FFEBEE' }]}>
              <MaterialCommunityIcons name="alert-decagram" size={48} color="#FF3B30" />
            </View>
            <Text style={styles.title}>Confirm SOS Alert?</Text>
            <Text style={styles.description}>
              This will broadcast your location to the Campus Security team for immediate response.
            </Text>
            <View style={styles.buttonContainer}>
              <TouchableOpacity style={styles.cancelButton} onPress={handleClose}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.confirmButton} onPress={handleConfirm}>
                <Text style={styles.confirmText}>Send SOS</Text>
              </TouchableOpacity>
            </View>
          </View>
        );

      case 'sending':
        return (
          <View style={styles.card}>
            <View style={styles.pulseContainer}>
              <Animated.View
                style={[
                  styles.pulseRing,
                  { 
                    transform: [{ scale: pulseScale }], 
                    opacity: pulseOpacity 
                  },
                  { position: 'absolute', width: 100, height: 100, borderRadius: 50, backgroundColor: '#FF3B30' }
                ]}
              />
              <View style={[styles.iconCircle, { backgroundColor: '#FF3B30', elevation: 10 }]}>
                <ActivityIndicator size="large" color="white" />
              </View>
            </View>
            <Text style={styles.title}>Broadcasting SOS...</Text>
            <Text style={styles.description}>Fetching GPS coordinates and notifying security.</Text>
          </View>
        );

      case 'success':
        return (
          <View style={styles.card}>
             <View style={[styles.iconCircle, { backgroundColor: getStatusColor(liveStatus) + '15' }]}>
              <MaterialCommunityIcons 
                name={liveStatus === 'resolved' ? "shield-check" : "shield-alert"} 
                size={60} 
                color={getStatusColor(liveStatus)} 
              />
            </View>
            <Text style={[styles.title, { color: getStatusColor(liveStatus) }]}>
              {liveStatus === 'active' && 'SOS Active'}
              {liveStatus === 'acknowledged' && 'Alert Acknowledged'}
              {liveStatus === 'responding' && 'Help Dispatched'}
              {liveStatus === 'resolved' && 'Situation Resolved'}
            </Text>
            <Text style={styles.resultDescription}>
              {getStatusText(liveStatus)}
            </Text>
            
            <View style={styles.modalTimeline}>
               <TimelineStep 
                icon="bell-ring" 
                color="#FF3B30" 
                label="Alert Triggered" 
                isActive={true} 
                isFirst
              />
              <TimelineStep 
                icon="eye-check" 
                color="#FF9800" 
                label="Security Notified" 
                isActive={liveStatus !== 'active'} 
              />
              <TimelineStep 
                icon="truck-fast" 
                color="#2196F3" 
                label="Help Dispatched" 
                isActive={liveStatus === 'responding' || liveStatus === 'resolved'} 
              />
              <TimelineStep 
                icon="check-decagram" 
                color="#4CAF50" 
                label="Situation Resolved" 
                isActive={liveStatus === 'resolved'} 
                isLast
              />
            </View>
            
            <View style={styles.timestampBox}>
              <Text style={styles.timestampLabel}>Sent at: </Text>
              <Text style={styles.timestampValue}>{timestamp}</Text>
            </View>
            
            <TouchableOpacity style={styles.doneButton} onPress={handleClose}>
              <Text style={styles.doneText}>
                {liveStatus === 'resolved' ? 'Finish' : 'Understood'}
              </Text>
            </TouchableOpacity>
          </View>
        );

      case 'error':
        return (
          <View style={styles.card}>
            <View style={[styles.iconCircle, { backgroundColor: '#FFEBEE' }]}>
              <MaterialCommunityIcons name="alert-circle-outline" size={60} color="#C62828" />
            </View>
            <Text style={[styles.title, { color: '#C62828' }]}>Alert Failed</Text>
            <Text style={styles.resultDescription}>{errorMsg || 'Could not connect to security servers.'}</Text>
            <TouchableOpacity style={styles.confirmButton} onPress={handleConfirm}>
              <Text style={styles.confirmText}>Retry Alert</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.cancelButton, { marginTop: 10 }]} onPress={handleClose}>
              <Text style={styles.cancelText}>Dismiss</Text>
            </TouchableOpacity>
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>{renderContent()}</View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 400,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 32,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
  },
  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  pulseContainer: {
    width: 100,
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    position: 'relative',
  },
  pulseRing: {
    // Style injected via Reanimated for pulse effect
  },
  title: {
    fontSize: 22,
    fontFamily: 'Outfit_700Bold',
    color: '#1A237E',
    textAlign: 'center',
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    fontFamily: 'Inter_400Regular',
    lineHeight: 24,
    marginBottom: 24,
  },
  resultDescription: {
    fontSize: 15,
    color: '#555',
    textAlign: 'center',
    fontFamily: 'Inter_400Regular',
    lineHeight: 22,
    marginBottom: 20,
    paddingHorizontal: 10,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  confirmButton: {
    flex: 1,
    backgroundColor: '#FF3B30',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  confirmText: {
    color: 'white',
    fontSize: 16,
    fontFamily: 'Outfit_600SemiBold',
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  cancelText: {
    color: '#666',
    fontSize: 16,
    fontFamily: 'Outfit_600SemiBold',
  },
  modalTimeline: {
    width: '100%',
    paddingHorizontal: 20,
    marginVertical: 15,
  },
  modalStepContainer: {
    flexDirection: 'row',
    height: 35,
  },
  modalLeftLineContainer: {
    width: 20,
    alignItems: 'center',
  },
  modalVerticalLine: {
    width: 1.5,
    flex: 1,
    backgroundColor: '#EEEEEE',
  },
  modalStepDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  modalStepContent: {
    flex: 1,
    paddingLeft: 12,
    justifyContent: 'center',
  },
  modalStepLabel: {
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
    color: '#BBB',
  },
  timestampBox: {
    flexDirection: 'row',
    marginBottom: 20,
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  timestampLabel: {
    fontSize: 12,
    color: '#666',
    fontFamily: 'Inter_400Regular',
  },
  timestampValue: {
    fontSize: 12,
    color: '#333',
    fontFamily: 'Orbitron_500Medium',
  },
  doneButton: {
    width: '100%',
    backgroundColor: '#1A237E',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  doneText: {
    color: 'white',
    fontSize: 16,
    fontFamily: 'Outfit_600SemiBold',
  },
});
