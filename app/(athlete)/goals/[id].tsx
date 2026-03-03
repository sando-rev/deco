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
import { useGoalWithComments, useUpdateGoalStatus } from '../../../src/hooks/useGoals';
import { useSkillDefinitions } from '../../../src/hooks/useSkills';
import { GoalAnalysisCard } from '../../../src/components/GoalAnalysisCard';
import { Colors, Spacing, FontSize, BorderRadius } from '../../../src/constants/theme';
import { Button } from '../../../src/components/ui/Button';
import { Card } from '../../../src/components/ui/Card';
import { format, differenceInDays } from 'date-fns';

const IMPROVEMENT_OPTIONS = [0, 0.5, 1, 1.5, 2, 2.5, 3];

export default function GoalDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { data: goal, isLoading } = useGoalWithComments(id);
  const { data: skillDefs } = useSkillDefinitions();
  const updateStatus = useUpdateGoalStatus();
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [selectedImprovement, setSelectedImprovement] = useState<number>(1);

  if (isLoading || !goal) {
    return (
      <View style={styles.centered}>
        <Text style={styles.loadingText}>Loading...</Text>
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
      router.back();
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  const handleAbandon = () => {
    Alert.alert(
      'Abandon Goal',
      'Are you sure you want to abandon this goal?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Abandon',
          style: 'destructive',
          onPress: async () => {
            try {
              await updateStatus.mutateAsync({ goalId: goal.id, status: 'abandoned' });
              router.back();
            } catch (error: any) {
              Alert.alert('Error', error.message);
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
              {goal.status.charAt(0).toUpperCase() + goal.status.slice(1)}
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
              <Text style={styles.infoLabel}>Deadline</Text>
              <Text style={[styles.infoValue, isOverdue && goal.status === 'active' && { color: Colors.error }]}>
                {format(new Date(goal.deadline), 'MMMM d, yyyy')}
                {goal.status === 'active' && daysLeft !== null && (
                  isOverdue
                    ? ` (${Math.abs(daysLeft)}d overdue)`
                    : ` (${daysLeft}d left)`
                )}
              </Text>
            </View>
          )}
          <View style={styles.infoRow}>
            <Ionicons name="time-outline" size={18} color={Colors.textSecondary} />
            <Text style={styles.infoLabel}>Created</Text>
            <Text style={styles.infoValue}>
              {format(new Date(goal.created_at), 'MMMM d, yyyy')}
            </Text>
          </View>
          {goal.status === 'achieved' && goal.score_improvement != null && (
            <View style={styles.infoRow}>
              <Ionicons name="trending-up" size={18} color={Colors.success} />
              <Text style={styles.infoLabel}>Improvement</Text>
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
              <Text style={styles.aiLabel}>Deco AI Feedback</Text>
            </View>
            <Text style={styles.aiText}>{goal.ai_feedback}</Text>
          </Card>
        ) : null}

        {goal.coach_comments && goal.coach_comments.length > 0 && (
          <View style={styles.commentsSection}>
            <Text style={styles.sectionTitle}>Coach Feedback</Text>
            {goal.coach_comments.map((comment) => (
              <Card key={comment.id} style={styles.commentCard}>
                {comment.is_thumbs_up && (
                  <Ionicons name="thumbs-up" size={20} color={Colors.primary} />
                )}
                {comment.content && (
                  <Text style={styles.commentText}>{comment.content}</Text>
                )}
                <Text style={styles.commentDate}>
                  {format(new Date(comment.created_at), 'MMM d, yyyy')}
                </Text>
              </Card>
            ))}
          </View>
        )}

        {goal.status === 'active' && (
          <View style={styles.actions}>
            <Button
              title="Goal Achieved"
              onPress={() => setShowCompleteModal(true)}
              size="lg"
              style={styles.achieveButton}
            />
            <TouchableOpacity onPress={handleAbandon} style={styles.abandonLink}>
              <Text style={styles.abandonText}>Abandon goal</Text>
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
            <Text style={styles.modalTitle}>Well done!</Text>
            <Text style={styles.modalSubtitle}>
              How much did your {skillLabel?.label?.toLowerCase() ?? 'skill'} improve?
            </Text>

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
                      {val === 0 ? 'No change' : `+${val}`}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Button
              title={updateStatus.isPending ? 'Saving...' : 'Complete Goal'}
              onPress={handleAchieve}
              loading={updateStatus.isPending}
              size="lg"
            />
            <TouchableOpacity
              onPress={() => setShowCompleteModal(false)}
              style={styles.cancelLink}
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  sectionTitle: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: Spacing.md,
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
});
