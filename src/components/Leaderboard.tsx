import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Colors, Spacing, FontSize, BorderRadius } from '../constants/theme';
import { LeaderboardEntry } from '../hooks/useGamification';

interface LeaderboardProps {
  entries: LeaderboardEntry[];
  currentUserId?: string;
}

export function Leaderboard({ entries, currentUserId }: LeaderboardProps) {
  const { t } = useTranslation();

  if (entries.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>{t('gamification.noTeamMembers')}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {entries.map((entry, index) => {
        const isCurrentUser = entry.athlete_id === currentUserId;
        const rank = index + 1;
        const initials = entry.full_name
          ?.split(' ')
          .map((n) => n[0])
          .join('')
          .toUpperCase()
          .slice(0, 2);

        return (
          <View
            key={entry.athlete_id}
            style={[
              styles.row,
              isCurrentUser && styles.rowHighlight,
              rank <= 3 && styles.rowTop3,
            ]}
          >
            <View style={styles.rankContainer}>
              {rank === 1 ? (
                <View style={[styles.rankBadge, { backgroundColor: '#FFD700' }]}>
                  <Text style={styles.rankBadgeText}>1</Text>
                </View>
              ) : rank === 2 ? (
                <View style={[styles.rankBadge, { backgroundColor: '#C0C0C0' }]}>
                  <Text style={styles.rankBadgeText}>2</Text>
                </View>
              ) : rank === 3 ? (
                <View style={[styles.rankBadge, { backgroundColor: '#CD7F32' }]}>
                  <Text style={styles.rankBadgeText}>3</Text>
                </View>
              ) : (
                <Text style={styles.rankText}>{rank}</Text>
              )}
            </View>

            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{initials}</Text>
            </View>

            <View style={styles.info}>
              <Text style={[styles.name, isCurrentUser && styles.nameHighlight]} numberOfLines={1}>
                {entry.full_name}
                {isCurrentUser ? ` (${t('gamification.you')})` : ''}
              </Text>
              <Text style={styles.xpText}>{entry.total_xp} XP</Text>
            </View>

            <View style={styles.stats}>
              <View style={styles.statItem}>
                <Ionicons name="flame" size={14} color="#FF6B35" />
                <Text style={styles.statValue}>{entry.streak}</Text>
              </View>
              <View style={styles.statItem}>
                <Ionicons name="trophy" size={14} color={Colors.accent} />
                <Text style={styles.statValue}>{entry.goals_achieved}</Text>
              </View>
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.xs,
  },
  empty: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
  },
  emptyText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    gap: Spacing.md,
  },
  rowHighlight: {
    backgroundColor: Colors.primary + '10',
    borderWidth: 1.5,
    borderColor: Colors.primary + '30',
  },
  rowTop3: {
    // subtle emphasis for top 3
  },
  rankContainer: {
    width: 28,
    alignItems: 'center',
  },
  rankBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankBadgeText: {
    fontSize: FontSize.xs,
    fontWeight: '800',
    color: Colors.white,
  },
  rankText: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.textTertiary,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primaryLight + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: FontSize.xs,
    fontWeight: '700',
    color: Colors.primary,
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.text,
  },
  nameHighlight: {
    color: Colors.primary,
    fontWeight: '700',
  },
  xpText: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    fontWeight: '600',
    marginTop: 1,
  },
  stats: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  statValue: {
    fontSize: FontSize.xs,
    fontWeight: '700',
    color: Colors.text,
  },
});
