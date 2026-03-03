import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSelectedSkills, useLatestSkillScores, useSkillDefinitions } from '../../../src/hooks/useSkills';
import { useGoals } from '../../../src/hooks/useGoals';
import { useReflections } from '../../../src/hooks/useReflections';
import { useAddCoachComment } from '../../../src/hooks/useTeam';
import { RadarChart, RadarSkill } from '../../../src/components/RadarChart';
import { GoalCard } from '../../../src/components/GoalCard';
import { Card } from '../../../src/components/ui/Card';
import { Button } from '../../../src/components/ui/Button';
import { Colors, Spacing, FontSize, BorderRadius } from '../../../src/constants/theme';
import { supabase } from '../../../src/services/supabase';
import { Profile } from '../../../src/types/database';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';

export default function PlayerDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const athleteId = id as string;

  const { data: playerProfile, isLoading: loadingProfile } = useQuery({
    queryKey: ['player-profile', athleteId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', athleteId)
        .single();
      if (error) throw error;
      return data as Profile;
    },
    enabled: !!athleteId,
  });

  const { data: selectedSkills, isLoading: loadingSkills } = useSelectedSkills(athleteId);
  const { data: skillScores, isLoading: loadingScores } = useLatestSkillScores(athleteId);
  const { data: skillDefs } = useSkillDefinitions();
  const { data: activeGoals } = useGoals(athleteId, 'active');
  const { data: achievedGoals } = useGoals(athleteId, 'achieved');
  const { data: reflections } = useReflections(athleteId);
  const addComment = useAddCoachComment();

  const [commentGoalId, setCommentGoalId] = useState<string | null>(null);
  const [commentText, setCommentText] = useState('');

  const handleThumbsUp = async (goalId: string) => {
    try {
      await addComment.mutateAsync({ goalId, isThumbsUp: true });
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  const handleComment = async (goalId: string) => {
    if (!commentText.trim()) return;
    try {
      await addComment.mutateAsync({ goalId, content: commentText.trim() });
      setCommentText('');
      setCommentGoalId(null);
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  if (loadingProfile || loadingSkills || loadingScores) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  // Build radar chart data from dynamic skills
  const scoreMap = new Map(
    (skillScores ?? []).map((s) => [s.skill_id, s.score])
  );
  const radarSkills: RadarSkill[] = (selectedSkills ?? []).map((skill) => ({
    label: skill.label,
    score: scoreMap.get(skill.id) ?? 5,
  }));

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Player header */}
      <View style={styles.playerHeader}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {playerProfile?.full_name
              ?.split(' ')
              .map((n) => n[0])
              .join('')
              .toUpperCase()
              .slice(0, 2)}
          </Text>
        </View>
        <Text style={styles.playerName}>{playerProfile?.full_name}</Text>
      </View>

      {/* Radar chart */}
      <Card style={styles.chartCard}>
        <Text style={styles.sectionTitle}>Performance Profile</Text>
        {radarSkills.length >= 3 ? (
          <RadarChart skills={radarSkills} size={280} />
        ) : (
          <Text style={styles.noSkillsText}>This athlete hasn't set up their profile yet</Text>
        )}
      </Card>

      {/* Active goals */}
      <Text style={styles.sectionTitle}>
        Active Goals ({activeGoals?.length ?? 0})
      </Text>
      {activeGoals && activeGoals.length > 0 ? (
        activeGoals.map((goal) => (
          <View key={goal.id}>
            <GoalCard goal={goal} coachView skillDefinitions={skillDefs} />
            <View style={styles.coachActions}>
              <TouchableOpacity
                style={styles.thumbsUpButton}
                onPress={() => handleThumbsUp(goal.id)}
              >
                <Ionicons name="thumbs-up-outline" size={18} color={Colors.primary} />
                <Text style={styles.actionText}>Encourage</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.commentButton}
                onPress={() =>
                  setCommentGoalId(commentGoalId === goal.id ? null : goal.id)
                }
              >
                <Ionicons name="chatbubble-outline" size={18} color={Colors.primary} />
                <Text style={styles.actionText}>Comment</Text>
              </TouchableOpacity>
            </View>
            {commentGoalId === goal.id && (
              <View style={styles.commentInput}>
                <TextInput
                  style={styles.commentField}
                  placeholder="Write feedback..."
                  placeholderTextColor={Colors.textTertiary}
                  value={commentText}
                  onChangeText={setCommentText}
                  multiline
                />
                <Button
                  title="Send"
                  onPress={() => handleComment(goal.id)}
                  loading={addComment.isPending}
                  size="sm"
                />
              </View>
            )}
          </View>
        ))
      ) : (
        <Text style={styles.emptyText}>No active goals</Text>
      )}

      {/* Achieved goals */}
      {achievedGoals && achievedGoals.length > 0 && (
        <>
          <Text style={[styles.sectionTitle, { marginTop: Spacing.lg }]}>
            Achieved Goals ({achievedGoals.length})
          </Text>
          {achievedGoals.map((goal) => (
            <GoalCard key={goal.id} goal={goal} skillDefinitions={skillDefs} />
          ))}
        </>
      )}

      {/* Recent reflections summary */}
      <Text style={[styles.sectionTitle, { marginTop: Spacing.lg }]}>
        Recent Activity
      </Text>
      {reflections && reflections.length > 0 ? (
        reflections.slice(0, 5).map((r) => (
          <Card key={r.id} style={styles.reflectionCard} padding={Spacing.sm}>
            <View style={styles.reflectionRow}>
              <Ionicons
                name={r.session_type === 'training' ? 'barbell-outline' : 'trophy-outline'}
                size={16}
                color={Colors.primary}
              />
              <Text style={styles.reflectionType}>
                {r.session_type === 'training' ? 'Training' : 'Match'}
              </Text>
              <Text style={styles.reflectionDate}>
                {format(new Date(r.created_at), 'MMM d')}
              </Text>
            </View>
            {r.notes && (
              <Text style={styles.reflectionNotes} numberOfLines={2}>
                {r.notes}
              </Text>
            )}
          </Card>
        ))
      ) : (
        <Text style={styles.emptyText}>No reflections yet</Text>
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
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playerHeader: {
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.primaryLight + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  avatarText: {
    fontSize: FontSize.xxl,
    fontWeight: '700',
    color: Colors.primary,
  },
  playerName: {
    fontSize: FontSize.xl,
    fontWeight: '800',
    color: Colors.text,
  },
  chartCard: {
    alignItems: 'center',
    padding: Spacing.md,
    marginBottom: Spacing.lg,
  },
  noSkillsText: {
    fontSize: FontSize.sm,
    color: Colors.textTertiary,
    fontStyle: 'italic',
    paddingVertical: Spacing.xl,
  },
  sectionTitle: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: Spacing.md,
  },
  coachActions: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: -Spacing.sm,
    marginBottom: Spacing.md,
    paddingHorizontal: Spacing.sm,
  },
  thumbsUpButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.primary + '10',
  },
  commentButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.primary + '10',
  },
  actionText: {
    fontSize: FontSize.xs,
    fontWeight: '600',
    color: Colors.primary,
  },
  commentInput: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
    paddingHorizontal: Spacing.sm,
  },
  commentField: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    fontSize: FontSize.sm,
    color: Colors.text,
    maxHeight: 80,
  },
  reflectionCard: {
    marginBottom: Spacing.sm,
  },
  reflectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  reflectionType: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.text,
    flex: 1,
  },
  reflectionDate: {
    fontSize: FontSize.xs,
    color: Colors.textTertiary,
  },
  reflectionNotes: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginTop: 4,
    lineHeight: 18,
  },
  emptyText: {
    fontSize: FontSize.sm,
    color: Colors.textTertiary,
    fontStyle: 'italic',
    marginBottom: Spacing.md,
  },
});
