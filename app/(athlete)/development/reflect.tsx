import React, { useRef, useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { Input } from '../../../src/components/ui/Input';
import { Button } from '../../../src/components/ui/Button';
import { Card } from '../../../src/components/ui/Card';
import { useCreateReflection } from '../../../src/hooks/useReflections';
import { useSkillDefinitions } from '../../../src/hooks/useSkills';
import { useSessionGoals, useScheduledSession } from '../../../src/hooks/useSchedule';
import { XP_VALUES, calculateReflectionQualityBonus } from '../../../src/hooks/useGamification';
import { Colors, Spacing, FontSize, BorderRadius } from '../../../src/constants/theme';
import { SessionType, Goal } from '../../../src/types/database';
import { useCelebration } from '../../../src/components/CelebrationContext';

const GOLD = '#F5A623';
const STAR_SIZE = 32;

// StarRating renders 5 tappable stars. value = 0 means nothing selected yet.
function StarRating({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <View style={starStyles.row} accessibilityRole="adjustable" accessibilityLabel={`Beoordeling: ${value} van 5`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <TouchableOpacity
          key={star}
          onPress={() => onChange(star)}
          hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
          accessibilityRole="button"
          accessibilityLabel={`${star} ster`}
        >
          <Ionicons
            name={star <= value ? 'star' : 'star-outline'}
            size={STAR_SIZE}
            color={star <= value ? GOLD : Colors.border}
          />
        </TouchableOpacity>
      ))}
    </View>
  );
}

const starStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 8,
    marginTop: Spacing.sm,
    marginBottom: Spacing.xs,
  },
});

export default function ReflectScreen() {
  const router = useRouter();
  const { sessionId } = useLocalSearchParams<{ sessionId?: string }>();
  const { t } = useTranslation();
  const { data: skillDefs } = useSkillDefinitions();
  const { data: sessionGoals } = useSessionGoals(sessionId);
  const { data: session } = useScheduledSession(sessionId);
  const createReflection = useCreateReflection();

  const [notes, setNotes] = useState('');
  const [goalRatings, setGoalRatings] = useState<Record<string, number>>({});
  const scrollRef = useRef<ScrollView>(null);
  const { celebrate } = useCelebration();

  // Auto-detect session type from the linked session; fall back to 'training'
  const sessionType: SessionType = (session?.session_type as SessionType) ?? 'training';

  // Only show pre-selected focus goals for this session
  const focusGoals = useMemo(() => {
    if (!sessionGoals || sessionGoals.length === 0) return [];
    return sessionGoals as (typeof sessionGoals[number] & { goal: Goal })[];
  }, [sessionGoals]);

  const getSkillLabel = (goal: any) => {
    if (goal.skill_id && skillDefs) {
      const skill = skillDefs.find((s: any) => s.id === goal.skill_id);
      if (skill) return skill.label;
    }
    if (goal.attribute) {
      return goal.attribute.replace('_', ' ').replace(/\b\w/g, (c: string) => c.toUpperCase());
    }
    return null;
  };

  const handleSubmit = async () => {
    const ratings = Object.entries(goalRatings)
      .filter(([_, rating]) => rating > 0)
      .map(([goal_id, rating]) => ({ goal_id, rating }));

    try {
      await createReflection.mutateAsync({
        session_type: sessionType,
        notes: notes.trim() || null,
        goal_ratings: ratings,
      });

      // Calculate XP earned
      const baseXp = XP_VALUES.reflection;
      const qualityBonus = calculateReflectionQualityBonus(notes.trim() || null, ratings.length);
      const totalXp = baseXp + qualityBonus;
      const reason = qualityBonus > 0
        ? t('gamification.xpReasonQualityBonus', { points: qualityBonus })
        : t('gamification.xpReasonReflection');

      celebrate({
        type: 'xp',
        message: t('gamification.xpEarned', { points: totalXp }),
        subMessage: reason,
        xpAmount: totalXp,
      });

      // Threshold on 5-star scale: >= 4 stars counts as a high score
      const hasHighRating = ratings.some((r) => r.rating >= 4);
      if (hasHighRating) {
        celebrate({
          type: 'xp',
          message: t('development.celebrationHighScore'),
          icon: 'star',
        });
      }

      router.replace('/(athlete)/development/');
    } catch (error: any) {
      Alert.alert(t('common.error'), error.message);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
    >
    <ScrollView
      ref={scrollRef}
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="interactive"
    >
      <Text style={styles.title}>
        {focusGoals.length > 0
          ? t('development.howDidItGoWithFocus', { focus: (focusGoals[0].goal as Goal).title })
          : t('development.howDidItGo')}
      </Text>
      <Text style={styles.subtitle}>
        {focusGoals.length > 0
          ? t('development.reflectSubtitleWithFocus')
          : t('development.reflectSubtitle')}
      </Text>

      {/* Focus point recap card */}
      {focusGoals.length > 0 && (
        <View style={styles.focusRecapCard}>
          <View style={styles.focusRecapHeader}>
            <Ionicons name="flag" size={18} color={Colors.primary} />
            <Text style={styles.focusRecapLabel}>{t('development.yourFocusPoints')}</Text>
          </View>
          {session?.training_goal_text && (
            <Text style={styles.trainingGoalText}>{session.training_goal_text}</Text>
          )}
          {focusGoals.map((sg) => {
            const goal = sg.goal as Goal;
            if (!goal) return null;
            const skillLabel = getSkillLabel(goal);
            return (
              <View key={goal.id} style={styles.focusRecapGoal}>
                <Ionicons name="checkmark-circle" size={16} color={Colors.primary} style={{ marginTop: 2 }} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.focusRecapGoalTitle}>{goal.title}</Text>
                  {skillLabel && <Text style={styles.goalAttr}>{skillLabel}</Text>}
                </View>
              </View>
            );
          })}
        </View>
      )}

      {/* Rate each focus goal */}
      {focusGoals.length > 0 && focusGoals.map((sg) => {
        const goal = sg.goal as Goal;
        if (!goal) return null;
        const skillLabel = getSkillLabel(goal);
        const rating = goalRatings[goal.id] ?? 0;
        return (
          <Card
            key={goal.id}
            style={styles.goalRatingCard}
            padding={Spacing.md}
          >
            <View style={styles.goalTitleRow}>
              <Ionicons
                name="star"
                size={14}
                color={Colors.primary}
                style={{ marginRight: 4, marginTop: 2 }}
              />
              <View style={{ flex: 1 }}>
                <Text style={styles.goalTitle} numberOfLines={2}>
                  {goal.title}
                </Text>
                {skillLabel && <Text style={styles.goalAttr}>{skillLabel}</Text>}
              </View>
            </View>
            <StarRating
              value={rating}
              onChange={(v) =>
                setGoalRatings((prev) => ({ ...prev, [goal.id]: v }))
              }
            />
          </Card>
        );
      })}

      {/* Notes */}
      <Input
        label={t('development.reflectionNotes')}
        placeholder={t('development.reflectionPlaceholder')}
        value={notes}
        onChangeText={setNotes}
        multiline
        numberOfLines={4}
        style={{ minHeight: 100, textAlignVertical: 'top' }}
        onFocus={() => setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 300)}
      />

      <Button
        title={t('development.saveReflection')}
        onPress={handleSubmit}
        loading={createReflection.isPending}
        size="lg"
        style={styles.submitButton}
      />
    </ScrollView>
    </KeyboardAvoidingView>
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
  title: {
    fontSize: FontSize.xxl,
    fontWeight: '800',
    color: Colors.text,
  },
  subtitle: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    marginTop: 4,
    marginBottom: Spacing.lg,
  },
  focusRecapCard: {
    backgroundColor: Colors.primary + '15',
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
  },
  focusRecapHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  focusRecapLabel: {
    fontSize: FontSize.sm,
    fontWeight: '700',
    color: Colors.primary,
  },
  focusRecapGoal: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.xs,
    marginTop: Spacing.xs,
  },
  focusRecapGoalTitle: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: Colors.text,
  },
  trainingGoalText: {
    fontSize: FontSize.md,
    color: Colors.text,
    lineHeight: 22,
    marginBottom: Spacing.xs,
  },
  goalRatingCard: {
    marginBottom: Spacing.md,
    borderWidth: 1.5,
    borderColor: Colors.primary + '40',
  },
  goalTitleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  goalTitle: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: Colors.text,
  },
  goalAttr: {
    fontSize: FontSize.xs,
    color: Colors.textTertiary,
    marginTop: 2,
  },
  submitButton: {
    marginTop: Spacing.lg,
  },
});
