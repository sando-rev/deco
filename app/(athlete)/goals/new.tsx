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
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '../../../src/components/ui/Button';
import { GoalAnalysisCard } from '../../../src/components/GoalAnalysisCard';
import { useCreateGoal, useGetGoalFeedback } from '../../../src/hooks/useGoals';
import { useSelectedSkills } from '../../../src/hooks/useSkills';
import { Colors, Spacing, FontSize, BorderRadius } from '../../../src/constants/theme';
import { GoalAiAnalysis } from '../../../src/types/database';

export default function NewGoalScreen() {
  const router = useRouter();
  const createGoal = useCreateGoal();
  const getFeedback = useGetGoalFeedback();
  const { data: selectedSkills } = useSelectedSkills();

  const [goalText, setGoalText] = useState('');
  const [analysis, setAnalysis] = useState<GoalAiAnalysis | null>(null);
  const [hasAnalyzed, setHasAnalyzed] = useState(false);

  const skillLabels = (selectedSkills ?? []).map((s) => s.label);

  const handleAnalyze = async () => {
    if (!goalText.trim()) {
      Alert.alert('Error', 'Please describe your development goal');
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
      Alert.alert('Error', 'Could not analyze your goal. Please try again.');
    }
  };

  const handleSave = async () => {
    if (!goalText.trim()) {
      Alert.alert('Error', 'Please describe your development goal');
      return;
    }

    try {
      await createGoal.mutateAsync({
        description: goalText.trim(),
        athlete_skills: skillLabels,
      });
      router.back();
    } catch (error: any) {
      Alert.alert('Error', error.message);
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
          <Text style={styles.title}>What is your development goal?</Text>
          <Text style={styles.subtitle}>
            Describe your goal as specifically as possible. Include what you want to improve,
            how you'll measure it, and make it challenging but achievable.
          </Text>
        </View>

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.goalInput}
            placeholder="e.g., Improve my jab tackle timing so I win 3 out of 5 defensive duels in every match"
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
          <Text style={styles.tipsTitle}>Tips for a great goal:</Text>
          <View style={styles.tipRow}>
            <Ionicons name="target-outline" size={14} color={Colors.primary} />
            <Text style={styles.tipText}>
              <Text style={styles.tipBold}>Specific</Text> — not "defend better" but "improve
              jab tackle timing at the top of the circle"
            </Text>
          </View>
          <View style={styles.tipRow}>
            <Ionicons name="analytics-outline" size={14} color={Colors.primary} />
            <Text style={styles.tipText}>
              <Text style={styles.tipBold}>Measurable</Text> — use numbers like "3 successful
              tackles per half" or "10 total in a match"
            </Text>
          </View>
          <View style={styles.tipRow}>
            <Ionicons name="trending-up-outline" size={14} color={Colors.primary} />
            <Text style={styles.tipText}>
              <Text style={styles.tipBold}>Challenging</Text> — push yourself beyond comfort,
              but keep it realistic
            </Text>
          </View>
        </View>

        {analysis && hasAnalyzed && (
          <GoalAnalysisCard analysis={analysis} />
        )}

        <View style={styles.actions}>
          {!hasAnalyzed ? (
            <Button
              title={getFeedback.isPending ? 'Analyzing...' : 'Get AI Feedback'}
              onPress={handleAnalyze}
              loading={getFeedback.isPending}
              size="lg"
              icon={<Ionicons name="sparkles" size={18} color={Colors.white} />}
              disabled={!goalText.trim()}
            />
          ) : (
            <>
              <Button
                title={createGoal.isPending ? 'Saving...' : 'Save Goal'}
                onPress={handleSave}
                loading={createGoal.isPending}
                size="lg"
              />
              <Button
                title="Refine Goal"
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
            Deco AI is analyzing your goal...
          </Text>
        )}
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
