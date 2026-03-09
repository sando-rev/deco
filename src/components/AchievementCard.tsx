import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Colors, Spacing, FontSize, BorderRadius } from '../constants/theme';
import { Achievement } from '../hooks/useGamification';

interface AchievementCardProps {
  achievement: Achievement;
  earned: boolean;
  earnedAt?: string;
}

export function AchievementCard({ achievement, earned, earnedAt }: AchievementCardProps) {
  const { t } = useTranslation();
  const title = t(`achievements.${achievement.key}`, achievement.key);
  const desc = t(`achievements.${achievement.key}_desc`, '');

  return (
    <View style={[styles.container, !earned && styles.locked]}>
      <View style={[styles.iconContainer, earned ? styles.iconEarned : styles.iconLocked]}>
        <Ionicons
          name={achievement.icon as any}
          size={22}
          color={earned ? Colors.white : Colors.textTertiary}
        />
      </View>
      <View style={styles.info}>
        <Text style={[styles.title, !earned && styles.titleLocked]}>{title}</Text>
        {desc ? <Text style={styles.desc}>{desc}</Text> : null}
        {earned && (
          <Text style={styles.reward}>+{achievement.xp_reward} XP</Text>
        )}
      </View>
      {earned && (
        <Ionicons name="checkmark-circle" size={20} color={Colors.success} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    gap: Spacing.md,
  },
  locked: {
    opacity: 0.5,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconEarned: {
    backgroundColor: Colors.primary,
  },
  iconLocked: {
    backgroundColor: Colors.border,
  },
  info: {
    flex: 1,
  },
  title: {
    fontSize: FontSize.sm,
    fontWeight: '700',
    color: Colors.text,
  },
  titleLocked: {
    color: Colors.textTertiary,
  },
  desc: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  reward: {
    fontSize: FontSize.xs,
    fontWeight: '700',
    color: Colors.primary,
    marginTop: 2,
  },
});
