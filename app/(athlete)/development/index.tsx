import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useReflections } from '../../../src/hooks/useReflections';
import { useGoals } from '../../../src/hooks/useGoals';
import { useUpcomingSessions } from '../../../src/hooks/useSchedule';
import { useAthleteXp, useSessionStreak, useMyAchievements, useAchievements, useCheckAchievements, useGoalStats } from '../../../src/hooks/useGamification';
import { useMyTeams } from '../../../src/hooks/useTeam';
import { useTeamLeaderboard } from '../../../src/hooks/useGamification';
import { useAuth } from '../../../src/hooks/useAuth';
import { Card } from '../../../src/components/ui/Card';
import { Leaderboard } from '../../../src/components/Leaderboard';
import { AchievementCard } from '../../../src/components/AchievementCard';
import { useCelebration } from '../../../src/components/CelebrationContext';
import { Colors, Spacing, FontSize, BorderRadius } from '../../../src/constants/theme';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';

export default function DevelopmentScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { user } = useAuth();
  const { data: reflections, isLoading: loadingReflections } = useReflections();
  const { data: achievedGoals } = useGoals(undefined, 'achieved');
  const { data: totalXp } = useAthleteXp();
  const { data: streak } = useSessionStreak();
  const { data: myAchievements } = useMyAchievements();
  const { data: allAchievements } = useAchievements();
  const { data: myTeams } = useMyTeams();
  const teamId = myTeams?.[0]?.id;
  const { data: leaderboard } = useTeamLeaderboard(teamId);

  const { data: upcomingSessions } = useUpcomingSessions(1);
  const { celebrate } = useCelebration();
  const hasCheckedRank = useRef(false);
  const [showXpExplanation, setShowXpExplanation] = useState(false);
  const [showActionMenu, setShowActionMenu] = useState(false);
  const { checkAndAward } = useCheckAchievements();
  const { data: goalStats } = useGoalStats();

  const reflectionCount = reflections?.length ?? 0;
  const streakCount = streak ?? 0;

  // Track leaderboard rank changes
  useEffect(() => {
    if (!leaderboard || !user?.id || hasCheckedRank.current) return;
    hasCheckedRank.current = true;

    const myRank = leaderboard.findIndex((e) => e.athlete_id === user.id) + 1;
    if (myRank === 0) return;

    const storageKey = `deco_rank_${user.id}`;
    AsyncStorage.getItem(storageKey).then((prev) => {
      const prevRank = prev ? parseInt(prev, 10) : 0;
      AsyncStorage.setItem(storageKey, String(myRank));

      if (prevRank === 0) {
        // First time seeing leaderboard — show XP explanation
        setShowXpExplanation(true);
        return;
      }

      if (myRank === 1 && prevRank !== 1) {
        celebrate({
          type: 'number_1',
          message: t('gamification.number1'),
          subMessage: t('gamification.number1Sub'),
          confetti: true,
        });
      } else if (myRank <= 3 && prevRank > 3) {
        celebrate({
          type: 'top_3',
          message: t('gamification.top3'),
          subMessage: t('gamification.top3Sub', { rank: myRank }),
          confetti: true,
        });
      } else if (myRank < prevRank) {
        celebrate({
          type: 'rank_up',
          message: t('gamification.rankUp'),
          subMessage: t('gamification.rankUpSub', { rank: myRank }),
        });
      }
    });
  }, [leaderboard]);

  // Track streak changes — celebrate milestones
  useEffect(() => {
    if (!streak || streak < 1 || !user?.id) return;

    const storageKey = `deco_streak_${user.id}`;
    AsyncStorage.getItem(storageKey).then((prev) => {
      const prevStreak = prev ? parseInt(prev, 10) : 0;
      if (streak > prevStreak) {
        AsyncStorage.setItem(storageKey, String(streak));

        // Different messages for different milestones
        let message: string;
        let subMessage: string;
        let confetti = false;

        if (streak === 1 && prevStreak === 0) {
          message = 'Je streak is gestart!';
          subMessage = 'Hou vol en bouw je streak op!';
        } else if (streak === 3) {
          message = '3 dagen op rij!';
          subMessage = 'Je bent lekker op dreef!';
        } else if (streak === 7) {
          message = 'Een hele week!';
          subMessage = 'Wat een commitment!';
          confetti = true;
        } else if (streak === 14) {
          message = '2 weken non-stop!';
          subMessage = 'Ongelooflijke discipline!';
          confetti = true;
        } else {
          message = t('gamification.streakMilestone', { count: streak });
          subMessage = t('gamification.streakMilestoneSub');
        }

        celebrate({
          type: 'streak',
          message,
          subMessage,
          icon: 'flame',
          confetti,
        });
      }
    });
  }, [streak]);

  // Achievement earned keys
  const earnedKeys = new Set(
    (myAchievements ?? []).map((a) => a.achievement?.key).filter(Boolean)
  );

  // Check rank achievements when leaderboard rank changes
  useEffect(() => {
    if (!leaderboard || !user?.id || !goalStats) return;
    const myIndex = leaderboard.findIndex((e) => e.athlete_id === user.id);
    if (myIndex < 0) return;
    const myRank = myIndex + 1;
    if (myRank <= 3) {
      checkAndAward({ ...goalStats, bestRank: myRank });
    }
  }, [leaderboard, user?.id, goalStats]);

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* XP & Streak hero */}
        <Card style={styles.xpHero} padding={Spacing.md}>
          <TouchableOpacity
            onPress={() => setShowXpExplanation(true)}
            style={styles.xpHelpButton}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="help-circle-outline" size={20} color="rgba(255,255,255,0.6)" />
          </TouchableOpacity>
          <View style={styles.xpRow}>
            <View style={styles.xpMain}>
              <Text style={styles.xpValue}>{totalXp ?? 0}</Text>
              <Text style={styles.xpLabel}>XP</Text>
            </View>
            <View style={styles.streakMain}>
              <Ionicons name="flame" size={streakCount > 0 ? 26 : 22} color={streakCount > 0 ? '#FF6B35' : 'rgba(255,255,255,0.3)'} />
              <Text style={[styles.streakValue, streakCount === 0 && { opacity: 0.4 }]}>{streakCount}</Text>
              <Text style={styles.streakLabel}>
                {streakCount === 0 ? 'Start je streak!' : t('gamification.streak')}
              </Text>
            </View>
          </View>
        </Card>

        {/* Stats cards */}
        <View style={styles.statsRow}>
          <Card style={styles.statCard} padding={Spacing.md}>
            <Text style={styles.statNumber}>{reflectionCount}</Text>
            <Text style={styles.statLabel}>{t('development.reflections')}</Text>
          </Card>
          <Card style={styles.statCard} padding={Spacing.md}>
            <Text style={[styles.statNumber, { color: Colors.success }]}>{achievedGoals?.length ?? 0}</Text>
            <Text style={styles.statLabel}>{t('development.goalsAchieved')}</Text>
          </Card>
        </View>

        {/* Team Leaderboard */}
        {leaderboard && leaderboard.length > 0 && (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{t('gamification.teamRanking')}</Text>
              <TouchableOpacity onPress={() => setShowXpExplanation(true)} style={styles.helpButton}>
                <Ionicons name="help-circle-outline" size={22} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>
            <Leaderboard entries={leaderboard} currentUserId={user?.id} />
          </>
        )}

        {/* Achievements preview */}
        {allAchievements && allAchievements.length > 0 && (
          <>
            <View style={[styles.sectionHeader, { marginTop: Spacing.lg }]}>
              <Text style={styles.sectionTitle}>{t('gamification.achievements')}</Text>
            </View>
            <View style={styles.achievementsGrid}>
              {allAchievements.slice(0, 6).map((achievement) => (
                <AchievementCard
                  key={achievement.id}
                  achievement={achievement}
                  earned={earnedKeys.has(achievement.key)}
                />
              ))}
            </View>
          </>
        )}

        {/* Recent reflections - compact list */}
        {reflections && reflections.length > 0 && (
          <>
            <View style={[styles.sectionHeader, { marginTop: Spacing.lg }]}>
              <Text style={styles.sectionTitle}>{t('development.recentReflections')}</Text>
            </View>
            {reflections.slice(0, 5).map((reflection) => (
              <Card key={reflection.id} style={styles.reflectionCard}>
                <View style={styles.reflectionHeader}>
                  <View style={styles.sessionTypeBadge}>
                    <Ionicons
                      name={
                        reflection.session_type === 'training'
                          ? 'barbell-outline'
                          : 'trophy-outline'
                      }
                      size={14}
                      color={Colors.primary}
                    />
                    <Text style={styles.sessionTypeText}>
                      {reflection.session_type === 'training' ? t('common.training') : t('common.match')}
                    </Text>
                  </View>
                  <Text style={styles.reflectionDate}>
                    {format(new Date(reflection.created_at), 'd MMM yyyy', { locale: nl })}
                  </Text>
                </View>
                {reflection.notes && (
                  <Text style={styles.reflectionNotes} numberOfLines={2}>
                    {reflection.notes}
                  </Text>
                )}
              </Card>
            ))}
          </>
        )}
      </ScrollView>

      {/* XP Explanation Modal */}
      <Modal visible={showXpExplanation} transparent animationType="fade" onRequestClose={() => setShowXpExplanation(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Ionicons name="trophy" size={28} color={Colors.accent} />
              <Text style={styles.modalTitle}>{t('gamification.xpExplanationTitle')}</Text>
            </View>
            <Text style={styles.modalBody}>{t('gamification.xpExplanationBody')}</Text>
            <TouchableOpacity style={styles.modalButton} onPress={() => setShowXpExplanation(false)}>
              <Text style={styles.modalButtonText}>{t('common.ok', 'OK')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* FAB for new entry */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => setShowActionMenu(true)}
        activeOpacity={0.8}
      >
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>

      {/* Action menu modal */}
      <Modal visible={showActionMenu} transparent animationType="fade" onRequestClose={() => setShowActionMenu(false)}>
        <TouchableOpacity style={styles.actionOverlay} activeOpacity={1} onPress={() => setShowActionMenu(false)}>
          <View style={styles.actionSheet}>
            <Text style={styles.actionTitle}>Wat wil je doen?</Text>

            <TouchableOpacity
              style={styles.actionOption}
              onPress={() => {
                setShowActionMenu(false);
                const today = format(new Date(), 'yyyy-MM-dd');
                const todaySession = upcomingSessions?.find((s) => s.date === today);
                if (!todaySession) {
                  Alert.alert('Geen sessie gepland', 'Er is vandaag geen training of wedstrijd gepland.');
                  return;
                }
                router.push({
                  pathname: '/(athlete)/development/session-goals',
                  params: { sessionId: todaySession.id },
                });
              }}
              activeOpacity={0.7}
            >
              <View style={[styles.actionIconCircle, { backgroundColor: Colors.primary + '15' }]}>
                <Ionicons name="flag" size={22} color={Colors.primary} />
              </View>
              <View style={styles.actionTextGroup}>
                <Text style={styles.actionOptionTitle}>Focus doel instellen</Text>
                <Text style={styles.actionOptionDesc}>Kies waar je je op wilt focussen</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={Colors.textTertiary} />
            </TouchableOpacity>

            <View style={styles.actionDivider} />

            <TouchableOpacity
              style={styles.actionOption}
              onPress={() => {
                setShowActionMenu(false);
                const today = format(new Date(), 'yyyy-MM-dd');
                const todaySession = upcomingSessions?.find((s) => s.date === today);
                if (todaySession) {
                  router.push({
                    pathname: '/(athlete)/development/reflect',
                    params: { sessionId: todaySession.id },
                  });
                } else {
                  router.push('/(athlete)/development/reflect' as any);
                }
              }}
              activeOpacity={0.7}
            >
              <View style={[styles.actionIconCircle, { backgroundColor: Colors.accent + '15' }]}>
                <Ionicons name="chatbubble-ellipses" size={22} color={Colors.accent} />
              </View>
              <View style={styles.actionTextGroup}>
                <Text style={styles.actionOptionTitle}>Reflectie toevoegen</Text>
                <Text style={styles.actionOptionDesc}>Evalueer je training of wedstrijd</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={Colors.textTertiary} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionCancel} onPress={() => setShowActionMenu(false)}>
              <Text style={styles.actionCancelText}>Annuleren</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    padding: Spacing.lg,
    paddingBottom: 100,
  },
  xpHero: {
    marginBottom: Spacing.md,
    backgroundColor: Colors.primaryDark,
    position: 'relative' as const,
  },
  xpHelpButton: {
    position: 'absolute' as const,
    top: Spacing.sm,
    right: Spacing.sm,
    zIndex: 1,
  },
  xpRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  xpMain: {
    alignItems: 'center',
  },
  xpValue: {
    fontSize: FontSize.xxxl,
    fontWeight: '900',
    color: Colors.white,
  },
  xpLabel: {
    fontSize: FontSize.sm,
    fontWeight: '700',
    color: Colors.white,
    opacity: 0.7,
  },
  streakMain: {
    alignItems: 'center',
  },
  streakValue: {
    fontSize: FontSize.xxl,
    fontWeight: '800',
    color: Colors.white,
  },
  streakLabel: {
    fontSize: FontSize.xs,
    fontWeight: '600',
    color: Colors.white,
    opacity: 0.7,
  },
  statsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: FontSize.xxl,
    fontWeight: '800',
    color: Colors.primary,
  },
  statLabel: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.text,
  },
  achievementsGrid: {
    gap: Spacing.sm,
  },
  reflectionCard: {
    marginBottom: Spacing.sm,
    padding: Spacing.md,
  },
  reflectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  sessionTypeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.primary + '10',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  sessionTypeText: {
    fontSize: FontSize.xs,
    fontWeight: '600',
    color: Colors.primary,
  },
  reflectionDate: {
    fontSize: FontSize.xs,
    color: Colors.textTertiary,
  },
  reflectionNotes: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  empty: {
    alignItems: 'center',
    paddingVertical: Spacing.xxl,
    gap: Spacing.sm,
  },
  emptyText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  helpButton: {
    padding: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  modalCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  modalTitle: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.text,
  },
  modalBody: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  modalButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
  },
  modalButtonText: {
    color: Colors.white,
    fontWeight: '700',
    fontSize: FontSize.md,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  actionOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  actionSheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: Spacing.lg,
    paddingHorizontal: Spacing.lg,
    paddingBottom: 40,
  },
  actionTitle: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.text,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  actionOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    gap: Spacing.md,
  },
  actionIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionTextGroup: {
    flex: 1,
  },
  actionOptionTitle: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: Colors.text,
  },
  actionOptionDesc: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  actionDivider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: Spacing.xs,
  },
  actionCancel: {
    marginTop: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.backgroundSecondary ?? Colors.background,
    alignItems: 'center',
  },
  actionCancelText: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
});
