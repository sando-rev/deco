import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontSize, Spacing, BorderRadius } from '../constants/theme';
import { Achievement } from '../hooks/useGamification';

interface XpToastProps {
  visible: boolean;
  xpAmount: number;
  achievement?: Achievement | null;
  onDismiss: () => void;
}

export function XpToast({ visible, xpAmount, achievement, onDismiss }: XpToastProps) {
  const translateY = useRef(new Animated.Value(-100)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // Slide in
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: true,
          tension: 80,
          friction: 10,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();

      // Auto dismiss after 3s
      const timer = setTimeout(() => {
        Animated.parallel([
          Animated.timing(translateY, {
            toValue: -100,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
        ]).start(() => onDismiss());
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        { transform: [{ translateY }], opacity },
      ]}
      pointerEvents="none"
    >
      <View style={[styles.toast, achievement ? styles.toastAchievement : styles.toastXp]}>
        {achievement ? (
          <>
            <View style={styles.achievementIcon}>
              <Ionicons name={achievement.icon as any} size={20} color={Colors.white} />
            </View>
            <View style={styles.textContainer}>
              <Text style={styles.achievementTitle}>
                {achievement.key === 'first_goal' ? '🎯 Eerste Stap!' : '🏆 Achievement!'}
              </Text>
              <Text style={styles.xpText}>+{xpAmount} XP</Text>
            </View>
          </>
        ) : (
          <>
            <View style={styles.xpIcon}>
              <Ionicons name="flash" size={18} color={Colors.accent} />
            </View>
            <Text style={styles.xpAmount}>+{xpAmount} XP</Text>
          </>
        )}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 60,
    left: Spacing.lg,
    right: Spacing.lg,
    alignItems: 'center',
    zIndex: 9999,
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.full ?? 999,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
    gap: Spacing.sm,
  },
  toastXp: {
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.accent + '40',
  },
  toastAchievement: {
    backgroundColor: Colors.primary,
  },
  xpIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.accent + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  xpAmount: {
    fontSize: FontSize.lg,
    fontWeight: '800',
    color: Colors.accent,
  },
  achievementIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContainer: {
    flex: 1,
  },
  achievementTitle: {
    fontSize: FontSize.md,
    fontWeight: '800',
    color: Colors.white,
  },
  xpText: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.8)',
  },
});
