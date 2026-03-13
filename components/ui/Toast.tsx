import React, { useEffect } from 'react';
import { StyleSheet, Text, View, Dimensions } from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring, 
  withTiming,
  withDelay,
  runOnJS
} from 'react-native-reanimated';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

interface ToastProps {
  visible: boolean;
  message: string;
  type: 'success' | 'error' | 'info';
  onDismiss: () => void;
}

const Toast: React.FC<ToastProps> = ({ visible, message, type, onDismiss }) => {
  const translateY = useSharedValue(-100);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      translateY.value = withSpring(50);
      opacity.value = withTiming(1, { duration: 300 });

      const timer = setTimeout(() => {
        hide();
      }, 4000);

      return () => clearTimeout(timer);
    }
  }, [visible]);

  const hide = () => {
    translateY.value = withTiming(-100, { duration: 300 });
    opacity.value = withTiming(0, { duration: 300 }, () => {
      runOnJS(onDismiss)();
    });
  };

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: translateY.value }],
      opacity: opacity.value,
    };
  });

  if (!visible && opacity.value === 0) return null;

  const getIcon = () => {
    switch (type) {
      case 'success': return 'check-circle';
      case 'error': return 'alert-circle';
      default: return 'information';
    }
  };

  const getColors = () => {
    switch (type) {
      case 'success': return ['#4CAF50', '#2E7D32'];
      case 'error': return ['#FF4B6C', '#D32F2F'];
      default: return ['#2196F3', '#1976D2'];
    }
  };

  return (
    <Animated.View style={[styles.container, animatedStyle]}>
      <LinearGradient
        colors={getColors() as [string, string, ...string[]]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.gradient}
      >
        <MaterialCommunityIcons name={getIcon()} size={24} color="white" />
        <Text style={styles.text}>{message}</Text>
      </LinearGradient>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 20,
    right: 20,
    zIndex: 9999,
    alignItems: 'center',
  },
  gradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 15,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 6,
  },
  text: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 10,
    flex: 1,
  },
});

export default Toast;
