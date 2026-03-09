import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Button } from '../../../src/components/ui/Button';
import { GoalAnalysisCard } from '../../../src/components/GoalAnalysisCard';
import { XpToast } from '../../../src/components/XpToast';
import { useCreateGoal, useGetGoalFeedback } from '../../../src/hooks/useGoals';
import { useSelectedSkills } from '../../../src/hooks/useSkills';
import { useCheckAchievements, useGoalStats, XP_VALUES, calculateGoalQualityBonus, Achievement } from '../../../src/hooks/useGamification';
import { Colors, Spacing, FontSize, BorderRadius } from '../../../src/constants/theme';
import { GoalAiAnalysis, SkillDefinition } from '../../../src/types/database';
import { format, addWeeks } from 'date-fns';
import { nl } from 'date-fns/locale';

export default function NewGoalScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const createGoal = useCreateGoal();
  const getFeedback = useGetGoalFeedback();
  const { data: selectedSkills } = useSelectedSkills();

  const { checkAndAward } = useCheckAchievements();
  const { data: goalStats } = useGoalStats();

  const [goalText, setGoalText] = useState('');
  const [analysis, setAnalysis] = useState<GoalAiAnalysis | null>(null);
  const [hasAnalyzed, setHasAnalyzed] = useState(false);
  const [selectedSkill, setSelectedSkill] = useState<SkillDefinition | null>(null);
  const [deadline, setDeadline] = useState<Date>(addWeeks(new Date(), 4));
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [xpToast, setXpToast] = useState<{ visible: boolean; xp: number; achievement?: Achievement | null }>({
    visible: false, xp: 0, achievement: null,
  });

  const skillLabels = (selectedSkills ?? []).map((s) => s.label);

  const handleAnalyze = async () => {
    if (!goalText.trim()) {
      Alert.alert(t('common.error'), t('goals.describeGoal'));
      return;
    }

    try {
      const result = await getFeedback.mutateAsync({
        description: goalText.trim(),
        athlete_skills: skillLabels,
      });
      setAnalysis(result);
      setHasAnalyzed(true);
    } catch (error: any) {
      Alert.alert(t('common.error'), t('goals.couldNotAnalyze'));
    }
  };

  const handleSave = async () => {
    if (!goalText.trim()) {
      Alert.alert(t('common.error'), t('goals.describeGoal'));
      return;
    }

    try {
      const result = await createGoal.mutateAsync({
        description: goalText.trim(),
        athlete_skills: skillLabels,
        skill_id: selectedSkill?.id,
        skill_label: selectedSkill?.label,
        deadline: deadline.toISOString(),
      });

      // Calculate total XP earned
      const baseXp = XP_VALUES.goal_created;
      const qualityBonus = calculateGoalQualityBonus(result.ai_analysis ?? null);
      const totalXp = baseXp + qualityBonus;

      // Check achievements with updated stats
      const stats = goalStats
        ? { ...goalStats, goalsCreated: goalStats.goalsCreated + 1 }
        : { goalsCreated: 1, goalsAchieved: 0, reflections: 0, growthPoints: 0, bestGoalQuality: 0, reflectionsWithNotes: 0, currentStreak: 0 };

      const newAchievements = await checkAndAward(stats);
      const firstAchievement = newAchievements.length > 0 ? newAchievements[0] : null;

      // Show XP toast, then navigate back after it dismisses
      setXpToast({
        visible: true,
        xp: totalXp + (firstAchievement?.xp_reward ?? 0),
        achievement: firstAchievement,
      });
    } catch (error: any) {
      Alert.alert(t('common.error'), error.message);
    }
  };

  const handleRefine = () => {
    setHasAnalyzed(false);
    setAnalysis(null);
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Ionicons name="flag" size={32} color={Colors.primary} />
          <Text style={styles.title}>{t('goals.whatIsYourGoal')}</Text>
          <Text style={styles.subtitle}>
            {t('goals.goalSubtitle')}
          </Text>
        </View>

        <View style={styles.skillSection}>
          <Text style={styles.skillSectionTitle}>{t('goals.chooseSkill')}</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.skillChips}
          >
            {(selectedSkills ?? []).map((skill) => {
              const isSelected = selectedSkill?.id === skill.id;
              return (
                <TouchableOpacity
                  key={skill.id}
                  style={[styles.skillChip, isSelected && styles.skillChipSelected]}
                  onPress={() => setSelectedSkill(isSelected ? null : skill)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.skillChipText, isSelected && styles.skillChipTextSelected]}>
                    {skill.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        <View style={styles.deadlineSection}>
          <Text style={styles.skillSectionTitle}>{t('goals.deadline')}</Text>
          <TouchableOpacity
            style={styles.deadlinePicker}
            onPress={() => setShowDatePicker(true)}
            activeOpacity={0.7}
          >
            <Ionicons name="calendar-outline" size={18} color={Colors.primary} />
            <Text style={styles.deadlineText}>
              {format(deadline, 'd MMMM yyyy', { locale: nl })}
            </Text>
            <Ionicons name="chevron-down" size={16} color={Colors.textTertiary} />
          </TouchableOpacity>
          {showDatePicker && (
            <DateTimePicker
              value={deadline}
              mode="date"
              minimumDate={new Date()}
              onChange={(_, date) => {
                setShowDatePicker(Platform.OS === 'ios');
                if (date) setDeadline(date);
              }}
            />
          )}
        </View>

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.goalInput}
            placeholder={t('goals.goalPlaceholder')}
            placeholderTextColor={Colors.textTertiary}
            value={goalText}
            onChangeText={(text) => {
              setGoalText(text);
              if (hasAnalyzed) {
                setHasAnalyzed(false);
                setAnalysis(null);
              }
            }}
            multiline
            textAlignVertical="top"
          />
        </View>

        <View style={styles.tips}>
          <Text style={styles.tipsTitle}>{t('goals.tipsTitle')}</Text>
          <View style={styles.tipRow}>
            <Ionicons name="locate-outline" size={14} color={Colors.primary} />
            <Text style={styles.tipText}>
              <Text style={styles.tipBold}>{t('goals.tipSpecific')}</Text> — {t('goals.tipSpecificDesc')}
            </Text>
          </View>
          <View style={styles.tipRow}>
            <Ionicons name="analytics-outline" size={14} color={Colors.primary} />
            <Text style={styles.tipText}>
              <Text style={styles.tipBold}>{t('goals.tipMeasurable')}</Text> — {t('goals.tipMeasurableDesc')}
            </Text>
          </View>
          <View style={styles.tipRow}>
            <Ionicons name="trending-up-outline" size={14} color={Colors.primary} />
            <Text style={styles.tipText}>
              <Text style={styles.tipBold}>{t('goals.tipChallenging')}</Text> — {t('goals.tipChallengingDesc')}
            </Text>
          </View>
        </View>

        {analysis && hasAnalyzed && (
          <GoalAnalysisCard analysis={analysis} />
        )}

        <View style={styles.actions}>
          {!hasAnalyzed ? (
            <Button
              title={getFeedback.isPending ? t('goals.analyzing') : t('goals.getAiFeedback')}
              onPress={handleAnalyze}
              loading={getFeedback.isPending}
              size="lg"
              icon={<Ionicons name="sparkles" size={18} color={Colors.white} />}
              disabled={!goalText.trim() || !selectedSkill}
            />
          ) : (
            <>
              <Button
                title={createGoal.isPending ? t('goals.saving') : t('goals.saveGoal')}
                onPress={handleSave}
                loading={createGoal.isPending}
                size="lg"
                disabled={!goalText.trim() || !selectedSkill}
              />
              <Button
                title={t('goals.refineGoal')}
                onPress={handleRefine}
                variant="outline"
                size="lg"
                icon={<Ionicons name="pencil-outline" size={18} color={Colors.primary} />}
              />
            </>
          )}
        </View>

        {getFeedback.isPending && (
          <Text style={styles.aiHint}>
            {t('goals.aiAnalyzing')}
          </Text>
        )}
      </ScrollView>
      <XpToast
        visible={xpToast.visible}
        xpAmount={xpToast.xp}
        achievement={xpToast.achievement}
        onDismiss={() => {
          setXpToast({ visible: false, xp: 0, achievement: null });
          router.back();
        }}
      />
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
  header: {
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  title: {
    fontSize: FontSize.xl,
    fontWeight: '800',
    color: Colors.text,
    textAlign: 'center',
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
  },
  subtitle: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  skillSection: {
    marginBottom: Spacing.lg,
  },
  skillSectionTitle: {
    fontSize: FontSize.sm,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  skillChips: {
    flexDirection: 'row',
    gap: Spacing.sm,
    paddingBottom: 4,
  },
  skillChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full ?? 999,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  skillChipSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary + '15',
  },
  skillChipText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  skillChipTextSelected: {
    color: Colors.primary,
    fontWeight: '700',
  },
  deadlineSection: {
    marginBottom: Spacing.lg,
  },
  deadlinePicker: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
  },
  deadlineText: {
    flex: 1,
    fontSize: FontSize.md,
    color: Colors.text,
    fontWeight: '500',
  },
  inputContainer: {
    marginBottom: Spacing.lg,
  },
  goalInput: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    fontSize: FontSize.md,
    color: Colors.text,
    minHeight: 120,
    lineHeight: 24,
  },
  tips: {
    backgroundColor: Colors.primary + '08',
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
    gap: Spacing.sm,
  },
  tipsTitle: {
    fontSize: FontSize.sm,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 4,
  },
  tipRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
  },
  tipText: {
    flex: 1,
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  tipBold: {
    fontWeight: '700',
    color: Colors.text,
  },
  actions: {
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  aiHint: {
    fontSize: FontSize.sm,
    color: Colors.accent,
    textAlign: 'center',
    marginTop: Spacing.md,
    fontStyle: 'italic',
  },
});
