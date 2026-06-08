import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { formatDistanceToNow } from 'date-fns';
import { nl, enUS } from 'date-fns/locale';
import { Card } from './ui/Card';
import { FeedEvent, FeedEmoji, FEED_EMOJIS, useFeedReactions, useToggleReaction } from '../hooks/useFeed';
import { Colors, Spacing, FontSize, BorderRadius } from '../constants/theme';

// ─── Event icon mapping ─────────────────────────────────────────────────────

const EVENT_ICONS: Record<string, { name: keyof typeof Ionicons.glyphMap; color: string }> = {
  reflection_streak_3: { name: 'flame', color: '#FF6B35' },
  personal_record_week: { name: 'trophy', color: '#F5A623' },
  streak_7_plus: { name: 'bonfire', color: '#FF4500' },
  goal_achieved: { name: 'flag', color: '#2D9B6A' },
  coach_overview_published: { name: 'clipboard', color: Colors.primary },
  weekly_summary: { name: 'bar-chart', color: Colors.primary },
  coach_announcement: { name: 'megaphone', color: '#E53E3E' },
};

const EMOJI_DISPLAY: Record<string, string> = {
  like: '👍',
  '💪': '💪',
  '🔥': '🔥',
  '👏': '👏',
  '🏑': '🏑',
  '⭐': '⭐',
  '🎯': '🎯',
};

// ─── Component ──────────────────────────────────────────────────────────────

interface FeedEventCardProps {
  event: FeedEvent;
}

export function FeedEventCard({ event }: FeedEventCardProps) {
  const { t, i18n } = useTranslation();
  const locale = i18n.language === 'nl' ? nl : enUS;
  const { data: reactionData } = useFeedReactions(event.id);
  const toggleReaction = useToggleReaction();

  const iconConfig = EVENT_ICONS[event.event_type] ?? { name: 'ellipse', color: Colors.textTertiary };

  const getEventText = (): string => {
    const name = event.athlete_name ?? event.metadata?.name ?? '';
    switch (event.event_type) {
      case 'reflection_streak_3':
        return t('feed.reflectionStreak3', { name });
      case 'personal_record_week':
        return t('feed.personalRecordWeek', { name, count: event.metadata?.count ?? 0 });
      case 'streak_7_plus':
        return t('feed.streak7Plus', { name, days: event.metadata?.days ?? 7 });
      case 'goal_achieved':
        return t('feed.goalAchieved', { name, goal: event.metadata?.goalTitle ?? '' });
      case 'coach_overview_published':
        return t('feed.coachOverview');
      case 'weekly_summary':
        return t('feed.weeklySummary');
      case 'coach_announcement':
        return event.metadata?.message ?? '';
      default:
        return '';
    }
  };

  const timeAgo = formatDistanceToNow(new Date(event.created_at), { addSuffix: true, locale });

  const handleReaction = (emoji: FeedEmoji) => {
    toggleReaction.mutate({ eventId: event.id, emoji });
  };

  return (
    <Card style={event.is_pinned ? { ...styles.card, ...styles.pinnedCard } : styles.card}>
      {event.is_pinned && (
        <View style={styles.pinnedBadge}>
          <Ionicons name="pin" size={10} color={Colors.primary} />
          <Text style={styles.pinnedText}>{t('feed.pinnedLabel')}</Text>
        </View>
      )}

      <View style={styles.header}>
        <View style={[styles.iconCircle, { backgroundColor: iconConfig.color + '15' }]}>
          <Ionicons name={iconConfig.name} size={18} color={iconConfig.color} />
        </View>
        <View style={styles.textContainer}>
          {event.event_type === 'weekly_summary' ? (
            <WeeklySummaryContent event={event} t={t} />
          ) : (
            <Text style={styles.eventText}>{getEventText()}</Text>
          )}
          <Text style={styles.timeText}>{timeAgo}</Text>
        </View>
      </View>

      {/* Emoji reaction bar */}
      <View style={styles.reactionBar}>
        {FEED_EMOJIS.map((emoji) => {
          const count = reactionData?.counts.get(emoji) ?? 0;
          const isSelected = reactionData?.userEmoji === emoji;
          return (
            <TouchableOpacity
              key={emoji}
              style={[styles.emojiBtn, isSelected && styles.emojiBtnActive]}
              onPress={() => handleReaction(emoji)}
              activeOpacity={0.7}
            >
              <Text style={styles.emojiText}>{EMOJI_DISPLAY[emoji]}</Text>
              {count > 0 && <Text style={[styles.emojiCount, isSelected && styles.emojiCountActive]}>{count}</Text>}
            </TouchableOpacity>
          );
        })}
      </View>
    </Card>
  );
}

// ─── Weekly summary content ─────────────────────────────────────────────────

function WeeklySummaryContent({ event, t }: { event: FeedEvent; t: any }) {
  const meta = event.metadata;
  return (
    <View style={styles.summaryContent}>
      <Text style={styles.summaryTitle}>{t('feed.weeklySummary')}</Text>
      {meta?.mostActive && (
        <Text style={styles.summaryLine}>{t('feed.mostActive', { name: meta.mostActive })}</Text>
      )}
      {meta?.biggestGrowth && (
        <Text style={styles.summaryLine}>{t('feed.biggestGrowth', { name: meta.biggestGrowth })}</Text>
      )}
      {meta?.teamAverage !== undefined && (
        <Text style={styles.summaryLine}>
          {t('feed.teamAverage', { score: meta.teamAverage.toFixed(1) })}
          {meta?.avgChange !== undefined && (
            <Text style={{ color: meta.avgChange >= 0 ? '#2D9B6A' : '#E53E3E' }}>
              {' '}{meta.avgChange >= 0 ? '↑' : '↓'} {Math.abs(meta.avgChange).toFixed(1)}
            </Text>
          )}
        </Text>
      )}
      {meta?.playersReflected !== undefined && (
        <Text style={styles.summaryLine}>
          {t('feed.playersReflected', { count: meta.playersReflected, total: meta.totalPlayers })}
        </Text>
      )}
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  card: {
    marginBottom: Spacing.md,
    padding: Spacing.md,
  },
  pinnedCard: {
    borderWidth: 1.5,
    borderColor: Colors.primary + '40',
    backgroundColor: Colors.primary + '05',
  },
  pinnedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: Spacing.xs,
  },
  pinnedText: {
    fontSize: FontSize.xs,
    fontWeight: '600',
    color: Colors.primary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContainer: {
    flex: 1,
  },
  eventText: {
    fontSize: FontSize.sm,
    color: Colors.text,
    lineHeight: 20,
  },
  timeText: {
    fontSize: FontSize.xs,
    color: Colors.textTertiary,
    marginTop: 4,
  },
  reactionBar: {
    flexDirection: 'row',
    gap: Spacing.xs,
    marginTop: Spacing.sm,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  emojiBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.surfaceSecondary,
  },
  emojiBtnActive: {
    backgroundColor: Colors.primary + '20',
  },
  emojiText: {
    fontSize: 14,
  },
  emojiCount: {
    fontSize: FontSize.xs,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  emojiCountActive: {
    color: Colors.primary,
  },
  summaryContent: {
    gap: 4,
  },
  summaryTitle: {
    fontSize: FontSize.md,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 4,
  },
  summaryLine: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
});
