import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import { Input } from '../../../src/components/ui/Input';
import { Button } from '../../../src/components/ui/Button';
import { Card } from '../../../src/components/ui/Card';
import { useGoals } from '../../../src/hooks/useGoals';
import { useCreateReflection } from '../../../src/hooks/useReflections';
import { useSkillDefinitions } from '../../../src/hooks/useSkills';
import { Colors, Spacing, FontSize, BorderRadius } from '../../../src/constants/theme';
import { SessionType } from '../../../src/types/database';
import { Celebration } from '../../../src/components/Celebration';

export default function ReflectScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { data: activeGoals } = useGoals(undefined, 'active');
  const { data: skillDefs } = useSkillDefinitions();
  const createReflection = useCreateReflection();

  const [sessionType, setSessionType] = useState<SessionType>('training');
  const [notes, setNotes] = useState('');
  const [goalRatings, setGoalRatings] = useState<Record<string, number>>({});
  const [showCelebration, setShowCelebration] = useState(false);

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
      const hasHighRating = ratings.some((r) => r.rating >= 8);
      if (hasHighRating) {
        setShowCelebration(true);
      } else {
        router.back();
      }
    } catch (error: any) {
      Alert.alert(t('common.error'), error.message);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>{t('development.howDidItGo')}</Text>
      <Text style={styles.subtitle}>
        {t('development.reflectSubtitle')}
      </Text>

      {/* Session type selector */}
      <Text style={styles.label}>{t('development.sessionType')}</Text>
      <View style={styles.typeRow}>
        <TouchableOpacity
          style={[
            styles.typeButton,
            sessionType === 'training' && styles.typeButtonActive,
          ]}
          onPress={() => setSessionType('training')}
        >
          <Ionicons
            name="barbell-outline"
            size={20}
            color={sessionType === 'training' ? Colors.white : Colors.textSecondary}
          />
          <Text
            style={[
              styles.typeText,
              sessionType === 'training' && styles.typeTextActive,
            ]}
          >
            {t('common.training')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.typeButton,
            sessionType === 'match' && styles.typeButtonActive,
          ]}
          onPress={() => setSessionType('match')}
        >
          <Ionicons
            name="trophy-outline"
            size={20}
            color={sessionType === 'match' ? Colors.white : Colors.textSecondary}
          />
          <Text
            style={[
              styles.typeText,
              sessionType === 'match' && styles.typeTextActive,
            ]}
          >
            {t('common.match')}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Rate each active goal */}
      {activeGoals && activeGoals.length > 0 && (
        <>
          <Text style={styles.label}>{t('development.rateProgress')}</Text>
          {activeGoals.map((goal) => {
            const skillLabel = getSkillLabel(goal);
            const rating = goalRatings[goal.id] ?? 5;
            return (
              <Card key={goal.id} style={styles.goalRatingCard} padding={Spacing.md}>
                <View style={styles.goalHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.goalTitle} numberOfLines={1}>
                      {goal.title}
                    </Text>
                    {skillLabel && <Text style={styles.goalAttr}>{skillLabel}</Text>}
                  </View>
                  <View style={styles.ratingBadge}>
                    <Text style={styles.ratingText}>{rating}</Text>
                  </View>
                </View>
                <Slider
                  style={styles.slider}
                  minimumValue={1}
                  maximumValue={10}
                  step={1}
                  value={rating}
                  onValueChange={(v) =>
                    setGoalRatings((prev) => ({ ...prev, [goal.id]: Math.round(v) }))
                  }
                  minimumTrackTintColor={Colors.primary}
                  maximumTrackTintColor={Colors.border}
                  thumbTintColor={Colors.primary}
                />
                <View style={styles.sliderLabels}>
                  <Text style={styles.sliderLabel}>{t('development.noProgress')}</Text>
                  <Text style={styles.sliderLabel}>{t('development.greatProgress')}</Text>
                </View>
              </Card>
            );
          })}
        </>
      )}

      {/* Notes */}
      <Input
        label={t('development.reflectionNotes')}
        placeholder={t('development.reflectionPlaceholder')}
        value={notes}
        onChangeText={setNotes}
        multiline
        numberOfLines={4}
        style={{ minHeight: 100, textAlignVertical: 'top' }}
      />

      <Button
        title={t('development.saveReflection')}
        onPress={handleSubmit}
        loading={createReflection.isPending}
        size="lg"
        style={styles.submitButton}
      />
      <Celebration
        visible={showCelebration}
        message={t('development.celebrationHighScore')}
        onDismiss={() => {
          setShowCelebration(false);
          router.back();
        }}
      />
    </ScrollView>
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
  label: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  typeRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  typeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.surfaceSecondary,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  typeButtonActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  typeText: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  typeTextActive: {
    color: Colors.white,
  },
  goalRatingCard: {
    marginBottom: Spacing.md,
  },
  goalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  goalTitle: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: Colors.text,
  },
  goalAttr: {
    fontSize: FontSize.xs,
    color: Colors.textTertiary,
  },
  ratingBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: Spacing.sm,
  },
  ratingText: {
    color: Colors.white,
    fontSize: FontSize.md,
    fontWeight: '700',
  },
  slider: {
    width: '100%',
    height: 30,
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  sliderLabel: {
    fontSize: 10,
    color: Colors.textTertiary,
  },
  submitButton: {
    marginTop: Spacing.lg,
  },
});
