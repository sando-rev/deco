import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '../../../src/components/ui/Card';
import { Button } from '../../../src/components/ui/Button';
import { useGoals } from '../../../src/hooks/useGoals';
import { useSkillDefinitions } from '../../../src/hooks/useSkills';
import {
  useUpcomingSessions,
  useSessionGoals,
  useSaveSessionGoals,
  useSaveTrainingGoalText,
} from '../../../src/hooks/useSchedule';
import { useCelebration } from '../../../src/components/CelebrationContext';
import { Colors, Spacing, FontSize, BorderRadius } from '../../../src/constants/theme';

function formatDate(dateStr: string): string {
  // yyyy-mm-dd → dd-mm-yyyy
  const parts = dateStr.split('-');
  if (parts.length === 3) return `${parts[2]}-${parts[1]}-${parts[0]}`;
  return dateStr;
}

function formatTime(timeStr: string): string {
  // HH:mm:ss → HH:mm (strip seconds if present)
  if (!timeStr) return timeStr;
  return timeStr.slice(0, 5);
}

export default function SessionGoalsScreen() {
  const router = useRouter();
  const { sessionId } = useLocalSearchParams<{ sessionId: string }>();
  const { data: activeGoals, isLoading: goalsLoading } = useGoals(undefined, 'active');
  const { data: skillDefs } = useSkillDefinitions();
  const { data: sessions } = useUpcomingSessions(30);
  const saveSessionGoals = useSaveSessionGoals();
  const saveTrainingGoalText = useSaveTrainingGoalText();
  const { celebrate } = useCelebration();

  const [selectedGoalIds, setSelectedGoalIds] = useState<string[]>([]);
  const [trainingGoalText, setTrainingGoalText] = useState('');
  const [initialized, setInitialized] = useState(false);
  const scrollRef = useRef<ScrollView>(null);
  const isMatch = session?.session_type === 'match';

  // Find session by ID, or pick the next upcoming session if no ID provided
  const session = sessionId
    ? sessions?.find((s) => s.id === sessionId)
    : sessions?.[0];

  // Pre-select if only one active goal
  useEffect(() => {
    if (!initialized && activeGoals) {
      if (activeGoals.length === 1) {
        setSelectedGoalIds([activeGoals[0].id]);
      }
      setInitialized(true);
    }
  }, [activeGoals, initialized]);

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

  const toggleGoal = (goalId: string) => {
    setSelectedGoalIds((prev) =>
      prev.includes(goalId)
        ? prev.filter((id) => id !== goalId)
        : [...prev, goalId]
    );
  };

  const handleConfirm = async () => {
    if (selectedGoalIds.length === 0) {
      Alert.alert('Kies minstens een doel', 'Selecteer ten minste een doel om op te focussen.');
      return;
    }

    const resolvedSessionId = sessionId || session?.id;
    if (!resolvedSessionId) {
      Alert.alert('Geen sessie gevonden', 'Er is geen aankomende sessie gevonden.');
      return;
    }

    try {
      await saveSessionGoals.mutateAsync({
        sessionId: resolvedSessionId,
        goalIds: selectedGoalIds,
      });

      if (trainingGoalText.trim()) {
        await saveTrainingGoalText.mutateAsync({
          sessionId: resolvedSessionId,
          text: trainingGoalText.trim(),
        });
      }

      celebrate({
        message: 'Succes!',
        subMessage: isMatch ? 'Succes met de wedstrijd!' : "Zet 'm op bij de training!",
      });
      router.replace('/(athlete)/development/');
    } catch (error: any) {
      Alert.alert('Fout', error.message);
    }
  };

  const isSubmitting = saveSessionGoals.isPending || saveTrainingGoalText.isPending;

  if (goalsLoading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

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
        {/* Dynamic header based on session type */}
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={() => router.back()} style={styles.modalClose}>
            <Ionicons name="close" size={24} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.modalHeaderTitle}>
            {isMatch ? 'Wedstrijdfocus' : 'Trainingsvoorbereiding'}
          </Text>
        </View>

        <Text style={styles.title}>
          {isMatch ? 'Wat neem je mee?' : 'Kies je focus'}
        </Text>
        <Text style={styles.subtitle}>
          {isMatch
            ? 'Welke doelen neem je mee de wedstrijd in?'
            : 'Welke doelen wil je aanpakken tijdens deze training?'}
        </Text>

        {/* Session info */}
        {session && (
          <Card style={styles.sessionCard} padding={Spacing.md}>
            <View style={styles.sessionRow}>
              <Ionicons
                name={session.session_type === 'match' ? 'trophy-outline' : 'barbell-outline'}
                size={20}
                color={Colors.primary}
              />
              <View style={{ flex: 1, marginLeft: Spacing.sm }}>
                <Text style={styles.sessionLabel}>
                  {session.label ?? (session.session_type === 'match' ? 'Wedstrijd' : 'Training')}
                </Text>
                <Text style={styles.sessionTime}>
                  {formatDate(session.date)} &middot; {formatTime(session.start_time)}–{formatTime(session.end_time)}
                </Text>
              </View>
            </View>
          </Card>
        )}

        {/* Active goals */}
        <Text style={styles.label}>Actieve doelen</Text>
        {activeGoals && activeGoals.length > 0 ? (
          activeGoals.map((goal) => {
            const isSelected = selectedGoalIds.includes(goal.id);
            const skillLabel = getSkillLabel(goal);
            return (
              <TouchableOpacity
                key={goal.id}
                activeOpacity={0.7}
                onPress={() => toggleGoal(goal.id)}
              >
                <Card
                  style={StyleSheet.flatten([styles.goalCard, isSelected ? styles.goalCardSelected : undefined])}
                  padding={Spacing.md}
                >
                  <View style={styles.goalRow}>
                    <View style={styles.goalContent}>
                      {skillLabel && (
                        <View style={styles.skillChip}>
                          <Text style={styles.skillChipText}>{skillLabel}</Text>
                        </View>
                      )}
                      <Text style={styles.goalTitle} numberOfLines={2}>
                        {goal.title}
                      </Text>
                    </View>
                    <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
                      {isSelected && (
                        <Ionicons name="checkmark" size={16} color={Colors.white} />
                      )}
                    </View>
                  </View>
                </Card>
              </TouchableOpacity>
            );
          })
        ) : (
          <Card style={styles.emptyCard} padding={Spacing.lg}>
            <Text style={styles.emptyText}>
              Je hebt nog geen actieve doelen. Maak eerst een doel aan.
            </Text>
          </Card>
        )}

        {/* Training-specific goal text */}
        <Text style={[styles.label, { marginTop: Spacing.lg }]}>
          {isMatch ? 'Wil je een specifiek doel voor de wedstrijd? (optioneel)' : 'Wil je een specifiek doel voor deze training? (optioneel)'}
        </Text>
        <TextInput
          style={styles.textInput}
          placeholder="Bijv. 'Dribbelen met links oefenen' of 'Communicatie op het veld'"
          placeholderTextColor={Colors.textTertiary}
          value={trainingGoalText}
          onChangeText={setTrainingGoalText}
          multiline
          textAlignVertical="top"
          onFocus={() => setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 300)}
        />

        {/* Confirm button */}
        <Button
          title={isSubmitting ? 'Opslaan...' : 'Bevestig'}
          onPress={handleConfirm}
          loading={isSubmitting}
          size="lg"
          style={styles.confirmButton}
          disabled={selectedGoalIds.length === 0}
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
  centered: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
    paddingTop: Platform.OS === 'ios' ? 8 : 0,
  },
  modalClose: {
    padding: Spacing.xs,
    marginRight: Spacing.sm,
  },
  modalHeaderTitle: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.text,
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
  sessionCard: {
    marginBottom: Spacing.lg,
  },
  sessionRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sessionLabel: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: Colors.text,
  },
  sessionTime: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  label: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  goalCard: {
    marginBottom: Spacing.sm,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  goalCardSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary + '08',
  },
  goalRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  goalContent: {
    flex: 1,
  },
  goalTitle: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: Colors.text,
  },
  skillChip: {
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.primary + '15',
    marginBottom: Spacing.xs,
  },
  skillChipText: {
    fontSize: FontSize.xs,
    color: Colors.primary,
    fontWeight: '600',
  },
  checkbox: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: Spacing.md,
  },
  checkboxSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary,
  },
  emptyCard: {
    alignItems: 'center',
  },
  emptyText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  textInput: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    fontSize: FontSize.md,
    color: Colors.text,
    minHeight: 80,
    lineHeight: 22,
  },
  confirmButton: {
    marginTop: Spacing.lg,
  },
});
