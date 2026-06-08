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
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useSelectedSkills, useLatestSkillScores, useSkillDefinitions } from '../../../src/hooks/useSkills';
import { useGoals, useGoalWithComments } from '../../../src/hooks/useGoals';
import { useReflections } from '../../../src/hooks/useReflections';
import { useAddCoachComment, useRemoveCoachThumbsUp, useSaveScoreFeedback, useUpdateScoreFeedback, useDeleteScoreFeedback, useScoreFeedback } from '../../../src/hooks/useTeam';
import { RadarChart, RadarSkill } from '../../../src/components/RadarChart';
import { GoalCard } from '../../../src/components/GoalCard';
import { Card } from '../../../src/components/ui/Card';
import { Button } from '../../../src/components/ui/Button';
import { SKILL_CATEGORIES } from '../../../src/constants/skills';
import { Colors, Spacing, FontSize, BorderRadius } from '../../../src/constants/theme';
import { supabase } from '../../../src/services/supabase';
import { Profile, Goal, CoachComment, CoachScoreFeedback } from '../../../src/types/database';
import { useAuth } from '../../../src/hooks/useAuth';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';

// Goal card with integrated coach feedback
function GoalWithFeedback({
  goal,
  skillDefs,
  coachView,
}: {
  goal: Goal;
  skillDefs: any[] | undefined;
  coachView?: boolean;
}) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const addComment = useAddCoachComment();
  const removeThumbsUp = useRemoveCoachThumbsUp();
  const { data: goalData } = useGoalWithComments(goal.id);
  const [commentText, setCommentText] = useState('');
  const [showCommentInput, setShowCommentInput] = useState(false);
  const [editingComment, setEditingComment] = useState<CoachComment | null>(null);
  const [editText, setEditText] = useState('');

  const comments = goalData?.coach_comments ?? [];
  const hasThumbsUp = comments.some(
    (c) => c.is_thumbs_up && c.coach_id === user?.id
  );

  const handleThumbsUp = async () => {
    try {
      if (hasThumbsUp) {
        await removeThumbsUp.mutateAsync({ goalId: goal.id });
      } else {
        await addComment.mutateAsync({ goalId: goal.id, isThumbsUp: true });
      }
    } catch (error: any) {
      Alert.alert(t('common.error'), error.message);
    }
  };

  const handleComment = async () => {
    if (!commentText.trim()) return;
    try {
      await addComment.mutateAsync({ goalId: goal.id, content: commentText.trim() });
      setCommentText('');
      setShowCommentInput(false);
    } catch (error: any) {
      Alert.alert(t('common.error'), error.message);
    }
  };

  const handleDeleteComment = (commentId: string) => {
    Alert.alert(
      t('coachFeedback.deleteComment'),
      t('coachFeedback.deleteConfirm'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: async () => {
            await supabase.from('coach_comments').delete().eq('id', commentId);
            queryClient.invalidateQueries({ queryKey: ['goal', goal.id] });
          },
        },
      ]
    );
  };

  const handleUpdateComment = async () => {
    if (!editingComment || !editText.trim()) return;
    await supabase
      .from('coach_comments')
      .update({ content: editText.trim() })
      .eq('id', editingComment.id);
    queryClient.invalidateQueries({ queryKey: ['goal', goal.id] });
    setEditingComment(null);
    setEditText('');
  };

  return (
    <Card style={styles.goalFeedbackCard}>
      <GoalCard goal={goal} coachView={coachView} skillDefinitions={skillDefs} />

      {/* Coach actions */}
      <View style={styles.coachActions}>
        <TouchableOpacity
          style={[styles.thumbsUpButton, hasThumbsUp && styles.thumbsUpActive]}
          onPress={handleThumbsUp}
          disabled={addComment.isPending || removeThumbsUp.isPending}
        >
          <Ionicons
            name={hasThumbsUp ? 'thumbs-up' : 'thumbs-up-outline'}
            size={18}
            color={hasThumbsUp ? Colors.white : Colors.primary}
          />
          {hasThumbsUp && <Text style={[styles.actionText, { color: Colors.white }]}>{t('coachFeedback.thumbsUp')}</Text>}
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.commentToggle}
          onPress={() => setShowCommentInput(!showCommentInput)}
        >
          <Ionicons name="chatbubble-outline" size={18} color={Colors.primary} />
          <Text style={styles.actionText}>{t('coach.writeFeedback')}</Text>
        </TouchableOpacity>
      </View>

      {/* Existing feedback grouped */}
      {comments.length > 0 && (
        <View style={styles.commentsGroup}>
          {comments.map((comment) => (
            <View key={comment.id} style={styles.commentRow}>
              {comment.is_thumbs_up && !comment.content ? (
                <View style={styles.thumbsUpIndicator}>
                  <Ionicons name="thumbs-up" size={14} color={Colors.primary} />
                  <Text style={styles.commentMeta}>
                    {format(new Date(comment.created_at), 'd MMM', { locale: nl })}
                  </Text>
                </View>
              ) : editingComment?.id === comment.id ? (
                <View style={styles.editRow}>
                  <TextInput
                    style={styles.editField}
                    value={editText}
                    onChangeText={setEditText}
                    multiline
                  />
                  <View style={styles.editActions}>
                    <Button
                      title={t('coachFeedback.updateComment')}
                      onPress={handleUpdateComment}
                      size="sm"
                    />
                    <TouchableOpacity onPress={() => setEditingComment(null)}>
                      <Text style={styles.cancelEdit}>{t('common.cancel')}</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <View style={styles.commentContent}>
                  {comment.content && (
                    <Text style={styles.commentText}>{comment.content}</Text>
                  )}
                  <View style={styles.commentFooter}>
                    <Text style={styles.commentMeta}>
                      {format(new Date(comment.created_at), 'd MMM', { locale: nl })}
                    </Text>
                    {comment.coach_id === user?.id && comment.content && (
                      <View style={styles.commentActions}>
                        <TouchableOpacity
                          onPress={() => {
                            setEditingComment(comment);
                            setEditText(comment.content ?? '');
                          }}
                        >
                          <Ionicons name="pencil-outline" size={14} color={Colors.textTertiary} />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => handleDeleteComment(comment.id)}>
                          <Ionicons name="trash-outline" size={14} color={Colors.error} />
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                </View>
              )}
            </View>
          ))}
        </View>
      )}

      {/* Comment input */}
      {showCommentInput && (
        <View style={styles.commentInput}>
          <TextInput
            style={styles.commentField}
            placeholder={t('coach.writeFeedback')}
            placeholderTextColor={Colors.textTertiary}
            value={commentText}
            onChangeText={setCommentText}
            multiline
          />
          <Button
            title={t('common.send')}
            onPress={handleComment}
            loading={addComment.isPending}
            size="sm"
            disabled={!commentText.trim()}
          />
        </View>
      )}
    </Card>
  );
}

export default function PlayerDetailScreen() {
  const { t } = useTranslation();
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

  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { data: selectedSkills, isLoading: loadingSkills } = useSelectedSkills(athleteId);
  const { data: skillScores, isLoading: loadingScores } = useLatestSkillScores(athleteId);
  const { data: skillDefs } = useSkillDefinitions();
  const { data: activeGoals } = useGoals(athleteId, 'active');
  const { data: achievedGoals } = useGoals(athleteId, 'achieved');
  const { data: reflections } = useReflections(athleteId);
  const { data: scoreFeedback } = useScoreFeedback(athleteId);
  const saveScoreFeedback = useSaveScoreFeedback();
  const updateScoreFeedback = useUpdateScoreFeedback();
  const deleteScoreFeedback = useDeleteScoreFeedback();
  const [scoreFeedbackText, setScoreFeedbackText] = useState('');
  const [showScoreFeedbackInput, setShowScoreFeedbackInput] = useState(false);
  const [editingScoreFeedback, setEditingScoreFeedback] = useState<CoachScoreFeedback | null>(null);
  const [editScoreFeedbackText, setEditScoreFeedbackText] = useState('');

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
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
    >
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="interactive"
    >
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
        <Text style={styles.sectionTitle}>{t('coach.performanceProfile')}</Text>
        {radarSkills.length >= 3 ? (
          <RadarChart skills={radarSkills} size={280} />
        ) : (
          <Text style={styles.noSkillsText}>{t('coach.profileNotSet')}</Text>
        )}
      </Card>

      {/* Skill scores grid */}
      {selectedSkills && selectedSkills.length > 0 && (
        <View style={styles.scoresSection}>
          <Text style={styles.sectionTitle}>{t('coach.skills')}</Text>
          {SKILL_CATEGORIES.map((cat) => {
            const catSkills = (selectedSkills ?? []).filter((s) => s.category === cat.key);
            if (catSkills.length === 0) return null;
            return (
              <View key={cat.key} style={styles.categoryBlock}>
                <Text style={styles.categoryLabel}>{cat.label}</Text>
                {catSkills.map((skill) => {
                  const score = scoreMap.get(skill.id) ?? 5;
                  return (
                    <View key={skill.id} style={styles.skillRow}>
                      <Text style={styles.skillLabel} numberOfLines={1}>{skill.label}</Text>
                      <View style={styles.scoreBarBg}>
                        <View style={[styles.scoreBarFill, { width: `${score * 10}%` }]} />
                      </View>
                      <Text style={styles.scoreText}>{score}</Text>
                    </View>
                  );
                })}
              </View>
            );
          })}
        </View>
      )}

      {/* Score feedback section */}
      {selectedSkills && selectedSkills.length > 0 && (
        <Card style={styles.scoreFeedbackCard}>
          <View style={styles.scoreFeedbackHeader}>
            <Ionicons name="chatbox-ellipses-outline" size={18} color={Colors.primary} />
            <Text style={styles.scoreFeedbackTitle}>{t('scoreFeedback.title')}</Text>
            <TouchableOpacity
              style={styles.scoreFeedbackToggle}
              onPress={() => setShowScoreFeedbackInput(!showScoreFeedbackInput)}
            >
              <Ionicons name={showScoreFeedbackInput ? 'close-outline' : 'add-outline'} size={20} color={Colors.primary} />
            </TouchableOpacity>
          </View>

          {/* Input for new feedback */}
          {showScoreFeedbackInput && (
            <View style={styles.scoreFeedbackInputRow}>
              <TextInput
                style={styles.scoreFeedbackField}
                placeholder={t('scoreFeedback.writeScoreFeedback')}
                placeholderTextColor={Colors.textTertiary}
                value={scoreFeedbackText}
                onChangeText={setScoreFeedbackText}
                multiline
              />
              <Button
                title={t('scoreFeedback.sendFeedback')}
                onPress={async () => {
                  if (!scoreFeedbackText.trim()) return;
                  try {
                    await saveScoreFeedback.mutateAsync({
                      athleteId,
                      feedbackText: scoreFeedbackText.trim(),
                    });
                    setScoreFeedbackText('');
                    setShowScoreFeedbackInput(false);
                  } catch (error: any) {
                    Alert.alert(t('common.error'), error.message);
                  }
                }}
                loading={saveScoreFeedback.isPending}
                size="sm"
                disabled={!scoreFeedbackText.trim()}
              />
            </View>
          )}

          {/* Existing score feedback */}
          {scoreFeedback && scoreFeedback.length > 0 ? (
            <View style={styles.scoreFeedbackList}>
              {scoreFeedback.map((fb) => (
                <View key={fb.id} style={styles.scoreFeedbackItem}>
                  {editingScoreFeedback?.id === fb.id ? (
                    <View style={styles.editRow}>
                      <TextInput
                        style={styles.editField}
                        value={editScoreFeedbackText}
                        onChangeText={setEditScoreFeedbackText}
                        multiline
                      />
                      <View style={styles.editActions}>
                        <Button
                          title={t('scoreFeedback.updateFeedback')}
                          onPress={async () => {
                            if (!editScoreFeedbackText.trim()) return;
                            try {
                              await updateScoreFeedback.mutateAsync({
                                feedbackId: fb.id,
                                athleteId,
                                feedbackText: editScoreFeedbackText.trim(),
                              });
                              setEditingScoreFeedback(null);
                              setEditScoreFeedbackText('');
                            } catch (error: any) {
                              Alert.alert(t('common.error'), error.message);
                            }
                          }}
                          size="sm"
                          loading={updateScoreFeedback.isPending}
                        />
                        <TouchableOpacity onPress={() => setEditingScoreFeedback(null)}>
                          <Text style={styles.cancelEdit}>{t('common.cancel')}</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ) : (
                    <>
                      <Text style={styles.scoreFeedbackText}>{fb.feedback_text}</Text>
                      <View style={styles.scoreFeedbackFooter}>
                        <Text style={styles.commentMeta}>
                          {format(new Date(fb.created_at), 'd MMM', { locale: nl })}
                        </Text>
                        {fb.coach_id === user?.id && (
                          <View style={styles.commentActions}>
                            <TouchableOpacity
                              onPress={() => {
                                setEditingScoreFeedback(fb);
                                setEditScoreFeedbackText(fb.feedback_text);
                              }}
                            >
                              <Ionicons name="pencil-outline" size={14} color={Colors.textTertiary} />
                            </TouchableOpacity>
                            <TouchableOpacity
                              onPress={() => {
                                Alert.alert(
                                  t('scoreFeedback.deleteFeedback'),
                                  t('scoreFeedback.deleteConfirm'),
                                  [
                                    { text: t('common.cancel'), style: 'cancel' },
                                    {
                                      text: t('common.delete'),
                                      style: 'destructive',
                                      onPress: async () => {
                                        await deleteScoreFeedback.mutateAsync({
                                          feedbackId: fb.id,
                                          athleteId,
                                        });
                                      },
                                    },
                                  ]
                                );
                              }}
                            >
                              <Ionicons name="trash-outline" size={14} color={Colors.error} />
                            </TouchableOpacity>
                          </View>
                        )}
                      </View>
                    </>
                  )}
                </View>
              ))}
            </View>
          ) : (
            !showScoreFeedbackInput && (
              <Text style={styles.scoreFeedbackEmpty}>{t('scoreFeedback.noFeedback')}</Text>
            )
          )}
        </Card>
      )}

      {/* Active goals with integrated feedback */}
      <Text style={styles.sectionTitle}>
        {t('coach.activeGoalsCount', { count: activeGoals?.length ?? 0 })}
      </Text>
      {activeGoals && activeGoals.length > 0 ? (
        activeGoals.map((goal) => (
          <GoalWithFeedback
            key={goal.id}
            goal={goal}
            skillDefs={skillDefs}
            coachView
          />
        ))
      ) : (
        <Text style={styles.emptyText}>{t('goals.noActiveGoals')}</Text>
      )}

      {/* Achieved goals */}
      {achievedGoals && achievedGoals.length > 0 && (
        <>
          <Text style={[styles.sectionTitle, { marginTop: Spacing.lg }]}>
            {t('coach.achievedGoalsCount', { count: achievedGoals.length })}
          </Text>
          {achievedGoals.map((goal) => (
            <GoalWithFeedback
              key={goal.id}
              goal={goal}
              skillDefs={skillDefs}
            />
          ))}
        </>
      )}

      {/* Recent reflections summary */}
      <Text style={[styles.sectionTitle, { marginTop: Spacing.lg }]}>
        {t('coach.recentActivity')}
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
                {r.session_type === 'training' ? t('common.training') : t('common.match')}
              </Text>
              <Text style={styles.reflectionDate}>
                {format(new Date(r.created_at), 'd MMM', { locale: nl })}
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
        <Text style={styles.emptyText}>{t('coach.noReflections')}</Text>
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
  scoresSection: {
    marginBottom: Spacing.lg,
  },
  categoryBlock: {
    marginBottom: Spacing.md,
  },
  categoryLabel: {
    fontSize: FontSize.xs,
    fontWeight: '700',
    color: Colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: Spacing.xs,
  },
  skillRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: 6,
  },
  skillLabel: {
    fontSize: FontSize.sm,
    color: Colors.text,
    width: 120,
  },
  scoreBarBg: {
    flex: 1,
    height: 8,
    backgroundColor: Colors.border,
    borderRadius: 4,
    overflow: 'hidden',
  },
  scoreBarFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 4,
  },
  scoreText: {
    fontSize: FontSize.sm,
    fontWeight: '700',
    color: Colors.text,
    width: 24,
    textAlign: 'right',
  },
  // Goal feedback card
  goalFeedbackCard: {
    marginBottom: Spacing.md,
    padding: 0,
    overflow: 'hidden',
  },
  coachActions: {
    flexDirection: 'row',
    gap: Spacing.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
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
  thumbsUpActive: {
    backgroundColor: Colors.primary,
  },
  commentToggle: {
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
  commentsGroup: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.sm,
    gap: Spacing.xs,
  },
  commentRow: {
    paddingVertical: 4,
  },
  thumbsUpIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  commentContent: {},
  commentText: {
    fontSize: FontSize.sm,
    color: Colors.text,
    lineHeight: 20,
  },
  commentFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 2,
  },
  commentMeta: {
    fontSize: FontSize.xs,
    color: Colors.textTertiary,
  },
  commentActions: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  editRow: {
    gap: Spacing.sm,
  },
  editField: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    fontSize: FontSize.sm,
    color: Colors.text,
  },
  editActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  cancelEdit: {
    fontSize: FontSize.sm,
    color: Colors.textTertiary,
  },
  commentInput: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.md,
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
  // Score feedback styles
  scoreFeedbackCard: {
    marginBottom: Spacing.lg,
    padding: Spacing.md,
  },
  scoreFeedbackHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  scoreFeedbackTitle: {
    fontSize: FontSize.md,
    fontWeight: '700',
    color: Colors.text,
    flex: 1,
  },
  scoreFeedbackToggle: {
    padding: Spacing.xs,
  },
  scoreFeedbackInputRow: {
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  scoreFeedbackField: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    fontSize: FontSize.sm,
    color: Colors.text,
    maxHeight: 100,
  },
  scoreFeedbackList: {
    gap: Spacing.sm,
  },
  scoreFeedbackItem: {
    backgroundColor: Colors.surfaceSecondary,
    borderRadius: BorderRadius.sm,
    padding: Spacing.sm,
  },
  scoreFeedbackText: {
    fontSize: FontSize.sm,
    color: Colors.text,
    lineHeight: 20,
  },
  scoreFeedbackFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing.xs,
  },
  scoreFeedbackEmpty: {
    fontSize: FontSize.sm,
    color: Colors.textTertiary,
    fontStyle: 'italic',
  },
});
