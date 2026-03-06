import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import ConfettiCannon from 'react-native-confetti-cannon';
import { Colors, FontSize, Spacing } from '../constants/theme';

interface CelebrationProps {
  visible: boolean;
  message: string;
  onDismiss: () => void;
}

export function Celebration({ visible, message, onDismiss }: CelebrationProps) {
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.timing(opacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();

      const timer = setTimeout(() => {
        Animated.timing(opacity, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }).start(() => onDismiss());
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <ConfettiCannon
        count={80}
        origin={{ x: -10, y: 0 }}
        autoStart
        fadeOut
        fallSpeed={3000}
        colors={[Colors.primary, Colors.accent, Colors.success, '#FFD700', '#FF6B6B']}
      />
      <Animated.View style={[styles.messageContainer, { opacity }]}>
        <Text style={styles.message}>{message}</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  messageContainer: {
    position: 'absolute',
    top: '35%',
    left: Spacing.lg,
    right: Spacing.lg,
    alignItems: 'center',
  },
  message: {
    fontSize: FontSize.xl,
    fontWeight: '800',
    color: Colors.text,
    textAlign: 'center',
    backgroundColor: Colors.surface,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
});
