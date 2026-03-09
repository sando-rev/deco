import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
  Modal,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useGoalWithComments, useUpdateGoalStatus } from '../../../src/hooks/useGoals';
import { useSkillDefinitions, useLatestSkillScores } from '../../../src/hooks/useSkills';
import { useMarkFeedbackSeen } from '../../../src/hooks/useGamification';
import { GoalAnalysisCard } from '../../../src/components/GoalAnalysisCard';
import { Colors, Spacing, FontSize, BorderRadius } from '../../../src/constants/theme';
import { Button } from '../../../src/components/ui/Button';
import { Card } from '../../../src/components/ui/Card';
import { Celebration } from '../../../src/components/Celebration';
import { format, differenceInDays } from 'date-fns';
import { nl } from 'date-fns/locale';

const IMPROVEMENT_OPTIONS = [0, 0.5, 1, 1.5, 2];

export default function GoalDetailScreen() {
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { data: goal, isLoading } = useGoalWithComments(id);
  const { data: skillDefs } = useSkillDefinitions();
  const { data: skillScores } = useLatestSkillScores();
  const updateStatus = useUpdateGoalStatus();
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [selectedImprovement, setSelectedImprovement] = useState<number>(1);
  const [showCelebration, setShowCelebration] = useState(false);
  const markSeen = useMarkFeedbackSeen();

  // Mark coach comments as seen when viewing this goal
  React.useEffect(() => {
    if (goal?.coach_comments?.some((c) => !(c as any).seen_by_athlete)) {
      markSeen.mutate(id);
    }
  }, [goal?.coach_comments?.length]);

  if (isLoading || !goal) {
    return (
      <View style={styles.centered}>
        <Text style={styles.loadingText}>{t('common.loading')}</Text>
      </View>
    );
  }

  // Look up skill label
  const skillLabel = (() => {
    if (goal.skill_id && skillDefs) {
      const skill = skillDefs.find((s) => s.id === goal.skill_id);
      if (skill) return { label: skill.label, icon: skill.icon };
    }
    if (goal.attribute) {
      return {
        label: goal.attribute.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
        icon: 'flag-outline',
      };
    }
    return null;
  })();

  // Current skill score for the goal's skill
  const currentScore = goal.skill_id && skillScores
    ? skillScores.find((s) => s.skill_id === goal.skill_id)?.score ?? null
    : null;

  const daysLeft = goal.deadline
    ? differenceInDays(new Date(goal.deadline), new Date())
    : null;
  const isOverdue = daysLeft !== null && daysLeft < 0;

  const handleAchieve = async () => {
    try {
      await updateStatus.mutateAsync({
        goalId: goal.id,
        status: 'achieved',
        scoreImprovement: selectedImprovement,
      });
      setShowCompleteModal(false);
      setShowCelebration(true);
    } catch (error: any) {
      Alert.alert(t('common.error'), error.message);
    }
  };

  const handleAbandon = () => {
    Alert.alert(
      t('goals.abandon'),
      t('goals.abandonConfirm'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('goals.abandonButton'),
          style: 'destructive',
          onPress: async () => {
            try {
              await updateStatus.mutateAsync({ goalId: goal.id, status: 'abandoned' });
              router.back();
            } catch (error: any) {
              Alert.alert(t('common.error'), error.message);
            }
          },
        },
      ]
    );
  };

  return (
    <>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          {skillLabel && (
            <View style={[styles.attributeBadge, { backgroundColor: Colors.primary + '15' }]}>
              <Ionicons name={skillLabel.icon as any} size={16} color={Colors.primary} />
              <Text style={styles.attributeText}>{skillLabel.label}</Text>
            </View>
          )}
          <View
            style={[
              styles.statusBadge,
              {
                backgroundColor:
                  goal.status === 'achieved'
                    ? Colors.success + '15'
                    : goal.status === 'abandoned'
                    ? Colors.textTertiary + '15'
                    : Colors.primary + '15',
              },
            ]}
          >
            <Text
              style={[
                styles.statusText,
                {
                  color:
                    goal.status === 'achieved'
                      ? Colors.success
                      : goal.status === 'abandoned'
                      ? Colors.textTertiary
                      : Colors.primary,
                },
              ]}
            >
              {goal.status === 'active' ? t('goals.active') : goal.status === 'achieved' ? t('goals.achieved') : t('goals.abandoned')}
            </Text>
          </View>
        </View>

        <Text style={styles.title}>{goal.title}</Text>
        {goal.description && (
          <Text style={styles.description}>{goal.description}</Text>
        )}

        <Card style={styles.infoCard}>
          {goal.deadline && (
            <View style={styles.infoRow}>
              <Ionicons name="calendar-outline" size={18} color={Colors.textSecondary} />
              <Text style={styles.infoLabel}>{t('goals.deadlineLabel')}</Text>
              <Text style={[styles.infoValue, isOverdue && goal.status === 'active' && { color: Colors.error }]}>
                {format(new Date(goal.deadline), 'd MMMM yyyy', { locale: nl })}
                {goal.status === 'active' && daysLeft !== null && (
                  isOverdue
                    ? ` (${t('goals.daysOverdue', { days: Math.abs(daysLeft) })})`
                    : ` (${t('goals.daysLeft', { days: daysLeft })})`
                )}
              </Text>
            </View>
          )}
          <View style={styles.infoRow}>
            <Ionicons name="time-outline" size={18} color={Colors.textSecondary} />
            <Text style={styles.infoLabel}>{t('goals.createdAt')}</Text>
            <Text style={styles.infoValue}>
              {format(new Date(goal.created_at), 'd MMMM yyyy', { locale: nl })}
            </Text>
          </View>
          {goal.status === 'achieved' && goal.score_improvement != null && (
            <View style={styles.infoRow}>
              <Ionicons name="trending-up" size={18} color={Colors.success} />
              <Text style={styles.infoLabel}>{t('goals.improvement')}</Text>
              <Text style={[styles.infoValue, { color: Colors.success, fontWeight: '700' }]}>
                +{goal.score_improvement}
              </Text>
            </View>
          )}
        </Card>

        {/* Show structured AI analysis if available, otherwise fallback to text */}
        {goal.ai_analysis ? (
          <View style={{ marginBottom: Spacing.lg }}>
            <GoalAnalysisCard analysis={goal.ai_analysis} />
          </View>
        ) : goal.ai_feedback ? (
          <Card style={styles.aiCard}>
            <View style={styles.aiHeader}>
              <Ionicons name="sparkles" size={16} color={Colors.accent} />
              <Text style={styles.aiLabel}>{t('goals.aiFeedback')}</Text>
            </View>
            <Text style={styles.aiText}>{goal.ai_feedback}</Text>
          </Card>
        ) : null}

        {goal.coach_comments && goal.coach_comments.length > 0 && (
          <View style={styles.commentsSection}>
            <View style={styles.feedbackHeader}>
              <Ionicons name="chatbubbles" size={18} color={Colors.primary} />
              <Text style={styles.sectionTitle}>{t('goals.coachFeedback')}</Text>
            </View>
            {/* Thumbs up indicator */}
            {goal.coach_comments.some((c) => c.is_thumbs_up) && (
              <View style={styles.thumbsUpBanner}>
                <Ionicons name="thumbs-up" size={18} color={Colors.primary} />
                <Text style={styles.thumbsUpText}>{t('coachFeedback.thumbsUp')}</Text>
              </View>
            )}
            {/* Text comments */}
            {goal.coach_comments
              .filter((c) => c.content)
              .map((comment) => (
                <Card key={comment.id} style={styles.commentCard}>
                  <Text style={styles.commentText}>{comment.content}</Text>
                  <Text style={styles.commentDate}>
                    {format(new Date(comment.created_at), 'd MMM yyyy', { locale: nl })}
                  </Text>
                </Card>
              ))}
          </View>
        )}

        {goal.status === 'active' && (
          <View style={styles.actions}>
            <Button
              title={t('goals.markAchieved')}
              onPress={() => setShowCompleteModal(true)}
              size="lg"
              style={styles.achieveButton}
            />
            <TouchableOpacity onPress={handleAbandon} style={styles.abandonLink}>
              <Text style={styles.abandonText}>{t('goals.abandon')}</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      <Modal
        visible={showCompleteModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowCompleteModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{t('goals.wellDone')}</Text>
            <Text style={styles.modalSubtitle}>
              {t('goals.howMuchImproved', { skill: skillLabel?.label?.toLowerCase() ?? 'skill' })}
            </Text>

            {currentScore !== null && (
              <View style={styles.currentScoreRow}>
                <Text style={styles.currentScoreLabel}>{t('goals.currentScore')}</Text>
                <Text style={styles.currentScoreValue}>{currentScore}/10</Text>
                {selectedImprovement > 0 && (
                  <Text style={styles.newScoreValue}>
                    → {Math.min(10, currentScore + selectedImprovement)}/10
                  </Text>
                )}
              </View>
            )}

            <View style={styles.improvementGrid}>
              {IMPROVEMENT_OPTIONS.map((val) => {
                const isSelected = selectedImprovement === val;
                return (
                  <TouchableOpacity
                    key={val}
                    style={[
                      styles.improvementChip,
                      isSelected && styles.improvementChipActive,
                    ]}
                    onPress={() => setSelectedImprovement(val)}
                  >
                    <Text
                      style={[
                        styles.improvementText,
                        isSelected && styles.improvementTextActive,
                      ]}
                    >
                      {val === 0 ? t('goals.noChange') : `+${val}`}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Button
              title={updateStatus.isPending ? t('goals.saving') : t('goals.completeGoal')}
              onPress={handleAchieve}
              loading={updateStatus.isPending}
              size="lg"
            />
            <TouchableOpacity
              onPress={() => setShowCompleteModal(false)}
              style={styles.cancelLink}
            >
              <Text style={styles.cancelText}>{t('common.cancel')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Celebration
        visible={showCelebration}
        message={t('goals.celebrationAchieved')}
        onDismiss={() => {
          setShowCelebration(false);
          router.replace('/(athlete)/profile');
        }}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: Colors.textSecondary,
    fontSize: FontSize.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  attributeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
  },
  attributeText: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.primary,
  },
  statusBadge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
  },
  statusText: {
    fontSize: FontSize.sm,
    fontWeight: '600',
  },
  title: {
    fontSize: FontSize.xl,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  description: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    lineHeight: 24,
    marginBottom: Spacing.lg,
  },
  infoCard: {
    marginBottom: Spacing.lg,
    gap: Spacing.md,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  infoLabel: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    width: 70,
  },
  infoValue: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.text,
    flex: 1,
  },
  aiCard: {
    marginBottom: Spacing.lg,
    borderLeftWidth: 3,
    borderLeftColor: Colors.accent,
  },
  aiHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: Spacing.sm,
  },
  aiLabel: {
    fontSize: FontSize.sm,
    fontWeight: '700',
    color: Colors.accent,
  },
  aiText: {
    fontSize: FontSize.sm,
    color: Colors.text,
    lineHeight: 22,
  },
  commentsSection: {
    marginBottom: Spacing.lg,
  },
  feedbackHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  thumbsUpBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.primary + '10',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
  },
  thumbsUpText: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.primary,
  },
  sectionTitle: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.text,
  },
  commentCard: {
    marginBottom: Spacing.sm,
    gap: Spacing.sm,
  },
  commentText: {
    fontSize: FontSize.sm,
    color: Colors.text,
    lineHeight: 20,
  },
  commentDate: {
    fontSize: FontSize.xs,
    color: Colors.textTertiary,
  },
  actions: {
    marginTop: Spacing.md,
    alignItems: 'center',
    gap: Spacing.md,
  },
  achieveButton: {
    width: '100%',
  },
  abandonLink: {
    padding: Spacing.sm,
  },
  abandonText: {
    fontSize: FontSize.sm,
    color: Colors.textTertiary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    padding: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
  modalTitle: {
    fontSize: FontSize.xl,
    fontWeight: '700',
    color: Colors.text,
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },
  modalSubtitle: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  improvementGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  improvementChip: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surfaceSecondary,
    borderWidth: 2,
    borderColor: 'transparent',
    minWidth: 70,
    alignItems: 'center',
  },
  improvementChipActive: {
    backgroundColor: Colors.primary + '15',
    borderColor: Colors.primary,
  },
  improvementText: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  improvementTextActive: {
    color: Colors.primary,
  },
  cancelLink: {
    alignItems: 'center',
    padding: Spacing.md,
    marginTop: Spacing.sm,
  },
  cancelText: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
  },
  currentScoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
    backgroundColor: Colors.surfaceSecondary,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  currentScoreLabel: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  currentScoreValue: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.text,
  },
  newScoreValue: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.success,
  },
});
