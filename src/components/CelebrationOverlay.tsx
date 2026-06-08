import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ConfettiCannon from 'react-native-confetti-cannon';
import { Colors, FontSize, Spacing, BorderRadius } from '../constants/theme';
import { useCelebration, CelebrationEvent } from './CelebrationContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const TYPE_CONFIG: Record<string, {
  bg: string;
  accent: string;
  icon: string;
  confetti: boolean;
  duration: number;
}> = {
  xp: {
    bg: Colors.surface,
    accent: Colors.accent,
    icon: 'flash',
    confetti: false,
    duration: 2500,
  },
  achievement: {
    bg: Colors.primary,
    accent: Colors.white,
    icon: 'trophy',
    confetti: true,
    duration: 3500,
  },
  rank_up: {
    bg: '#1B6B4A',
    accent: Colors.white,
    icon: 'arrow-up-circle',
    confetti: true,
    duration: 3500,
  },
  top_3: {
    bg: '#F5A623',
    accent: Colors.white,
    icon: 'podium',
    confetti: true,
    duration: 3500,
  },
  number_1: {
    bg: '#FFD700',
    accent: '#1B6B4A',
    icon: 'medal',
    confetti: true,
    duration: 4000,
  },
  streak: {
    bg: Colors.surface,
    accent: '#FF6B6B',
    icon: 'flame',
    confetti: false,
    duration: 2500,
  },
  goal_achieved: {
    bg: Colors.success,
    accent: Colors.white,
    icon: 'checkmark-circle',
    confetti: true,
    duration: 3500,
  },
};

function CelebrationCard({ event }: { event: CelebrationEvent }) {
  const { dismiss } = useCelebration();
  const scale = useRef(new Animated.Value(0.3)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  const config = TYPE_CONFIG[event.type] ?? TYPE_CONFIG.xp;
  const showConfetti = event.confetti ?? config.confetti;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scale, {
        toValue: 1,
        useNativeDriver: true,
        tension: 60,
        friction: 8,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();

    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(scale, {
          toValue: 0.3,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start(() => dismiss());
    }, config.duration);

    return () => clearTimeout(timer);
  }, []);

  const iconName = event.icon ?? config.icon;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {showConfetti && (
        <ConfettiCannon
          count={100}
          origin={{ x: SCREEN_WIDTH / 2, y: -10 }}
          autoStart
          fadeOut
          fallSpeed={3000}
          colors={[Colors.primary, Colors.accent, Colors.success, '#FFD700', '#FF6B6B']}
        />
      )}
      <View style={styles.centered}>
        <Animated.View
          style={[
            styles.card,
            { backgroundColor: config.bg, transform: [{ scale }], opacity },
            config.bg === Colors.surface && styles.cardBorder,
          ]}
        >
          <View style={[styles.iconCircle, { backgroundColor: config.accent + '25' }]}>
            <Ionicons name={iconName as any} size={32} color={config.accent} />
          </View>
          <Text style={[styles.message, { color: config.accent === Colors.white ? Colors.white : Colors.text }]}>
            {event.message}
          </Text>
          {event.subMessage && (
            <Text style={[styles.subMessage, { color: config.accent === Colors.white ? 'rgba(255,255,255,0.8)' : Colors.textSecondary }]}>
              {event.subMessage}
            </Text>
          )}
          {event.xpAmount != null && event.xpAmount > 0 && (
            <View style={[styles.xpBadge, { backgroundColor: config.accent + '20' }]}>
              <Ionicons name="flash" size={14} color={config.accent} />
              <Text style={[styles.xpText, { color: config.accent }]}>
                +{event.xpAmount} XP
              </Text>
            </View>
          )}
        </Animated.View>
      </View>
    </View>
  );
}

export function CelebrationOverlay() {
  const { queue } = useCelebration();
  const current = queue[0];

  if (!current) return null;

  return <CelebrationCard key={current.id} event={current} />;
}

const styles = StyleSheet.create({
  centered: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  card: {
    alignItems: 'center',
    paddingHorizontal: Spacing.xl ?? 32,
    paddingVertical: Spacing.lg,
    borderRadius: 20,
    marginHorizontal: Spacing.lg,
    maxWidth: 300,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 12,
    gap: Spacing.sm,
  },
  cardBorder: {
    borderWidth: 1.5,
    borderColor: Colors.borderLight ?? '#eee',
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  message: {
    fontSize: FontSize.lg,
    fontWeight: '800',
    textAlign: 'center',
  },
  subMessage: {
    fontSize: FontSize.sm,
    textAlign: 'center',
  },
  xpBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.md,
    paddingVertical: 4,
    borderRadius: BorderRadius.full ?? 999,
    marginTop: 4,
  },
  xpText: {
    fontSize: FontSize.md,
    fontWeight: '800',
  },
});
