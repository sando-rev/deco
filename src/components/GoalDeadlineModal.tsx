/**
 * GoalDeadlineModal
 *
 * Shows when a goal's deadline has expired. Offers three outcomes:
 *   1. Doel bereikt  — mark achieved + optional skill score improvement + celebration
 *   2. Meer tijd nodig — extend deadline by 1 week / 2 weeks / 1 month
 *   3. Doel loslaten — mark abandoned + motivational close screen
 *
 * Usage:
 *   <GoalDeadlineModal
 *     goal={{ id, title, deadline, skill_id }}
 *     visible={showModal}
 *     onDismiss={() => setShowModal(false)}
 *   />
 */

import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { format, addWeeks, addMonths } from 'date-fns';
import { nl } from 'date-fns/locale';
import { useQueryClient } from '@tanstack/react-query';

import { Colors, Spacing, FontSize, BorderRadius } from '../constants/theme';
import { Button } from './ui/Button';
import { supabase } from '../services/supabase';
import { useUpdateGoalStatus } from '../hooks/useGoals';
import { useInsertGoalAchievedEvent } from '../hooks/useFeed';
import { useLatestSkillScores, useSkillDefinitions } from '../hooks/useSkills';
import { useCelebration } from './CelebrationContext';

// ─── Types ────────────────────────────────────────────────────────────────────

interface GoalDeadlineModalProps {
  goal: {
    id: string;
    title: string;
    deadline: string;
    skill_id: string | null;
  };
  visible: boolean;
  onDismiss: () => void;
}

type View =
  | 'menu'
  | 'achieved'
  | 'achieved_new_goal'
  | 'extend'
  | 'extend_done'
  | 'abandon'
  | 'abandon_done';

const IMPROVEMENT_OPTIONS = [0, 0.5, 1, 1.5, 2];

// ─── Component ────────────────────────────────────────────────────────────────

export function GoalDeadlineModal({ goal, visible, onDismiss }: GoalDeadlineModalProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { celebrate } = useCelebration();
  const updateGoalStatus = useUpdateGoalStatus();
  const insertGoalAchievedEvent = useInsertGoalAchievedEvent();

  const { data: skillDefinitions } = useSkillDefinitions();
  const { data: skillScores } = useLatestSkillScores();

  const [view, setView] = useState<View>('menu');
  const [selectedImprovement, setSelectedImprovement] = useState<number>(0);
  const [extendError, setExtendError] = useState<string | null>(null);
  const [isExtending, setIsExtending] = useState(false);

  // Derived data
  const skillDefinition = goal.skill_id
    ? skillDefinitions?.find((s) => s.id === goal.skill_id)
    : null;
  const currentSkillScore = goal.skill_id
    ? skillScores?.find((s) => s.skill_id === goal.skill_id)?.score
    : null;

  const formattedDeadline = (() => {
    try {
      return format(new Date(goal.deadline), 'd MMMM yyyy', { locale: nl });
    } catch {
      return goal.deadline;
    }
  })();

  // ─── Handlers ───────────────────────────────────────────────────────────────

  function handleReset() {
    setView('menu');
    setSelectedImprovement(0);
    setExtendError(null);
    setIsExtending(false);
  }

  function handleClose() {
    handleReset();
    onDismiss();
  }

  async function handleAchievedConfirm() {
    try {
      await updateGoalStatus.mutateAsync({
        goalId: goal.id,
        status: 'achieved',
        scoreImprovement: goal.skill_id ? selectedImprovement : undefined,
      });

      // Post to team activity feed (non-critical, fire-and-forget)
      insertGoalAchievedEvent
        .mutateAsync({ goalId: goal.id, goalTitle: goal.title })
        .catch((err) => console.warn('[GoalDeadlineModal] Failed to insert feed event:', err));

      celebrate({
        type: 'goal_achieved',
        message: 'Doel bereikt!',
        subMessage: 'Geweldig gedaan!',
        confetti: true,
      });

      setView('achieved_new_goal');
    } catch {
      // Error is surfaced via updateGoalStatus.isError
    }
  }

  async function handleExtend(weeks?: number, months?: number) {
    setIsExtending(true);
    setExtendError(null);

    try {
      const base = new Date();
      const newDeadline = months
        ? addMonths(base, months).toISOString()
        : addWeeks(base, weeks ?? 1).toISOString();

      const { error } = await supabase
        .from('goals')
        .update({ deadline: newDeadline })
        .eq('id', goal.id);

      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ['goals'] });
      setView('extend_done');
    } catch (err: any) {
      setExtendError(err?.message ?? 'Er is iets misgegaan. Probeer opnieuw.');
    } finally {
      setIsExtending(false);
    }
  }

  async function handleAbandon() {
    try {
      await updateGoalStatus.mutateAsync({ goalId: goal.id, status: 'abandoned' });
      setView('abandon_done');
    } catch {
      // Error surfaced via updateGoalStatus.isError
    }
  }

  function navigateToNewGoal() {
    handleClose();
    router.push('/(athlete)/goals/new');
  }

  // ─── Sub-views ──────────────────────────────────────────────────────────────

  function renderMenu() {
    return (
      <>
        <View style={styles.headerRow}>
          <View style={styles.headerIconWrap}>
            <Ionicons name="time-outline" size={22} color={Colors.error} />
          </View>
          <Text style={styles.headerTitle}>Je doel is verlopen</Text>
        </View>

        <Text style={styles.goalTitle}>{goal.title}</Text>
        <View style={styles.deadlineRow}>
          <Ionicons name="calendar-outline" size={14} color={Colors.textSecondary} />
          <Text style={styles.deadlineText}>Deadline was: {formattedDeadline}</Text>
        </View>

        <View style={styles.optionsList}>
          <TouchableOpacity
            style={[styles.optionCard, styles.optionAchieved]}
            onPress={() => setView('achieved')}
            activeOpacity={0.75}
          >
            <View style={styles.optionIcon}>
              <Ionicons name="trophy-outline" size={22} color={Colors.success} />
            </View>
            <View style={styles.optionText}>
              <Text style={[styles.optionTitle, { color: Colors.success }]}>Doel bereikt!</Text>
              <Text style={styles.optionDesc}>Vier je succes en groei je profiel</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={Colors.textTertiary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.optionCard, styles.optionExtend]}
            onPress={() => setView('extend')}
            activeOpacity={0.75}
          >
            <View style={styles.optionIcon}>
              <Ionicons name="alarm-outline" size={22} color={Colors.accent} />
            </View>
            <View style={styles.optionText}>
              <Text style={[styles.optionTitle, { color: Colors.accent }]}>Meer tijd nodig</Text>
              <Text style={styles.optionDesc}>Verleng de deadline van je doel</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={Colors.textTertiary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.optionCard, styles.optionAbandon]}
            onPress={() => setView('abandon')}
            activeOpacity={0.75}
          >
            <View style={styles.optionIcon}>
              <Ionicons name="close-circle-outline" size={22} color={Colors.error} />
            </View>
            <View style={styles.optionText}>
              <Text style={[styles.optionTitle, { color: Colors.error }]}>Doel loslaten</Text>
              <Text style={styles.optionDesc}>Soms is het tijd voor iets nieuws</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={Colors.textTertiary} />
          </TouchableOpacity>
        </View>
      </>
    );
  }

  function renderAchieved() {
    const hasSkill = !!goal.skill_id && !!skillDefinition;

    return (
      <>
        <TouchableOpacity style={styles.backButton} onPress={() => setView('menu')}>
          <Ionicons name="arrow-back" size={18} color={Colors.textSecondary} />
          <Text style={styles.backText}>Terug</Text>
        </TouchableOpacity>

        <View style={styles.centeredHeader}>
          <Text style={styles.sectionEmoji}>🎉</Text>
          <Text style={styles.sectionTitle}>Doel bereikt!</Text>
          <Text style={styles.goalTitleSm}>{goal.title}</Text>
        </View>

        {hasSkill && (
          <View style={styles.improvementSection}>
            <Text style={styles.improvementQuestion}>Hoeveel ben je gegroeid?</Text>
            <View style={styles.skillRow}>
              <Ionicons name="stats-chart" size={16} color={Colors.primary} />
              <Text style={styles.skillName}>{skillDefinition!.label}</Text>
              {currentSkillScore != null && (
                <View style={styles.currentScorePill}>
                  <Text style={styles.currentScoreText}>
                    Huidig: {currentSkillScore}
                  </Text>
                </View>
              )}
            </View>

            <View style={styles.chipRow}>
              {IMPROVEMENT_OPTIONS.map((val) => {
                const selected = selectedImprovement === val;
                return (
                  <TouchableOpacity
                    key={val}
                    style={[styles.chip, selected && styles.chipSelected]}
                    onPress={() => setSelectedImprovement(val)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
                      {val === 0 ? '0' : `+${val}`}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {currentSkillScore != null && selectedImprovement > 0 && (
              <Text style={styles.newScoreHint}>
                Nieuwe score: {Math.min(10, currentSkillScore + selectedImprovement)}
              </Text>
            )}
          </View>
        )}

        {updateGoalStatus.isError && (
          <Text style={styles.errorText}>Er is iets misgegaan. Probeer opnieuw.</Text>
        )}

        <Button
          title="Bevestigen"
          onPress={handleAchievedConfirm}
          loading={updateGoalStatus.isPending}
          style={styles.confirmButton}
        />
      </>
    );
  }

  function renderAchievedNewGoal() {
    return (
      <View style={styles.centeredSection}>
        <Text style={styles.sectionEmoji}>🌟</Text>
        <Text style={styles.sectionTitle}>Geweldig gedaan!</Text>
        <Text style={styles.bodyText}>Wil je een nieuw doel stellen?</Text>
        <Button
          title="Ja, nieuw doel!"
          onPress={navigateToNewGoal}
          style={styles.confirmButton}
        />
        <TouchableOpacity style={styles.laterLink} onPress={handleClose}>
          <Text style={styles.laterText}>Later</Text>
        </TouchableOpacity>
      </View>
    );
  }

  function renderExtend() {
    return (
      <>
        <TouchableOpacity style={styles.backButton} onPress={() => setView('menu')}>
          <Ionicons name="arrow-back" size={18} color={Colors.textSecondary} />
          <Text style={styles.backText}>Terug</Text>
        </TouchableOpacity>

        <View style={styles.centeredHeader}>
          <Text style={styles.sectionEmoji}>⏰</Text>
          <Text style={styles.sectionTitle}>Meer tijd nodig</Text>
          <Text style={styles.bodyText}>Kies een nieuwe deadline:</Text>
        </View>

        <View style={styles.extendOptions}>
          {[
            { label: '1 week', action: () => handleExtend(1) },
            { label: '2 weken', action: () => handleExtend(2) },
            { label: '1 maand', action: () => handleExtend(undefined, 1) },
          ].map(({ label, action }) => (
            <TouchableOpacity
              key={label}
              style={[styles.extendChip, isExtending && styles.extendChipDisabled]}
              onPress={action}
              disabled={isExtending}
              activeOpacity={0.7}
            >
              {isExtending ? (
                <ActivityIndicator size="small" color={Colors.primary} />
              ) : (
                <Text style={styles.extendChipText}>{label}</Text>
              )}
            </TouchableOpacity>
          ))}
        </View>

        {extendError && <Text style={styles.errorText}>{extendError}</Text>}
      </>
    );
  }

  function renderExtendDone() {
    return (
      <View style={styles.centeredSection}>
        <Text style={styles.sectionEmoji}>📅</Text>
        <Text style={styles.sectionTitle}>Deadline verlengd!</Text>
        <Text style={styles.bodyText}>
          Ga ervoor. Je hebt de tijd die je nodig hebt.
        </Text>
        <Button title="Sluiten" onPress={handleClose} style={styles.confirmButton} />
      </View>
    );
  }

  function renderAbandon() {
    return (
      <>
        <TouchableOpacity style={styles.backButton} onPress={() => setView('menu')}>
          <Ionicons name="arrow-back" size={18} color={Colors.textSecondary} />
          <Text style={styles.backText}>Terug</Text>
        </TouchableOpacity>

        <View style={styles.centeredHeader}>
          <Text style={styles.sectionEmoji}>😔</Text>
          <Text style={styles.sectionTitle}>Doel loslaten</Text>
          <Text style={styles.bodyText}>
            Weet je zeker dat je dit doel wilt loslaten?
          </Text>
          <Text style={styles.goalTitleSm}>{goal.title}</Text>
        </View>

        {updateGoalStatus.isError && (
          <Text style={styles.errorText}>Er is iets misgegaan. Probeer opnieuw.</Text>
        )}

        <Button
          title="Ja, doel loslaten"
          onPress={handleAbandon}
          loading={updateGoalStatus.isPending}
          variant="outline"
          style={[styles.confirmButton, styles.abandonButton]}
        />
      </>
    );
  }

  function renderAbandonDone() {
    return (
      <View style={styles.centeredSection}>
        <Text style={styles.sectionEmoji}>💪</Text>
        <Text style={styles.sectionTitle}>Het is oké.</Text>
        <Text style={styles.bodyText}>
          Het is oké om een doel los te laten.
        </Text>
        <Text style={[styles.bodyText, styles.bodyTextSecondary]}>
          Soms veranderen prioriteiten. Het belangrijkste is dat je blijft groeien.
        </Text>
        <Button
          title="Begin met een nieuw doel!"
          onPress={navigateToNewGoal}
          style={styles.confirmButton}
        />
        <TouchableOpacity style={styles.laterLink} onPress={handleClose}>
          <Text style={styles.laterText}>Sluiten</Text>
        </TouchableOpacity>
      </View>
    );
  }

  function renderContent() {
    switch (view) {
      case 'menu':
        return renderMenu();
      case 'achieved':
        return renderAchieved();
      case 'achieved_new_goal':
        return renderAchievedNewGoal();
      case 'extend':
        return renderExtend();
      case 'extend_done':
        return renderExtendDone();
      case 'abandon':
        return renderAbandon();
      case 'abandon_done':
        return renderAbandonDone();
    }
  }

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <View style={styles.card}>
          {/* Close button — only show on menu view */}
          {view === 'menu' && (
            <TouchableOpacity style={styles.closeButton} onPress={handleClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="close" size={20} color={Colors.textSecondary} />
            </TouchableOpacity>
          )}

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
          >
            {renderContent()}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.md,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    maxWidth: 360,
    width: '90%',
    maxHeight: '85%',
    ...Platform.select({
      ios: {
        shadowColor: Colors.black,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15,
        shadowRadius: 24,
      },
      android: {
        elevation: 12,
      },
    }),
  },
  scrollContent: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  closeButton: {
    position: 'absolute',
    top: Spacing.md,
    right: Spacing.md,
    zIndex: 10,
    backgroundColor: Colors.surfaceSecondary,
    borderRadius: BorderRadius.full,
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ── Menu view ──────────────────────────────────────────────────────────────
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  headerIconWrap: {
    backgroundColor: Colors.error + '15',
    borderRadius: BorderRadius.full,
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.text,
  },
  goalTitle: {
    fontSize: FontSize.md,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  deadlineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: Spacing.lg,
  },
  deadlineText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  optionsList: {
    gap: Spacing.sm,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  optionAchieved: {
    backgroundColor: Colors.success + '10',
  },
  optionExtend: {
    backgroundColor: Colors.accent + '10',
  },
  optionAbandon: {
    backgroundColor: Colors.error + '10',
  },
  optionIcon: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionText: {
    flex: 1,
  },
  optionTitle: {
    fontSize: FontSize.sm,
    fontWeight: '700',
    marginBottom: 2,
  },
  optionDesc: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
  },

  // ── Shared sub-view ────────────────────────────────────────────────────────
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: Spacing.lg,
    alignSelf: 'flex-start',
  },
  backText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  centeredHeader: {
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  centeredSection: {
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  sectionEmoji: {
    fontSize: 40,
    marginBottom: Spacing.sm,
  },
  sectionTitle: {
    fontSize: FontSize.xl,
    fontWeight: '700',
    color: Colors.text,
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },
  goalTitleSm: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: Spacing.xs,
  },
  bodyText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginTop: Spacing.xs,
  },
  bodyTextSecondary: {
    marginTop: Spacing.sm,
  },

  // ── Achieved sub-view ──────────────────────────────────────────────────────
  improvementSection: {
    backgroundColor: Colors.surfaceSecondary,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
  },
  improvementQuestion: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  skillRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.md,
  },
  skillName: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.primary,
    flex: 1,
  },
  currentScorePill: {
    backgroundColor: Colors.primary + '15',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
  },
  currentScoreText: {
    fontSize: FontSize.xs,
    fontWeight: '600',
    color: Colors.primary,
  },
  chipRow: {
    flexDirection: 'row',
    gap: Spacing.xs,
    flexWrap: 'wrap',
  },
  chip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.border,
    minWidth: 52,
    alignItems: 'center',
  },
  chipSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  chipText: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  chipTextSelected: {
    color: Colors.white,
  },
  newScoreHint: {
    marginTop: Spacing.sm,
    fontSize: FontSize.xs,
    color: Colors.success,
    fontWeight: '600',
  },

  // ── Extend sub-view ────────────────────────────────────────────────────────
  extendOptions: {
    gap: Spacing.sm,
  },
  extendChip: {
    backgroundColor: Colors.accent + '10',
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: Colors.accent + '30',
  },
  extendChipDisabled: {
    opacity: 0.5,
  },
  extendChipText: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: Colors.accent,
  },

  // ── Abandon sub-view ───────────────────────────────────────────────────────
  abandonButton: {
    borderColor: Colors.error,
  },

  // ── Shared ────────────────────────────────────────────────────────────────
  confirmButton: {
    marginTop: Spacing.lg,
    width: '100%',
  },
  laterLink: {
    marginTop: Spacing.md,
    padding: Spacing.sm,
  },
  laterText: {
    fontSize: FontSize.sm,
    color: Colors.textTertiary,
    textAlign: 'center',
  },
  errorText: {
    fontSize: FontSize.xs,
    color: Colors.error,
    textAlign: 'center',
    marginTop: Spacing.sm,
  },
});
