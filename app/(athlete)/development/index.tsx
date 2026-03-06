import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useReflections } from '../../../src/hooks/useReflections';
import { useGoals, useCoachFeedback } from '../../../src/hooks/useGoals';
import { useUpcomingSessions } from '../../../src/hooks/useSchedule';
import { useSkillScoreHistory } from '../../../src/hooks/useSkills';
import { Card } from '../../../src/components/ui/Card';
import { Colors, Spacing, FontSize, BorderRadius } from '../../../src/constants/theme';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';

const SESSION_TYPE_ICONS = {
  training: { icon: 'barbell-outline' as const, color: Colors.primary },
  match: { icon: 'trophy-outline' as const, color: Colors.accent },
  gym: { icon: 'fitness-outline' as const, color: Colors.success },
  other: { icon: 'ellipsis-horizontal-outline' as const, color: Colors.textSecondary },
};

export default function DevelopmentScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { data: reflections, isLoading: loadingReflections } = useReflections();
  const { data: goals } = useGoals(undefined, 'active');
  const { data: coachFeedback } = useCoachFeedback();
  const { data: upcomingSessions } = useUpcomingSessions(14);
  const { data: skillHistory } = useSkillScoreHistory();

  const activeGoalCount = goals?.length ?? 0;
  const reflectionCount = reflections?.length ?? 0;

  // Calculate streak (consecutive days with reflections)
  const streak = (() => {
    if (!reflections || reflections.length === 0) return 0;
    let count = 0;
    const today = new Date();
    const dates = reflections.map((r) =>
      format(new Date(r.created_at), 'yyyy-MM-dd')
    );
    const uniqueDates = [...new Set(dates)];
    for (let i = 0; i < uniqueDates.length; i++) {
      const expectedDate = format(
        new Date(today.getTime() - i * 86400000),
        'yyyy-MM-dd'
      );
      if (uniqueDates.includes(expectedDate)) {
        count++;
      } else {
        break;
      }
    }
    return count;
  })();

  // Count skill assessments
  const assessmentCount = (() => {
    if (!skillHistory) return 0;
    const dates = new Set(skillHistory.map((s) => s.assessed_at.split('T')[0]));
    return dates.size;
  })();

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Stats cards */}
        <View style={styles.statsRow}>
          <Card style={styles.statCard} padding={Spacing.md}>
            <Text style={styles.statNumber}>{reflectionCount}</Text>
            <Text style={styles.statLabel}>{t('development.reflections')}</Text>
          </Card>
          <Card style={styles.statCard} padding={Spacing.md}>
            <Text style={styles.statNumber}>{streak}</Text>
            <Text style={styles.statLabel}>{t('development.streak')}</Text>
          </Card>
          <Card style={styles.statCard} padding={Spacing.md}>
            <Text style={[styles.statNumber, { color: Colors.success }]}>{assessmentCount}</Text>
            <Text style={styles.statLabel}>{t('development.assessments')}</Text>
          </Card>
        </View>

        {/* Upcoming Sessions */}
        {upcomingSessions && upcomingSessions.length > 0 && (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{t('development.upcomingSessions')}</Text>
            </View>
            {upcomingSessions.slice(0, 5).map((session) => {
              const config = SESSION_TYPE_ICONS[session.session_type] ?? SESSION_TYPE_ICONS.other;
              const sessionLabel = t(`common.${session.session_type}`, session.session_type);
              const isPast = new Date(session.date) < new Date();
              const hasReflection = !!session.reflection_id;

              return (
                <Card key={session.id} style={styles.sessionCard}>
                  <View style={styles.sessionRow}>
                    <View style={[styles.sessionIcon, { backgroundColor: config.color + '15' }]}>
                      <Ionicons name={config.icon} size={18} color={config.color} />
                    </View>
                    <View style={styles.sessionInfo}>
                      <Text style={styles.sessionLabel}>
                        {session.label ?? sessionLabel}
                      </Text>
                      <Text style={styles.sessionTime}>
                        {format(new Date(session.date), 'EEE d MMM', { locale: nl })} · {session.start_time.slice(0, 5)}
                      </Text>
                    </View>
                    {isPast && !hasReflection && (
                      <TouchableOpacity
                        style={styles.reflectButton}
                        onPress={() => router.push('/(athlete)/development/reflect')}
                      >
                        <Text style={styles.reflectButtonText}>{t('development.reflect')}</Text>
                      </TouchableOpacity>
                    )}
                    {hasReflection && (
                      <Ionicons name="checkmark-circle" size={20} color={Colors.success} />
                    )}
                  </View>
                </Card>
              );
            })}
          </>
        )}

        {/* Profile evolution */}
        {assessmentCount > 1 && (
          <Card style={styles.evolutionCard}>
            <View style={styles.cardHeader}>
              <Ionicons name="trending-up" size={20} color={Colors.primary} />
              <Text style={styles.cardTitle}>{t('development.profileEvolution')}</Text>
            </View>
            <Text style={styles.evolutionText}>
              {t('development.evolutionText', { count: assessmentCount })}
            </Text>
          </Card>
        )}

        {/* Coach feedback */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{t('development.coachFeedback')}</Text>
        </View>
        {coachFeedback && coachFeedback.length > 0 ? (
          coachFeedback.slice(0, 10).map((comment) => (
            <Card key={comment.id} style={styles.feedbackCard}>
              <View style={styles.feedbackHeader}>
                <Text style={styles.feedbackGoalTitle} numberOfLines={1}>
                  {comment.goal_title}
                </Text>
                <Text style={styles.feedbackDate}>
                  {format(new Date(comment.created_at), 'd MMM', { locale: nl })}
                </Text>
              </View>
              <Text style={styles.feedbackContent}>{comment.content}</Text>
            </Card>
          ))
        ) : (
          <View style={styles.empty}>
            <Ionicons name="chatbubble-outline" size={40} color={Colors.textTertiary} />
            <Text style={styles.emptyText}>{t('development.noCoachFeedback')}</Text>
          </View>
        )}

        {/* Recent reflections */}
        <View style={[styles.sectionHeader, { marginTop: Spacing.lg }]}>
          <Text style={styles.sectionTitle}>{t('development.recentReflections')}</Text>
        </View>

        {loadingReflections ? (
          <ActivityIndicator size="small" color={Colors.primary} />
        ) : reflections && reflections.length > 0 ? (
          reflections.slice(0, 20).map((reflection) => (
            <Card key={reflection.id} style={styles.reflectionCard}>
              <View style={styles.reflectionHeader}>
                <View style={styles.sessionTypeBadge}>
                  <Ionicons
                    name={
                      reflection.session_type === 'training'
                        ? 'barbell-outline'
                        : 'trophy-outline'
                    }
                    size={14}
                    color={Colors.primary}
                  />
                  <Text style={styles.sessionTypeText}>
                    {reflection.session_type === 'training' ? t('common.training') : t('common.match')}
                  </Text>
                </View>
                <Text style={styles.reflectionDate}>
                  {format(new Date(reflection.created_at), 'd MMM yyyy', { locale: nl })}
                </Text>
              </View>
              {reflection.notes && (
                <Text style={styles.reflectionNotes} numberOfLines={3}>
                  {reflection.notes}
                </Text>
              )}
            </Card>
          ))
        ) : (
          <View style={styles.empty}>
            <Ionicons
              name="document-text-outline"
              size={40}
              color={Colors.textTertiary}
            />
            <Text style={styles.emptyText}>
              {t('development.noReflections')}
            </Text>
          </View>
        )}
      </ScrollView>

      {/* FAB for new reflection */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push('/(athlete)/development/reflect')}
        activeOpacity={0.8}
      >
        <Ionicons name="add" size={28} color={Colors.white} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    padding: Spacing.lg,
    paddingBottom: 100,
  },
  statsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: FontSize.xxl,
    fontWeight: '800',
    color: Colors.primary,
  },
  statLabel: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.text,
  },
  sessionCard: {
    marginBottom: Spacing.sm,
    padding: Spacing.md,
  },
  sessionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  sessionIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sessionInfo: {
    flex: 1,
  },
  sessionLabel: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.text,
  },
  sessionTime: {
    fontSize: FontSize.xs,
    color: Colors.textTertiary,
    marginTop: 2,
  },
  reflectButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.accent + '20',
  },
  reflectButtonText: {
    fontSize: FontSize.xs,
    fontWeight: '600',
    color: Colors.accent,
  },
  evolutionCard: {
    marginBottom: Spacing.lg,
    padding: Spacing.md,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  cardTitle: {
    fontSize: FontSize.md,
    fontWeight: '700',
    color: Colors.text,
  },
  evolutionText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  feedbackCard: {
    marginBottom: Spacing.sm,
    padding: Spacing.md,
  },
  feedbackHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  feedbackGoalTitle: {
    flex: 1,
    fontSize: FontSize.xs,
    fontWeight: '600',
    color: Colors.primary,
    marginRight: Spacing.sm,
  },
  feedbackDate: {
    fontSize: FontSize.xs,
    color: Colors.textTertiary,
  },
  feedbackContent: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  reflectionCard: {
    marginBottom: Spacing.sm,
    padding: Spacing.md,
  },
  reflectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  sessionTypeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.primary + '10',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  sessionTypeText: {
    fontSize: FontSize.xs,
    fontWeight: '600',
    color: Colors.primary,
  },
  reflectionDate: {
    fontSize: FontSize.xs,
    color: Colors.textTertiary,
  },
  reflectionNotes: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  empty: {
    alignItems: 'center',
    paddingVertical: Spacing.xxl,
    gap: Spacing.sm,
  },
  emptyText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
});
