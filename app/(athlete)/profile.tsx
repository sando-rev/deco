import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import Slider from '@react-native-community/slider';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../src/hooks/useAuth';
import { useSelectedSkills, useLatestSkillScores, useSaveSkillScores } from '../../src/hooks/useSkills';
import { RadarChart, RadarSkill } from '../../src/components/RadarChart';
import { Card } from '../../src/components/ui/Card';
import { Button } from '../../src/components/ui/Button';
import { SKILL_CATEGORIES } from '../../src/constants/skills';
import { Colors, Spacing, FontSize, BorderRadius } from '../../src/constants/theme';
import { SkillDefinition } from '../../src/types/database';

export default function ProfileScreen() {
  const { profile } = useAuth();
  const { data: selectedSkills, isLoading: loadingSkills } = useSelectedSkills();
  const { data: skillScores, isLoading: loadingScores } = useLatestSkillScores();
  const [isEditing, setIsEditing] = useState(false);
  const [editScores, setEditScores] = useState<Record<string, number> | null>(null);
  const saveScores = useSaveSkillScores();

  const isLoading = loadingSkills || loadingScores;

  // Build score map from latest scores
  const scoreMap = new Map(
    (skillScores ?? []).map((s) => [s.skill_id, s.score])
  );

  // Build radar chart data
  const buildRadarSkills = (scores: Map<string, number> | Record<string, number>): RadarSkill[] => {
    return (selectedSkills ?? []).map((skill) => ({
      label: skill.label,
      score: scores instanceof Map ? (scores.get(skill.id) ?? 5) : (scores[skill.id] ?? 5),
    }));
  };

  const radarSkills = isEditing && editScores
    ? buildRadarSkills(editScores)
    : buildRadarSkills(scoreMap);

  const comparisonSkills = isEditing ? buildRadarSkills(scoreMap) : undefined;

  // Group selected skills by category
  const groupedSkills = SKILL_CATEGORIES.map((cat) => ({
    category: cat,
    skills: (selectedSkills ?? []).filter((s) => s.category === cat.key),
  })).filter((g) => g.skills.length > 0);

  const startEditing = () => {
    const scores: Record<string, number> = {};
    (selectedSkills ?? []).forEach((skill) => {
      scores[skill.id] = scoreMap.get(skill.id) ?? 5;
    });
    setEditScores(scores);
    setIsEditing(true);
  };

  const handleSave = async () => {
    if (!editScores) return;
    try {
      const scoreEntries = Object.entries(editScores).map(([skill_id, score]) => ({
        skill_id,
        score,
      }));
      await saveScores.mutateAsync(scoreEntries);
      setIsEditing(false);
      setEditScores(null);
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.greeting}>
        <Text style={styles.greetingText}>
          Welcome back, {profile?.full_name?.split(' ')[0]}
        </Text>
        <Text style={styles.greetingSubtext}>Your performance profile</Text>
      </View>

      <Card style={styles.chartCard}>
        {radarSkills.length >= 3 ? (
          <RadarChart
            skills={radarSkills}
            size={300}
            comparisonSkills={comparisonSkills}
          />
        ) : (
          <Text style={styles.noSkillsText}>Complete onboarding to see your chart</Text>
        )}
      </Card>

      {!isEditing ? (
        <>
          {groupedSkills.map(({ category, skills }) => (
            <View key={category.key} style={styles.categorySection}>
              <View style={styles.categoryHeader}>
                <Ionicons name={category.icon as any} size={16} color={Colors.primary} />
                <Text style={styles.categoryLabel}>{category.label}</Text>
              </View>
              <View style={styles.scoresGrid}>
                {skills.map((skill) => {
                  const value = scoreMap.get(skill.id) ?? 0;
                  return (
                    <Card key={skill.id} style={styles.scoreCard} padding={Spacing.sm}>
                      <Ionicons name={skill.icon as any} size={20} color={Colors.primary} />
                      <Text style={styles.scoreValue}>{value}</Text>
                      <Text style={styles.scoreLabel}>{skill.label}</Text>
                    </Card>
                  );
                })}
              </View>
            </View>
          ))}
          <Button
            title="Re-assess Skills"
            onPress={startEditing}
            variant="outline"
            style={styles.editButton}
            icon={<Ionicons name="refresh-outline" size={18} color={Colors.primary} />}
          />
        </>
      ) : (
        <View style={styles.editContainer}>
          <Text style={styles.editHint}>
            Adjust your scores. The dashed outline shows your previous assessment.
          </Text>
          {groupedSkills.map(({ category, skills }) => (
            <View key={category.key}>
              <View style={styles.categoryHeader}>
                <Ionicons name={category.icon as any} size={16} color={Colors.primary} />
                <Text style={styles.categoryLabel}>{category.label}</Text>
              </View>
              {skills.map((skill) => (
                <View key={skill.id} style={styles.sliderRow}>
                  <View style={styles.sliderHeader}>
                    <Text style={styles.sliderName}>{skill.label}</Text>
                    <Text style={styles.sliderValue}>{editScores![skill.id]}</Text>
                  </View>
                  <Slider
                    style={styles.slider}
                    minimumValue={1}
                    maximumValue={10}
                    step={1}
                    value={editScores![skill.id]}
                    onValueChange={(v) =>
                      setEditScores((prev) => ({ ...prev!, [skill.id]: Math.round(v) }))
                    }
                    minimumTrackTintColor={Colors.primary}
                    maximumTrackTintColor={Colors.border}
                    thumbTintColor={Colors.primary}
                  />
                </View>
              ))}
            </View>
          ))}
          <View style={styles.editActions}>
            <Button
              title="Cancel"
              onPress={() => {
                setIsEditing(false);
                setEditScores(null);
              }}
              variant="outline"
              style={{ flex: 1 }}
            />
            <Button
              title="Save"
              onPress={handleSave}
              loading={saveScores.isPending}
              style={{ flex: 1 }}
            />
          </View>
        </View>
      )}
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
  greeting: {
    marginBottom: Spacing.lg,
  },
  greetingText: {
    fontSize: FontSize.xl,
    fontWeight: '800',
    color: Colors.text,
  },
  greetingSubtext: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  chartCard: {
    alignItems: 'center',
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  noSkillsText: {
    fontSize: FontSize.sm,
    color: Colors.textTertiary,
    fontStyle: 'italic',
    paddingVertical: Spacing.xxl,
  },
  categorySection: {
    marginBottom: Spacing.md,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  categoryLabel: {
    fontSize: FontSize.sm,
    fontWeight: '700',
    color: Colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  scoresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  scoreCard: {
    width: '23%',
    flexGrow: 1,
    alignItems: 'center',
    gap: 4,
    minWidth: 75,
  },
  scoreValue: {
    fontSize: FontSize.xl,
    fontWeight: '800',
    color: Colors.text,
  },
  scoreLabel: {
    fontSize: 10,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  editButton: {
    marginTop: Spacing.md,
    marginBottom: Spacing.lg,
  },
  editContainer: {
    marginBottom: Spacing.lg,
  },
  editHint: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  sliderRow: {
    marginBottom: Spacing.sm,
    backgroundColor: Colors.surface,
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
  },
  sliderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  sliderName: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.text,
  },
  sliderValue: {
    fontSize: FontSize.sm,
    fontWeight: '700',
    color: Colors.primary,
  },
  slider: {
    width: '100%',
    height: 30,
  },
  editActions: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.lg,
  },
});
