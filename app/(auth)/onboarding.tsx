import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  Animated,
  Dimensions,
  TouchableOpacity,
  Platform,
} from 'react-native';
import Slider from '@react-native-community/slider';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../src/hooks/useAuth';
import { Button } from '../../src/components/ui/Button';
import { Input } from '../../src/components/ui/Input';
import { RadarChart, RadarSkill } from '../../src/components/RadarChart';
import { useUpdateOnboardingComplete } from '../../src/hooks/useProfile';
import { useSkillDefinitions, useSaveSelectedSkills, useSaveSkillScores } from '../../src/hooks/useSkills';
import { useSaveTrainingSchedule, useGenerateUpcomingSessions } from '../../src/hooks/useSchedule';
import { useCreateTeam } from '../../src/hooks/useTeam';
import { SKILL_CATEGORIES, DAY_LABELS, DAY_LABELS_FULL } from '../../src/constants/skills';
import { Colors, Spacing, FontSize, BorderRadius } from '../../src/constants/theme';
import { SkillCategory, SkillDefinition, ScheduleSessionType, TrainingSchedule } from '../../src/types/database';
import { supabase } from '../../src/services/supabase';

type OnboardingStep =
  | 'welcome'
  | 'technical'
  | 'tactical'
  | 'physical'
  | 'mental'
  | 'notifications'
  | 'schedule'
  | 'scoring';

const STEP_ORDER: OnboardingStep[] = [
  'welcome',
  'technical',
  'tactical',
  'physical',
  'mental',
  'notifications',
  'schedule',
  'scoring',
];

export default function Onboarding() {
  const { profile } = useAuth();
  const isCoach = profile?.role === 'coach';

  if (isCoach) {
    return <CoachOnboarding />;
  }
  return <AthleteOnboarding />;
}

// ─── Progress Indicator ────────────────────────────────
function ProgressBar({ currentStep }: { currentStep: OnboardingStep }) {
  const currentIndex = STEP_ORDER.indexOf(currentStep);
  const totalSteps = STEP_ORDER.length;
  const progress = (currentIndex / (totalSteps - 1)) * 100;

  return (
    <View style={progressStyles.container}>
      <View style={progressStyles.track}>
        <View style={[progressStyles.fill, { width: `${progress}%` }]} />
      </View>
      <Text style={progressStyles.text}>
        Step {currentIndex + 1} of {totalSteps}
      </Text>
    </View>
  );
}

const progressStyles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.sm,
  },
  track: {
    height: 4,
    backgroundColor: Colors.border,
    borderRadius: 2,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 2,
  },
  text: {
    fontSize: FontSize.xs,
    color: Colors.textTertiary,
    textAlign: 'right',
    marginTop: 4,
  },
});

// ─── Welcome Step ──────────────────────────────────────
function WelcomeStep({ onContinue }: { onContinue: () => void }) {
  const fadeQuote = useRef(new Animated.Value(0)).current;
  const fadeContent = useRef(new Animated.Value(0)).current;
  const fadeButton = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.timing(fadeQuote, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(fadeContent, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(fadeButton, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <View style={welcomeStyles.container}>
      <View style={welcomeStyles.topSection}>
        <Text style={welcomeStyles.brand}>Deco</Text>
      </View>

      <View style={welcomeStyles.quoteSection}>
        <Animated.View style={{ opacity: fadeQuote }}>
          <Text style={welcomeStyles.quoteMark}>"</Text>
          <Text style={welcomeStyles.quoteText}>
            It's not about the number of hours you practice, it's about the
            number of hours your mind is present during the practice.
          </Text>
          <Text style={welcomeStyles.quoteAuthor}>— Kobe Bryant</Text>
        </Animated.View>
      </View>

      <Animated.View style={[welcomeStyles.messageSection, { opacity: fadeContent }]}>
        <Text style={welcomeStyles.messageTitle}>Development starts with awareness</Text>
        <Text style={welcomeStyles.messageText}>
          Coaches set focus points that get forgotten within weeks. Deco keeps
          your development goals front and center — so every training session
          counts.
        </Text>
        <View style={welcomeStyles.points}>
          <View style={welcomeStyles.point}>
            <Ionicons name="analytics-outline" size={20} color={Colors.primaryLight} />
            <Text style={welcomeStyles.pointText}>Track your skills over time</Text>
          </View>
          <View style={welcomeStyles.point}>
            <Ionicons name="flag-outline" size={20} color={Colors.primaryLight} />
            <Text style={welcomeStyles.pointText}>Set focused development goals</Text>
          </View>
          <View style={welcomeStyles.point}>
            <Ionicons name="chatbubble-outline" size={20} color={Colors.primaryLight} />
            <Text style={welcomeStyles.pointText}>Stay connected with your coach</Text>
          </View>
        </View>
      </Animated.View>

      <Animated.View style={[welcomeStyles.buttonContainer, { opacity: fadeButton }]}>
        <Button
          title="Get Started"
          onPress={onContinue}
          size="lg"
          style={welcomeStyles.button}
          textStyle={{ color: Colors.primaryDark }}
        />
      </Animated.View>
    </View>
  );
}

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const welcomeStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primaryDark,
    paddingHorizontal: Spacing.lg,
    paddingTop: SCREEN_HEIGHT * 0.08,
    paddingBottom: Spacing.xxl,
  },
  topSection: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  brand: {
    fontSize: 36,
    fontWeight: '800',
    color: Colors.white,
    letterSpacing: -1,
    opacity: 0.9,
  },
  quoteSection: {
    marginBottom: Spacing.xl,
    paddingHorizontal: Spacing.sm,
  },
  quoteMark: {
    fontSize: 60,
    color: Colors.primaryLight,
    fontWeight: '800',
    lineHeight: 60,
    marginBottom: -Spacing.md,
  },
  quoteText: {
    fontSize: FontSize.lg,
    color: Colors.white,
    fontStyle: 'italic',
    lineHeight: 28,
    letterSpacing: 0.3,
  },
  quoteAuthor: {
    fontSize: FontSize.sm,
    color: Colors.primaryLight,
    fontWeight: '600',
    marginTop: Spacing.md,
  },
  messageSection: {
    flex: 1,
    justifyContent: 'center',
  },
  messageTitle: {
    fontSize: FontSize.xl,
    fontWeight: '700',
    color: Colors.white,
    marginBottom: Spacing.sm,
  },
  messageText: {
    fontSize: FontSize.md,
    color: 'rgba(255,255,255,0.75)',
    lineHeight: 24,
    marginBottom: Spacing.lg,
  },
  points: {
    gap: Spacing.md,
  },
  point: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  pointText: {
    fontSize: FontSize.md,
    color: 'rgba(255,255,255,0.85)',
    fontWeight: '500',
  },
  buttonContainer: {
    marginTop: Spacing.lg,
  },
  button: {
    backgroundColor: Colors.white,
  },
});

// ─── Skill Selection Step ──────────────────────────────
function SkillSelectionStep({
  category,
  skills,
  selectedIds,
  onToggle,
  onContinue,
  onBack,
}: {
  category: (typeof SKILL_CATEGORIES)[0];
  skills: SkillDefinition[];
  selectedIds: string[];
  onToggle: (skillId: string) => void;
  onContinue: () => void;
  onBack: () => void;
}) {
  const categorySkills = skills.filter((s) => s.category === category.key);
  const selectedCount = categorySkills.filter((s) => selectedIds.includes(s.id)).length;
  const canContinue = selectedCount >= category.minSelection;
  const atMax = selectedCount >= category.maxSelection;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <View style={styles.categoryIconContainer}>
          <Ionicons name={category.icon as any} size={32} color={Colors.primary} />
        </View>
        <Text style={styles.title}>{category.label}</Text>
        <Text style={styles.description}>
          {category.description}. Pick at least {category.minSelection} and up to{' '}
          {category.maxSelection} skills that are relevant to your position or playing style.
        </Text>
        <View style={styles.selectionCounter}>
          <Text style={[styles.counterText, canContinue && styles.counterTextValid]}>
            {selectedCount} of {category.minSelection}-{category.maxSelection} selected
          </Text>
        </View>
      </View>

      <View style={styles.skillList}>
        {categorySkills.map((skill) => {
          const isSelected = selectedIds.includes(skill.id);
          const isDisabled = !isSelected && atMax;

          return (
            <TouchableOpacity
              key={skill.id}
              style={[
                styles.skillItem,
                isSelected && styles.skillItemSelected,
                isDisabled && styles.skillItemDisabled,
              ]}
              onPress={() => !isDisabled && onToggle(skill.id)}
              activeOpacity={isDisabled ? 1 : 0.7}
            >
              <View style={styles.skillItemLeft}>
                <Ionicons
                  name={skill.icon as any}
                  size={20}
                  color={isSelected ? Colors.primary : Colors.textTertiary}
                />
                <View style={styles.skillItemText}>
                  <Text style={[styles.skillName, isSelected && styles.skillNameSelected]}>
                    {skill.label}
                  </Text>
                  <Text style={styles.skillDesc}>{skill.description}</Text>
                </View>
              </View>
              <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
                {isSelected && <Ionicons name="checkmark" size={16} color={Colors.white} />}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={styles.buttonRow}>
        <Button title="Back" onPress={onBack} variant="outline" style={{ flex: 1 }} />
        <Button
          title="Continue"
          onPress={onContinue}
          disabled={!canContinue}
          style={{ flex: 1 }}
        />
      </View>
    </ScrollView>
  );
}

// ─── Notification Step ─────────────────────────────────
function NotificationStep({
  onContinue,
  onBack,
}: {
  onContinue: () => void;
  onBack: () => void;
}) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleEnable = async () => {
    setLoading(true);
    try {
      if (Device.isDevice) {
        const { status } = await Notifications.requestPermissionsAsync();
        if (status === 'granted') {
          const projectId = Constants.expoConfig?.extra?.eas?.projectId;
          const tokenData = await Notifications.getExpoPushTokenAsync({ projectId });

          if (Platform.OS === 'android') {
            await Notifications.setNotificationChannelAsync('default', {
              name: 'Default',
              importance: Notifications.AndroidImportance.MAX,
              vibrationPattern: [0, 250, 250, 250],
            });
          }

          // Save token to profile
          if (user) {
            await supabase
              .from('profiles')
              .update({ push_token: tokenData.data })
              .eq('id', user.id);
          }
        }
      }
    } catch (e) {
      console.log('Notification setup error:', e);
    }
    setLoading(false);
    onContinue();
  };

  return (
    <View style={notifStyles.container}>
      <View style={notifStyles.iconContainer}>
        <Ionicons name="notifications" size={64} color={Colors.primary} />
      </View>

      <Text style={notifStyles.title}>Stay on track with reminders</Text>
      <Text style={notifStyles.subtitle}>
        The core of Deco is keeping your development goals top of mind. Notifications make sure
        you never forget what you're working on.
      </Text>

      <View style={notifStyles.benefits}>
        <View style={notifStyles.benefitRow}>
          <View style={notifStyles.benefitIcon}>
            <Ionicons name="time-outline" size={20} color={Colors.primary} />
          </View>
          <View style={notifStyles.benefitText}>
            <Text style={notifStyles.benefitTitle}>Before training</Text>
            <Text style={notifStyles.benefitDesc}>Your focus points for today's session</Text>
          </View>
        </View>
        <View style={notifStyles.benefitRow}>
          <View style={notifStyles.benefitIcon}>
            <Ionicons name="clipboard-outline" size={20} color={Colors.primary} />
          </View>
          <View style={notifStyles.benefitText}>
            <Text style={notifStyles.benefitTitle}>After sessions</Text>
            <Text style={notifStyles.benefitDesc}>Quick 2-minute reflection while it's fresh</Text>
          </View>
        </View>
        <View style={notifStyles.benefitRow}>
          <View style={notifStyles.benefitIcon}>
            <Ionicons name="sparkles-outline" size={20} color={Colors.primary} />
          </View>
          <View style={notifStyles.benefitText}>
            <Text style={notifStyles.benefitTitle}>Motivation</Text>
            <Text style={notifStyles.benefitDesc}>Stay inspired between sessions</Text>
          </View>
        </View>
      </View>

      <View style={notifStyles.buttons}>
        <Button
          title="Enable Notifications"
          onPress={handleEnable}
          loading={loading}
          size="lg"
          icon={<Ionicons name="notifications-outline" size={18} color={Colors.white} />}
        />
        <TouchableOpacity onPress={onContinue} style={notifStyles.skipButton}>
          <Text style={notifStyles.skipText}>Maybe Later</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const notifStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xxl + Spacing.xl,
    justifyContent: 'center',
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  title: {
    fontSize: FontSize.xxl,
    fontWeight: '800',
    color: Colors.text,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  subtitle: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: Spacing.xl,
  },
  benefits: {
    gap: Spacing.lg,
    marginBottom: Spacing.xxl,
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  benefitIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
  },
  benefitText: {
    flex: 1,
  },
  benefitTitle: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 2,
  },
  benefitDesc: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  buttons: {
    gap: Spacing.md,
  },
  skipButton: {
    alignItems: 'center',
    paddingVertical: Spacing.md,
  },
  skipText: {
    fontSize: FontSize.md,
    color: Colors.textTertiary,
    fontWeight: '500',
  },
});

// ─── Schedule Step ─────────────────────────────────────
interface ScheduleEntry {
  day_of_week: number;
  start_time: string;
  end_time: string;
  session_type: ScheduleSessionType;
  label: string;
}

function ScheduleStep({
  onContinue,
  onBack,
  scheduleEntries,
  setScheduleEntries,
}: {
  onContinue: () => void;
  onBack: () => void;
  scheduleEntries: ScheduleEntry[];
  setScheduleEntries: React.Dispatch<React.SetStateAction<ScheduleEntry[]>>;
}) {
  const [showTimePicker, setShowTimePicker] = useState<{
    day: number;
    field: 'start' | 'end';
  } | null>(null);
  const [pendingDay, setPendingDay] = useState<number | null>(null);

  const addSession = (day: number) => {
    if (scheduleEntries.some((e) => e.day_of_week === day)) return;
    setScheduleEntries((prev) => [
      ...prev,
      {
        day_of_week: day,
        start_time: '18:00',
        end_time: '19:30',
        session_type: 'training',
        label: 'Training',
      },
    ]);
  };

  const removeSession = (day: number) => {
    setScheduleEntries((prev) => prev.filter((e) => e.day_of_week !== day));
  };

  const updateSession = (day: number, field: keyof ScheduleEntry, value: string) => {
    setScheduleEntries((prev) =>
      prev.map((e) => (e.day_of_week === day ? { ...e, [field]: value } : e))
    );
  };

  const handleTimeChange = (_: any, date: Date | undefined) => {
    if (Platform.OS !== 'ios') {
      setShowTimePicker(null);
    }
    if (date && showTimePicker) {
      const timeStr = `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
      updateSession(showTimePicker.day, showTimePicker.field === 'start' ? 'start_time' : 'end_time', timeStr);
    }
  };

  const parseTime = (time: string): Date => {
    const [h, m] = time.split(':').map(Number);
    const d = new Date();
    d.setHours(h, m, 0, 0);
    return d;
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Ionicons name="calendar" size={32} color={Colors.primary} />
        <Text style={styles.title}>When do you train?</Text>
        <Text style={styles.description}>
          Set your weekly schedule so Deco can send reminders at the right time.
          Tap a day to add a session.
        </Text>
      </View>

      <View style={schedStyles.weekGrid}>
        {DAY_LABELS.map((label, index) => {
          const hasSession = scheduleEntries.some((e) => e.day_of_week === index);
          return (
            <TouchableOpacity
              key={index}
              style={[schedStyles.dayChip, hasSession && schedStyles.dayChipActive]}
              onPress={() => (hasSession ? removeSession(index) : addSession(index))}
            >
              <Text style={[schedStyles.dayLabel, hasSession && schedStyles.dayLabelActive]}>
                {label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {scheduleEntries
        .sort((a, b) => a.day_of_week - b.day_of_week)
        .map((entry) => (
          <View key={entry.day_of_week} style={schedStyles.sessionCard}>
            <View style={schedStyles.sessionHeader}>
              <Text style={schedStyles.sessionDay}>
                {DAY_LABELS_FULL[entry.day_of_week]}
              </Text>
              <TouchableOpacity onPress={() => removeSession(entry.day_of_week)}>
                <Ionicons name="close-circle" size={20} color={Colors.textTertiary} />
              </TouchableOpacity>
            </View>

            <View style={schedStyles.typeRow}>
              {(['training', 'match', 'gym'] as ScheduleSessionType[]).map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[
                    schedStyles.typeChip,
                    entry.session_type === type && schedStyles.typeChipActive,
                  ]}
                  onPress={() => {
                    updateSession(entry.day_of_week, 'session_type', type);
                    updateSession(
                      entry.day_of_week,
                      'label',
                      type.charAt(0).toUpperCase() + type.slice(1)
                    );
                  }}
                >
                  <Text
                    style={[
                      schedStyles.typeText,
                      entry.session_type === type && schedStyles.typeTextActive,
                    ]}
                  >
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={schedStyles.timeRow}>
              <TouchableOpacity
                style={schedStyles.timeButton}
                onPress={() => setShowTimePicker({ day: entry.day_of_week, field: 'start' })}
              >
                <Ionicons name="time-outline" size={16} color={Colors.primary} />
                <Text style={schedStyles.timeText}>{entry.start_time}</Text>
              </TouchableOpacity>
              <Text style={schedStyles.timeSeparator}>—</Text>
              <TouchableOpacity
                style={schedStyles.timeButton}
                onPress={() => setShowTimePicker({ day: entry.day_of_week, field: 'end' })}
              >
                <Text style={schedStyles.timeText}>{entry.end_time}</Text>
              </TouchableOpacity>
            </View>

            {showTimePicker?.day === entry.day_of_week && (
              <DateTimePicker
                value={parseTime(
                  showTimePicker.field === 'start' ? entry.start_time : entry.end_time
                )}
                mode="time"
                is24Hour={true}
                onChange={handleTimeChange}
              />
            )}
          </View>
        ))}

      {scheduleEntries.length === 0 && (
        <View style={schedStyles.emptyState}>
          <Ionicons name="calendar-outline" size={40} color={Colors.textTertiary} />
          <Text style={schedStyles.emptyText}>Tap the days above when you train</Text>
        </View>
      )}

      <TouchableOpacity style={schedStyles.calendarImport} disabled>
        <Ionicons name="cloud-download-outline" size={20} color={Colors.textTertiary} />
        <Text style={schedStyles.calendarImportText}>Import from Calendar</Text>
        <View style={schedStyles.comingSoonBadge}>
          <Text style={schedStyles.comingSoonText}>Coming Soon</Text>
        </View>
      </TouchableOpacity>

      <View style={styles.buttonRow}>
        <Button title="Back" onPress={onBack} variant="outline" style={{ flex: 1 }} />
        <Button title="Continue" onPress={onContinue} style={{ flex: 1 }} />
      </View>
    </ScrollView>
  );
}

const schedStyles = StyleSheet.create({
  weekGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.lg,
    gap: 4,
  },
  dayChip: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.surfaceSecondary,
  },
  dayChipActive: {
    backgroundColor: Colors.primary,
  },
  dayLabel: {
    fontSize: FontSize.xs,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  dayLabelActive: {
    color: Colors.white,
  },
  sessionCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  sessionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  sessionDay: {
    fontSize: FontSize.md,
    fontWeight: '700',
    color: Colors.text,
  },
  typeRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  typeChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surfaceSecondary,
  },
  typeChipActive: {
    backgroundColor: Colors.primary + '20',
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  typeText: {
    fontSize: FontSize.xs,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
  typeTextActive: {
    color: Colors.primary,
    fontWeight: '600',
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  timeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    backgroundColor: Colors.surfaceSecondary,
    borderRadius: BorderRadius.sm,
  },
  timeText: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.text,
  },
  timeSeparator: {
    fontSize: FontSize.md,
    color: Colors.textTertiary,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: Spacing.xxl,
    gap: Spacing.sm,
  },
  emptyText: {
    fontSize: FontSize.sm,
    color: Colors.textTertiary,
  },
  calendarImport: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    marginTop: Spacing.md,
    marginBottom: Spacing.md,
    opacity: 0.5,
  },
  calendarImportText: {
    fontSize: FontSize.sm,
    color: Colors.textTertiary,
  },
  comingSoonBadge: {
    backgroundColor: Colors.surfaceSecondary,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  comingSoonText: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.textTertiary,
  },
});

// ─── Scoring Step ──────────────────────────────────────
function ScoringStep({
  selectedSkills,
  scores,
  onScore,
  onComplete,
  onBack,
  loading,
}: {
  selectedSkills: SkillDefinition[];
  scores: Record<string, number>;
  onScore: (skillId: string, value: number) => void;
  onComplete: () => void;
  onBack: () => void;
  loading: boolean;
}) {
  // Group skills by category
  const grouped = SKILL_CATEGORIES.map((cat) => ({
    category: cat,
    skills: selectedSkills.filter((s) => s.category === cat.key),
  })).filter((g) => g.skills.length > 0);

  // Build radar chart data
  const radarSkills: RadarSkill[] = selectedSkills.map((s) => ({
    label: s.label,
    score: scores[s.id] ?? 5,
  }));

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>Rate Your Skills</Text>
        <Text style={styles.description}>
          Score yourself on each skill from 1 to 10. Be honest — this is your
          starting point for growth.
        </Text>
      </View>

      <View style={styles.chartContainer}>
        <RadarChart skills={radarSkills} size={260} />
      </View>

      {grouped.map(({ category, skills }) => (
        <View key={category.key} style={scoringStyles.categorySection}>
          <View style={scoringStyles.categoryHeader}>
            <Ionicons name={category.icon as any} size={16} color={Colors.primary} />
            <Text style={scoringStyles.categoryLabel}>{category.label}</Text>
          </View>
          {skills.map((skill) => (
            <View key={skill.id} style={styles.sliderRow}>
              <View style={styles.sliderHeader}>
                <View style={styles.sliderLabel}>
                  <Ionicons name={skill.icon as any} size={18} color={Colors.primary} />
                  <Text style={styles.sliderName}>{skill.label}</Text>
                </View>
                <View style={styles.scoreBadge}>
                  <Text style={styles.scoreText}>{scores[skill.id] ?? 5}</Text>
                </View>
              </View>
              <Text style={styles.sliderDesc}>{skill.description}</Text>
              <Slider
                style={styles.slider}
                minimumValue={1}
                maximumValue={10}
                step={1}
                value={scores[skill.id] ?? 5}
                onValueChange={(v) => onScore(skill.id, Math.round(v))}
                minimumTrackTintColor={Colors.primary}
                maximumTrackTintColor={Colors.border}
                thumbTintColor={Colors.primary}
              />
            </View>
          ))}
        </View>
      ))}

      <View style={styles.buttonRow}>
        <Button title="Back" onPress={onBack} variant="outline" style={{ flex: 1 }} />
        <Button
          title="Complete Profile"
          onPress={onComplete}
          loading={loading}
          style={{ flex: 1 }}
        />
      </View>
    </ScrollView>
  );
}

const scoringStyles = StyleSheet.create({
  categorySection: {
    marginBottom: Spacing.md,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
    paddingBottom: Spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  categoryLabel: {
    fontSize: FontSize.sm,
    fontWeight: '700',
    color: Colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});

// ─── Athlete Onboarding (Main Component) ───────────────
function AthleteOnboarding() {
  const [step, setStep] = useState<OnboardingStep>('welcome');
  const [selectedSkillIds, setSelectedSkillIds] = useState<string[]>([]);
  const [scores, setScores] = useState<Record<string, number>>({});
  const [scheduleEntries, setScheduleEntries] = useState<ScheduleEntry[]>([]);

  const { data: allSkills = [] } = useSkillDefinitions();
  const saveSelectedSkills = useSaveSelectedSkills();
  const saveSkillScores = useSaveSkillScores();
  const saveTrainingSchedule = useSaveTrainingSchedule();
  const generateSessions = useGenerateUpcomingSessions();
  const completeOnboarding = useUpdateOnboardingComplete();

  const toggleSkill = (skillId: string) => {
    setSelectedSkillIds((prev) =>
      prev.includes(skillId) ? prev.filter((id) => id !== skillId) : [...prev, skillId]
    );
  };

  const handleScore = (skillId: string, value: number) => {
    setScores((prev) => ({ ...prev, [skillId]: value }));
  };

  const goToStep = (nextStep: OnboardingStep) => {
    setStep(nextStep);
  };

  const goBack = () => {
    const currentIndex = STEP_ORDER.indexOf(step);
    if (currentIndex > 0) {
      setStep(STEP_ORDER[currentIndex - 1]);
    }
  };

  const goForward = () => {
    const currentIndex = STEP_ORDER.indexOf(step);
    if (currentIndex < STEP_ORDER.length - 1) {
      setStep(STEP_ORDER[currentIndex + 1]);
    }
  };

  const handleComplete = async () => {
    try {
      // 1. Save selected skills
      await saveSelectedSkills.mutateAsync(selectedSkillIds);

      // 2. Save skill scores
      const scoreEntries = selectedSkillIds.map((skill_id) => ({
        skill_id,
        score: scores[skill_id] ?? 5,
      }));
      await saveSkillScores.mutateAsync(scoreEntries);

      // 3. Save training schedule
      if (scheduleEntries.length > 0) {
        await saveTrainingSchedule.mutateAsync(
          scheduleEntries.map((e) => ({
            day_of_week: e.day_of_week,
            start_time: e.start_time,
            end_time: e.end_time,
            session_type: e.session_type,
            label: e.label,
          }))
        );
      }

      // 4. Complete onboarding
      await completeOnboarding.mutateAsync();
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  const loading =
    saveSelectedSkills.isPending ||
    saveSkillScores.isPending ||
    saveTrainingSchedule.isPending ||
    completeOnboarding.isPending;

  if (step === 'welcome') {
    return <WelcomeStep onContinue={goForward} />;
  }

  // Skill selection steps
  const categorySteps: OnboardingStep[] = ['technical', 'tactical', 'physical', 'mental'];
  if (categorySteps.includes(step)) {
    const category = SKILL_CATEGORIES.find((c) => c.key === (step as SkillCategory))!;
    return (
      <View style={{ flex: 1, backgroundColor: Colors.background }}>
        <ProgressBar currentStep={step} />
        <SkillSelectionStep
          category={category}
          skills={allSkills}
          selectedIds={selectedSkillIds}
          onToggle={toggleSkill}
          onContinue={goForward}
          onBack={goBack}
        />
      </View>
    );
  }

  if (step === 'notifications') {
    return (
      <View style={{ flex: 1, backgroundColor: Colors.background }}>
        <ProgressBar currentStep={step} />
        <NotificationStep onContinue={goForward} onBack={goBack} />
      </View>
    );
  }

  if (step === 'schedule') {
    return (
      <View style={{ flex: 1, backgroundColor: Colors.background }}>
        <ProgressBar currentStep={step} />
        <ScheduleStep
          onContinue={goForward}
          onBack={goBack}
          scheduleEntries={scheduleEntries}
          setScheduleEntries={setScheduleEntries}
        />
      </View>
    );
  }

  // Scoring step
  const selectedSkills = allSkills.filter((s) => selectedSkillIds.includes(s.id));
  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      <ProgressBar currentStep={step} />
      <ScoringStep
        selectedSkills={selectedSkills}
        scores={scores}
        onScore={handleScore}
        onComplete={handleComplete}
        onBack={goBack}
        loading={loading}
      />
    </View>
  );
}

// ─── Coach Onboarding ──────────────────────────────────
function CoachOnboarding() {
  const [teamName, setTeamName] = useState('');
  const createTeam = useCreateTeam();
  const completeOnboarding = useUpdateOnboardingComplete();

  const handleComplete = async () => {
    if (!teamName.trim()) {
      Alert.alert('Error', 'Please enter a team name');
      return;
    }

    try {
      await createTeam.mutateAsync(teamName.trim());
      await completeOnboarding.mutateAsync();
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  const loading = createTeam.isPending || completeOnboarding.isPending;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>Set Up Your Team</Text>
        <Text style={styles.description}>
          Create your team and share the invite code with your athletes so they
          can connect with you.
        </Text>
      </View>

      <View style={styles.teamForm}>
        <Ionicons name="people" size={64} color={Colors.primary} style={styles.teamIcon} />
        <Input
          label="Team Name"
          placeholder="e.g., HC Amsterdam Ladies 1"
          value={teamName}
          onChangeText={setTeamName}
        />
        <Text style={styles.teamHint}>
          After creating your team, you'll get an invite code to share with your
          athletes.
        </Text>
      </View>

      <Button
        title="Create Team"
        onPress={handleComplete}
        loading={loading}
        size="lg"
        style={styles.completeButton}
      />
    </ScrollView>
  );
}

// ─── Shared Styles ─────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
  header: {
    marginBottom: Spacing.lg,
    alignItems: 'center',
  },
  categoryIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  title: {
    fontSize: FontSize.xxl,
    fontWeight: '800',
    color: Colors.text,
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  description: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    lineHeight: 24,
    textAlign: 'center',
  },
  selectionCounter: {
    marginTop: Spacing.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surfaceSecondary,
  },
  counterText: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.textTertiary,
  },
  counterTextValid: {
    color: Colors.primary,
  },
  skillList: {
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  skillItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.md,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  skillItemSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary + '08',
  },
  skillItemDisabled: {
    opacity: 0.4,
  },
  skillItemLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  skillItemText: {
    flex: 1,
  },
  skillName: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: Colors.text,
  },
  skillNameSelected: {
    color: Colors.primary,
  },
  skillDesc: {
    fontSize: FontSize.xs,
    color: Colors.textTertiary,
    marginTop: 2,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  chartContainer: {
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  sliderRow: {
    backgroundColor: Colors.surface,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
  },
  sliderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  sliderLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  sliderName: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: Colors.text,
  },
  scoreBadge: {
    backgroundColor: Colors.primary,
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreText: {
    color: Colors.white,
    fontSize: FontSize.sm,
    fontWeight: '700',
  },
  sliderDesc: {
    fontSize: FontSize.xs,
    color: Colors.textTertiary,
    marginBottom: Spacing.xs,
  },
  slider: {
    width: '100%',
    height: 36,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.lg,
  },
  completeButton: {
    marginTop: Spacing.md,
  },
  teamForm: {
    alignItems: 'center',
    marginTop: Spacing.xl,
  },
  teamIcon: {
    marginBottom: Spacing.lg,
  },
  teamHint: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginTop: Spacing.sm,
  },
});
