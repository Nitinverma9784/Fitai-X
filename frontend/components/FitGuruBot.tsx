import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/theme';

interface FitGuruBotProps {
  size?: number;
}

export function FitGuruBot({ size = 44 }: FitGuruBotProps) {
  const floatAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: -6,
          duration: 1600,
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 1600,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [floatAnim]);

  return (
    <Animated.View
      style={[
        styles.botContainer,
        { width: size, height: size, borderRadius: size / 2, transform: [{ translateY: floatAnim }] },
      ]}>
      <View style={[styles.innerBadge, { borderRadius: size / 2 }]}>
        <Ionicons name="hardware-chip" size={size * 0.5} color="#0A0A0A" />
        <View style={styles.eyePulse} />
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  botContainer: {
    backgroundColor: Colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.gold,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 6,
  },
  innerBadge: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.gold,
  },
  eyePulse: {
    position: 'absolute',
    top: 6,
    right: 8,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FFF',
  },
});
