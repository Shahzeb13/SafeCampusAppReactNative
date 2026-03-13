import React, { useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming, 
  withDelay,
  Easing
} from 'react-native-reanimated';

const { width, height } = Dimensions.get('window');

export default function SplashScreen() {
  const router = useRouter();
  const scale = useSharedValue(0.5);
  const opacity = useSharedValue(0);

  useEffect(() => {
    // Animation for logo
    scale.value = withTiming(1, { 
      duration: 1000, 
      easing: Easing.out(Easing.back(1.5)) 
    });
    opacity.value = withTiming(1, { duration: 1000 });

    // Navigate to register after 3 seconds
    const timer = setTimeout(() => {
      router.replace('/register');
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  const animatedLogoStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
      opacity: opacity.value,
    };
  });

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#FF4B2B', '#FF416C']}
        style={styles.background}
      >
        <Animated.View style={[styles.content, animatedLogoStyle]}>
          <View style={styles.whiteCircle}>
            <MaterialCommunityIcons name="shield" size={80} color="#FF416C" />
          </View>
          
          <Text style={styles.title}>SafeCampus</Text>
          <Text style={styles.tagline}>Your Safety , Our Priority</Text>
        </Animated.View>

        {/* Subtle decorative bottom gradient overlap if needed to match image perfectly */}
        <LinearGradient
          colors={['transparent', 'rgba(255,255,255,0.2)']}
          style={styles.bottomOverlay}
        />
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  background: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
  },
  whiteCircle: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 15,
    elevation: 10,
  },
  title: {
    fontSize: 42,
    fontWeight: 'bold',
    color: 'white',
    letterSpacing: 1,
  },
  tagline: {
    fontSize: 16,
    color: 'white',
    marginTop: 15,
    opacity: 0.9,
    fontWeight: '500',
  },
  bottomOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: height * 0.3,
  }
});
