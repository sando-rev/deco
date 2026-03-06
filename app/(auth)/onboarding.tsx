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
  TextInput,
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
import { useUpdateOnboardingComplete, useSavePosition, useSaveDefaultMatchDay } from '../../src/hooks/useProfile';
import { useSkillDefinitionsForPosition, useSaveSelectedSkills, useSaveSkillScores, useCreateCustomSkill } from '../../src/hooks/useSkills';
import { useSaveTrainingSchedule, useGenerateUpcomingSessions } from '../../src/hooks/useSchedule';
import { useCreateTeam, useJoinTeam } from '../../src/hooks/useTeam';
import { SKILL_CATEGORIES, DAY_LABELS, DAY_LABELS_FULL, DISPLAY_DAY_ORDER, dayOfWeekToDisplayIndex } from '../../src/constants/skills';
import { Colors, Spacing, FontSize, BorderRadius } from '../../src/constants/theme';
import { PositionType, SkillCategory, SkillDefinition, SkillPositionType, ScheduleSessionType, TrainingSchedule } from '../../src/types/database';
import { supabase } from '../../src/services/supabase';
import { useCreateGoal, useGetGoalFeedback } from '../../src/hooks/useGoals';
import { addWeeks, format } from 'date-fns';
import { nl, enUS as enLocale } from 'date-fns/locale';
import { GoalAnalysisCard } from '../../src/components/GoalAnalysisCard';
import { useTranslation } from 'react-i18next';

type OnboardingStep =
  | 'welcome'
  | 'position'
  | 'technical'
  | 'tactical'
  | 'physical'
  | 'mental'
  | 'notifications'
  | 'schedule'
  | 'scoring'
  | 'goal';

const STEP_ORDER: OnboardingStep[] = [
  'welcome',
  'position',
  'technical',
  'tactical',
  'physical',
  'mental',
  'notifications',
  'schedule',
  'scoring',
  'goal',
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
  const { t } = useTranslation();
  const currentIndex = STEP_ORDER.indexOf(currentStep);
  const totalSteps = STEP_ORDER.length;
  const progress = (currentIndex / (totalSteps - 1)) * 100;

  return (
    <View style={progressStyles.container}>
      <View style={progressStyles.track}>
        <View style={[progressStyles.fill, { width: `${progress}%` }]} />
      </View>
      <Text style={progressStyles.text}>
        {t('onboarding.stepOf', { step: currentIndex + 1, total: totalSteps })}
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
  const { t } = useTranslation();
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
            It's not about the number of hours you practice, it's about the number of hours your mind is present during the practice.
          </Text>
          <Text style={welcomeStyles.quoteAuthor}>— Kobe Bryant</Text>
        </Animated.View>
      </View>

      <Animated.View style={[welcomeStyles.messageSection, { opacity: fadeContent }]}>
        <Text style={welcomeStyles.messageTitle}>{t('onboarding.welcomeTitle')}</Text>
        <Text style={welcomeStyles.messageText}>
          {t('onboarding.welcomeMessage')}
        </Text>
        <View style={welcomeStyles.points}>
          <View style={welcomeStyles.point}>
            <Ionicons name="analytics-outline" size={20} color={Colors.primaryLight} />
            <Text style={welcomeStyles.pointText}>{t('onboarding.welcomePoint1')}</Text>
          </View>
          <View style={welcomeStyles.point}>
            <Ionicons name="flag-outline" size={20} color={Colors.primaryLight} />
            <Text style={welcomeStyles.pointText}>{t('onboarding.welcomePoint2')}</Text>
          </View>
          <View style={welcomeStyles.point}>
            <Ionicons name="chatbubble-outline" size={20} color={Colors.primaryLight} />
            <Text style={welcomeStyles.pointText}>{t('onboarding.welcomePoint3')}</Text>
          </View>
        </View>
      </Animated.View>

      <Animated.View style={[welcomeStyles.buttonContainer, { opacity: fadeButton }]}>
        <Button
          title={t('onboarding.getStarted')}
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

// ─── Position Selection Step ────────────────────────────
function PositionSelectionStep({
  onSelect,
}: {
  onSelect: (position: PositionType) => void;
}) {
  const { t } = useTranslation();
  return (
    <View style={positionStyles.container}>
      <View style={positionStyles.header}>
        <Ionicons name="person-circle-outline" size={48} color={Colors.primary} />
        <Text style={positionStyles.title}>{t('onboarding.positionTitle')}</Text>
        <Text style={positionStyles.subtitle}>
          {t('onboarding.positionSubtitle')}
        </Text>
      </View>

      <View style={positionStyles.cardRow}>
        <TouchableOpacity
          style={positionStyles.card}
          onPress={() => onSelect('outfield')}
          activeOpacity={0.75}
        >
          <View style={positionStyles.cardIconContainer}>
            <Ionicons name="football-outline" size={48} color={Colors.primary} />
          </View>
          <Text style={positionStyles.cardTitle}>{t('onboarding.outfield')}</Text>
          <Text style={positionStyles.cardDesc}>
            {t('onboarding.outfieldDesc')}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={positionStyles.card}
          onPress={() => onSelect('goalkeeper')}
          activeOpacity={0.75}
        >
          <View style={positionStyles.cardIconContainer}>
            <Ionicons name="shield-outline" size={48} color={Colors.primary} />
          </View>
          <Text style={positionStyles.cardTitle}>{t('onboarding.goalkeeper')}</Text>
          <Text style={positionStyles.cardDesc}>
            {t('onboarding.goalkeeperDesc')}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const positionStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xxl,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: Spacing.xxl,
    gap: Spacing.sm,
  },
  title: {
    fontSize: FontSize.xxl,
    fontWeight: '800',
    color: Colors.text,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  cardRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  card: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    borderWidth: 2,
    borderColor: Colors.border,
    paddingVertical: Spacing.xl,
    paddingHorizontal: Spacing.md,
    alignItems: 'center',
    gap: Spacing.sm,
  },
  cardIconContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  cardTitle: {
    fontSize: FontSize.lg,
    fontWeight: '800',
    color: Colors.text,
  },
  cardDesc: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
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
  position,
  onSkillCreated,
}: {
  category: (typeof SKILL_CATEGORIES)[0];
  skills: SkillDefinition[];
  selectedIds: string[];
  onToggle: (skillId: string) => void;
  onContinue: () => void;
  onBack: () => void;
  position: PositionType;
  onSkillCreated: (skill: SkillDefinition) => void;
}) {
  const { t } = useTranslation();
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [customLabel, setCustomLabel] = useState('');
  const [customDescription, setCustomDescription] = useState('');
  const createCustomSkill = useCreateCustomSkill();

  const categorySkills = skills.filter((s) => s.category === category.key);
  const selectedCount = categorySkills.filter((s) => selectedIds.includes(s.id)).length;
  const canContinue = selectedCount >= category.minSelection;
  const atMax = selectedCount >= category.maxSelection;

  const hasCustomInCategory = categorySkills.some((s) => s.created_by_athlete_id !== null);

  const handleAddCustomSkill = async () => {
    if (!customLabel.trim()) return;
    try {
      const newSkill = await createCustomSkill.mutateAsync({
        label: customLabel.trim(),
        description: customDescription.trim(),
        category: category.key,
        position_type: position as SkillPositionType,
      });
      onSkillCreated(newSkill);
      onToggle(newSkill.id);
      setCustomLabel('');
      setCustomDescription('');
      setShowCustomForm(false);
    } catch (error: any) {
      Alert.alert(t('common.error'), error.message ?? t('onboarding.customSkillError'));
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <View style={styles.categoryIconContainer}>
          <Ionicons name={category.icon as any} size={32} color={Colors.primary} />
        </View>
        <Text style={styles.title}>{category.label}</Text>
        <Text style={styles.description}>
          {category.description}
        </Text>
        <View style={styles.selectionCounter}>
          <Text style={[styles.counterText, canContinue && styles.counterTextValid]}>
            {t('onboarding.selectionCount', { count: selectedCount, min: category.minSelection, max: category.maxSelection })}
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

        {!hasCustomInCategory && !showCustomForm && (
          <TouchableOpacity
            style={customSkillStyles.addButton}
            onPress={() => setShowCustomForm(true)}
            activeOpacity={0.7}
          >
            <Ionicons name="add-circle-outline" size={20} color={Colors.primary} />
            <Text style={customSkillStyles.addButtonText}>{t('onboarding.addCustomSkill')}</Text>
          </TouchableOpacity>
        )}

        {showCustomForm && (
          <View style={customSkillStyles.formContainer}>
            <TextInput
              style={customSkillStyles.input}
              placeholder={t('onboarding.skillName')}
              placeholderTextColor={Colors.textTertiary}
              value={customLabel}
              onChangeText={setCustomLabel}
              autoFocus
            />
            <TextInput
              style={customSkillStyles.input}
              placeholder={t('onboarding.skillDescription')}
              placeholderTextColor={Colors.textTertiary}
              value={customDescription}
              onChangeText={setCustomDescription}
            />
            <View style={customSkillStyles.formButtonRow}>
              <TouchableOpacity
                style={customSkillStyles.cancelButton}
                onPress={() => {
                  setShowCustomForm(false);
                  setCustomLabel('');
                  setCustomDescription('');
                }}
                activeOpacity={0.7}
              >
                <Text style={customSkillStyles.cancelButtonText}>{t('common.cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  customSkillStyles.submitButton,
                  (!customLabel.trim() || createCustomSkill.isPending) &&
                    customSkillStyles.submitButtonDisabled,
                ]}
                onPress={handleAddCustomSkill}
                disabled={!customLabel.trim() || createCustomSkill.isPending}
                activeOpacity={0.7}
              >
                <Text style={customSkillStyles.submitButtonText}>
                  {createCustomSkill.isPending ? t('common.loading') : t('common.add')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>

      <View style={styles.buttonRow}>
        <Button title={t('common.back')} onPress={onBack} variant="outline" style={{ flex: 1 }} />
        <Button
          title={t('common.next')}
          onPress={onContinue}
          disabled={!canContinue}
          style={{ flex: 1 }}
        />
      </View>
    </ScrollView>
  );
}

const customSkillStyles = StyleSheet.create({
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    padding: Spacing.md,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
    borderColor: Colors.primary + '40',
    borderStyle: 'dashed',
  },
  addButtonText: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: Colors.primary,
  },
  formContainer: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
    borderColor: Colors.primary + '40',
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  input: {
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    fontSize: FontSize.md,
    color: Colors.text,
  },
  formButtonRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  },
  cancelButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cancelButtonText: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  submitButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.primary,
  },
  submitButtonDisabled: {
    opacity: 0.4,
  },
  submitButtonText: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.white,
  },
});

// ─── Notification Step ─────────────────────────────────
function NotificationStep({
  onContinue,
  onBack,
}: {
  onContinue: () => void;
  onBack: () => void;
}) {
  const { t } = useTranslation();
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

  const handleSkip = () => {
    Alert.alert(
      t('settings.disableConfirm'),
      t('onboarding.notificationsDesc'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        { text: t('onboarding.skipNotifications'), onPress: onContinue },
      ]
    );
  };

  return (
    <View style={notifStyles.container}>
      <View style={notifStyles.iconContainer}>
        <Ionicons name="notifications" size={64} color={Colors.primary} />
      </View>

      <Text style={notifStyles.title}>{t('onboarding.notifications')}</Text>
      <Text style={notifStyles.subtitle}>
        {t('onboarding.notificationsDesc')}
      </Text>

      <View style={notifStyles.benefits}>
        <View style={notifStyles.benefitRow}>
          <View style={notifStyles.benefitIcon}>
            <Ionicons name="time-outline" size={20} color={Colors.primary} />
          </View>
          <View style={notifStyles.benefitText}>
            <Text style={notifStyles.benefitTitle}>{t('settings.preTraining')}</Text>
            <Text style={notifStyles.benefitDesc}>{t('settings.preTrainingDesc')}</Text>
          </View>
        </View>
        <View style={notifStyles.benefitRow}>
          <View style={notifStyles.benefitIcon}>
            <Ionicons name="clipboard-outline" size={20} color={Colors.primary} />
          </View>
          <View style={notifStyles.benefitText}>
            <Text style={notifStyles.benefitTitle}>{t('settings.postSession')}</Text>
            <Text style={notifStyles.benefitDesc}>{t('settings.postSessionDesc')}</Text>
          </View>
        </View>
        <View style={notifStyles.benefitRow}>
          <View style={notifStyles.benefitIcon}>
            <Ionicons name="sparkles-outline" size={20} color={Colors.primary} />
          </View>
          <View style={notifStyles.benefitText}>
            <Text style={notifStyles.benefitTitle}>{t('settings.motivational')}</Text>
            <Text style={notifStyles.benefitDesc}>{t('settings.motivationalDesc')}</Text>
          </View>
        </View>
      </View>

      <View style={notifStyles.buttons}>
        <Button
          title={t('onboarding.allowNotifications')}
          onPress={handleEnable}
          loading={loading}
          size="lg"
          icon={<Ionicons name="notifications-outline" size={18} color={Colors.white} />}
        />
        <TouchableOpacity onPress={handleSkip} style={notifStyles.skipButton}>
          <Text style={notifStyles.skipText}>{t('onboarding.skipNotifications')}</Text>
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
  defaultMatchDay,
  setDefaultMatchDay,
}: {
  onContinue: () => void;
  onBack: () => void;
  scheduleEntries: ScheduleEntry[];
  setScheduleEntries: React.Dispatch<React.SetStateAction<ScheduleEntry[]>>;
  defaultMatchDay: number | null;
  setDefaultMatchDay: (day: number | null) => void;
}) {
  const { t } = useTranslation();
  const [showTimePicker, setShowTimePicker] = useState<{
    day: number;
    field: 'start' | 'end';
  } | null>(null);

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

  const sortedEntries = [...scheduleEntries].sort(
    (a, b) => dayOfWeekToDisplayIndex(a.day_of_week) - dayOfWeekToDisplayIndex(b.day_of_week)
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Ionicons name="calendar" size={32} color={Colors.primary} />
        <Text style={styles.title}>{t('onboarding.scheduleTitle')}</Text>
        <Text style={styles.description}>
          {t('onboarding.scheduleDesc')}
        </Text>
      </View>

      <View style={schedStyles.weekGrid}>
        {DISPLAY_DAY_ORDER.map((dayOfWeek) => {
          const hasSession = scheduleEntries.some((e) => e.day_of_week === dayOfWeek);
          return (
            <TouchableOpacity
              key={dayOfWeek}
              style={[schedStyles.dayChip, hasSession && schedStyles.dayChipActive]}
              onPress={() => (hasSession ? removeSession(dayOfWeek) : addSession(dayOfWeek))}
            >
              <Text style={[schedStyles.dayLabel, hasSession && schedStyles.dayLabelActive]}>
                {DAY_LABELS[dayOfWeek]}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {sortedEntries.map((entry) => (
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
          <Text style={schedStyles.emptyText}>{t('onboarding.scheduleDesc')}</Text>
        </View>
      )}

      <View style={schedStyles.matchDaySection}>
        <Text style={schedStyles.matchDayTitle}>{t('settings.defaultMatchDay')}</Text>
        <View style={schedStyles.weekGrid}>
          {DISPLAY_DAY_ORDER.map((dayOfWeek) => {
            const isSelected = defaultMatchDay === dayOfWeek;
            return (
              <TouchableOpacity
                key={dayOfWeek}
                style={[schedStyles.dayChip, isSelected && schedStyles.dayChipActive]}
                onPress={() => setDefaultMatchDay(isSelected ? null : dayOfWeek)}
              >
                <Text style={[schedStyles.dayLabel, isSelected && schedStyles.dayLabelActive]}>
                  {DAY_LABELS[dayOfWeek]}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <TouchableOpacity style={schedStyles.calendarImport} disabled>
        <Ionicons name="cloud-download-outline" size={20} color={Colors.textTertiary} />
        <Text style={schedStyles.calendarImportText}>{t('settings.importIcs')}</Text>
        <View style={schedStyles.comingSoonBadge}>
          <Text style={schedStyles.comingSoonText}>Binnenkort</Text>
        </View>
      </TouchableOpacity>

      <View style={styles.buttonRow}>
        <Button title={t('common.back')} onPress={onBack} variant="outline" style={{ flex: 1 }} />
        <Button title={t('common.next')} onPress={onContinue} style={{ flex: 1 }} />
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
  matchDaySection: {
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  matchDayTitle: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: Spacing.md,
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
  const { t } = useTranslation();
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
        <Text style={styles.title}>{t('onboarding.scoringTitle')}</Text>
        <Text style={styles.description}>
          {t('onboarding.scoringDesc')}
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
        <Button title={t('common.back')} onPress={onBack} variant="outline" style={{ flex: 1 }} />
        <Button
          title={t('common.next')}
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

// ─── Goal Setting Step ──────────────────────────────────
function GoalSettingStep({
  selectedSkills,
  scores,
  position,
  onComplete,
  onBack,
}: {
  selectedSkills: SkillDefinition[];
  scores: Record<string, number>;
  position: PositionType | null;
  onComplete: () => void;
  onBack: () => void;
}) {
  const { t, i18n } = useTranslation();
  // Find the lowest scored skill
  const lowestSkill = selectedSkills.length > 0
    ? selectedSkills.reduce((lowest, skill) => {
        const lowestScore = scores[lowest.id] ?? 5;
        const currentScore = scores[skill.id] ?? 5;
        return currentScore < lowestScore ? skill : lowest;
      }, selectedSkills[0])
    : null;

  const [selectedSkillId, setSelectedSkillId] = useState<string>(lowestSkill?.id ?? '');
  const [goalDescription, setGoalDescription] = useState('');
  const [goalSaved, setGoalSaved] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<any>(null);
  const [deadline, setDeadline] = useState<Date>(addWeeks(new Date(), 4));
  const [showDatePicker, setShowDatePicker] = useState(false);

  const createGoal = useCreateGoal();
  const getGoalFeedback = useGetGoalFeedback();

  const selectedSkillForGoal = selectedSkills.find((s) => s.id === selectedSkillId);

  const handleGetFeedback = async () => {
    if (!goalDescription.trim()) {
      Alert.alert(t('onboarding.fillGoal'), t('onboarding.fillGoalFirst'));
      return;
    }
    try {
      const result = await getGoalFeedback.mutateAsync({
        description: goalDescription,
        athlete_skills: selectedSkills.map((s) => s.label),
      });
      setAiAnalysis(result);
    } catch (error: any) {
      Alert.alert(t('common.error'), error.message ?? t('onboarding.couldNotGetFeedback'));
    }
  };

  const handleSaveGoal = async () => {
    if (!goalDescription.trim()) {
      Alert.alert(t('onboarding.fillGoal'), t('onboarding.writeGoalFirst'));
      return;
    }
    try {
      await createGoal.mutateAsync({
        description: goalDescription,
        skill_id: selectedSkillId || undefined,
        skill_label: selectedSkillForGoal?.label,
        athlete_skills: selectedSkills.map((s) => s.label),
        deadline: deadline.toISOString(),
      });
      setGoalSaved(true);
    } catch (error: any) {
      Alert.alert(t('common.error'), error.message ?? t('onboarding.couldNotSaveGoal'));
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <View style={styles.categoryIconContainer}>
          <Ionicons name="flag" size={32} color={Colors.primary} />
        </View>
        <Text style={styles.title}>{t('onboarding.goalTitle')}</Text>
        {lowestSkill && (
          <Text style={styles.description}>
            {t('onboarding.goalDesc')}
          </Text>
        )}
      </View>

      <View style={goalStyles.section}>
        <Text style={goalStyles.sectionLabel}>{t('goals.chooseSkill')}</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={goalStyles.skillPicker}
          contentContainerStyle={goalStyles.skillPickerContent}
        >
          {selectedSkills.map((skill) => {
            const isSelected = selectedSkillId === skill.id;
            return (
              <TouchableOpacity
                key={skill.id}
                style={[goalStyles.skillChip, isSelected && goalStyles.skillChipActive]}
                onPress={() => setSelectedSkillId(skill.id)}
              >
                <Ionicons
                  name={skill.icon as any}
                  size={14}
                  color={isSelected ? Colors.white : Colors.textSecondary}
                />
                <Text style={[goalStyles.skillChipText, isSelected && goalStyles.skillChipTextActive]}>
                  {skill.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <View style={goalStyles.section}>
        <Text style={goalStyles.sectionLabel}>{t('goals.whatIsYourGoal')}</Text>
        <TextInput
          style={goalStyles.textInput}
          placeholder={position === 'goalkeeper'
            ? t('onboarding.goalPlaceholderGoalkeeper')
            : t('onboarding.goalPlaceholderOutfield')}
          placeholderTextColor={Colors.textTertiary}
          value={goalDescription}
          onChangeText={setGoalDescription}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />
      </View>

      <View style={goalStyles.section}>
        <Text style={goalStyles.sectionLabel}>{t('onboarding.deadline')}</Text>
        <TouchableOpacity
          style={goalStyles.deadlinePicker}
          onPress={() => setShowDatePicker(true)}
          activeOpacity={0.7}
        >
          <Ionicons name="calendar-outline" size={18} color={Colors.primary} />
          <Text style={goalStyles.deadlineText}>
            {format(deadline, 'd MMMM yyyy', { locale: i18n.language === 'en' ? enLocale : nl })}
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

      {aiAnalysis && (
        <View style={goalStyles.analysisContainer}>
          <GoalAnalysisCard analysis={aiAnalysis} />
        </View>
      )}

      <View style={goalStyles.actionButtons}>
        <Button
          title={t('goals.getAiFeedback')}
          onPress={handleGetFeedback}
          loading={getGoalFeedback.isPending}
          variant="outline"
          icon={<Ionicons name="sparkles-outline" size={16} color={Colors.primary} />}
        />
        <Button
          title={t('onboarding.saveGoal')}
          onPress={handleSaveGoal}
          loading={createGoal.isPending}
          disabled={goalSaved}
          icon={goalSaved ? <Ionicons name="checkmark" size={16} color={Colors.white} /> : undefined}
        />
      </View>

      {goalSaved && (
        <View style={goalStyles.savedBanner}>
          <Ionicons name="checkmark-circle" size={20} color={Colors.success} />
          <Text style={goalStyles.savedBannerText}>{t('onboarding.saveGoal')}</Text>
        </View>
      )}

      <View style={styles.buttonRow}>
        <Button title={t('common.back')} onPress={onBack} variant="outline" style={{ flex: 1 }} />
        <Button
          title={t('onboarding.complete')}
          onPress={onComplete}
          disabled={!goalSaved}
          style={{ flex: 1 }}
        />
      </View>
    </ScrollView>
  );
}

const goalStyles = StyleSheet.create({
  section: {
    marginBottom: Spacing.lg,
  },
  sectionLabel: {
    fontSize: FontSize.sm,
    fontWeight: '700',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: Spacing.sm,
  },
  skillPicker: {
    flexGrow: 0,
  },
  skillPickerContent: {
    gap: Spacing.sm,
    paddingBottom: Spacing.xs,
  },
  skillChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surfaceSecondary,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  skillChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  skillChipText: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  skillChipTextActive: {
    color: Colors.white,
  },
  textInput: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
    borderColor: Colors.border,
    padding: Spacing.md,
    fontSize: FontSize.md,
    color: Colors.text,
    minHeight: 110,
    lineHeight: 22,
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
  analysisContainer: {
    marginBottom: Spacing.lg,
  },
  actionButtons: {
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  savedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    justifyContent: 'center',
    paddingVertical: Spacing.sm,
    marginBottom: Spacing.md,
  },
  savedBannerText: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: Colors.success,
  },
});

// ─── Athlete Onboarding (Main Component) ───────────────
function AthleteOnboarding() {
  const { t } = useTranslation();
  const [step, setStep] = useState<OnboardingStep>('welcome');
  const [position, setPosition] = useState<PositionType | null>(null);
  const [selectedSkillIds, setSelectedSkillIds] = useState<string[]>([]);
  const [scores, setScores] = useState<Record<string, number>>({});
  const [scheduleEntries, setScheduleEntries] = useState<ScheduleEntry[]>([]);
  const [defaultMatchDay, setDefaultMatchDay] = useState<number | null>(null);

  const { data: allSkills = [] } = useSkillDefinitionsForPosition(position);
  const saveSelectedSkills = useSaveSelectedSkills();
  const saveSkillScores = useSaveSkillScores();
  const saveTrainingSchedule = useSaveTrainingSchedule();
  const generateSessions = useGenerateUpcomingSessions();
  const completeOnboarding = useUpdateOnboardingComplete();
  const savePosition = useSavePosition();
  const saveDefaultMatchDay = useSaveDefaultMatchDay();

  const toggleSkill = (skillId: string) => {
    setSelectedSkillIds((prev) =>
      prev.includes(skillId) ? prev.filter((id) => id !== skillId) : [...prev, skillId]
    );
  };

  const handleScore = (skillId: string, value: number) => {
    setScores((prev) => ({ ...prev, [skillId]: value }));
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

  const handleSelectPosition = (selectedPosition: PositionType) => {
    setPosition(selectedPosition);
    // Clear previously selected skills when position changes
    setSelectedSkillIds([]);
    goForward();
  };

  const handleComplete = async () => {
    try {
      // 1. Save position
      if (position) {
        await savePosition.mutateAsync(position);
      }

      // 2. Save selected skills
      await saveSelectedSkills.mutateAsync(selectedSkillIds);

      // 3. Save skill scores
      const scoreEntries = selectedSkillIds.map((skill_id) => ({
        skill_id,
        score: scores[skill_id] ?? 5,
      }));
      await saveSkillScores.mutateAsync(scoreEntries);

      // 4. Save training schedule
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

      // 5. Save default match day
      if (defaultMatchDay !== null) {
        await saveDefaultMatchDay.mutateAsync(defaultMatchDay);
      }

      // 6. Complete onboarding
      await completeOnboarding.mutateAsync();
    } catch (error: any) {
      Alert.alert(t('common.error'), error.message);
    }
  };

  const loading =
    saveSelectedSkills.isPending ||
    saveSkillScores.isPending ||
    saveTrainingSchedule.isPending ||
    completeOnboarding.isPending ||
    savePosition.isPending ||
    saveDefaultMatchDay.isPending;

  if (step === 'welcome') {
    return <WelcomeStep onContinue={goForward} />;
  }

  if (step === 'position') {
    return (
      <View style={{ flex: 1, backgroundColor: Colors.background }}>
        <ProgressBar currentStep={step} />
        <PositionSelectionStep onSelect={handleSelectPosition} />
      </View>
    );
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
          position={position!}
          onSkillCreated={() => {}}
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
          defaultMatchDay={defaultMatchDay}
          setDefaultMatchDay={setDefaultMatchDay}
        />
      </View>
    );
  }

  const selectedSkills = allSkills.filter((s) => selectedSkillIds.includes(s.id));

  if (step === 'scoring') {
    return (
      <View style={{ flex: 1, backgroundColor: Colors.background }}>
        <ProgressBar currentStep={step} />
        <ScoringStep
          selectedSkills={selectedSkills}
          scores={scores}
          onScore={handleScore}
          onComplete={goForward}
          onBack={goBack}
          loading={false}
        />
      </View>
    );
  }

  // Goal step
  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      <ProgressBar currentStep={step} />
      <GoalSettingStep
        selectedSkills={selectedSkills}
        scores={scores}
        position={position}
        onComplete={handleComplete}
        onBack={goBack}
      />
    </View>
  );
}

// ─── Coach Onboarding ──────────────────────────────────
function CoachOnboarding() {
  const { t } = useTranslation();
  const [mode, setMode] = useState<'choose' | 'create' | 'join'>('choose');
  const [teamName, setTeamName] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const createTeam = useCreateTeam();
  const joinTeam = useJoinTeam();
  const completeOnboarding = useUpdateOnboardingComplete();

  const handleCreate = async () => {
    if (!teamName.trim()) {
      Alert.alert(t('common.error'), t('onboarding.coachTeamError'));
      return;
    }
    try {
      await createTeam.mutateAsync(teamName.trim());
      await completeOnboarding.mutateAsync();
    } catch (error: any) {
      Alert.alert(t('common.error'), error.message);
    }
  };

  const handleJoin = async () => {
    if (!inviteCode.trim()) {
      Alert.alert(t('common.error'), t('settings.enterInviteCode'));
      return;
    }
    try {
      await joinTeam.mutateAsync(inviteCode.trim());
      await completeOnboarding.mutateAsync();
    } catch (error: any) {
      Alert.alert(t('common.error'), error.message);
    }
  };

  const loading = createTeam.isPending || joinTeam.isPending || completeOnboarding.isPending;

  if (mode === 'choose') {
    return (
      <View style={styles.container}>
        <View style={[styles.content, { justifyContent: 'center', flex: 1 }]}>
          <View style={styles.header}>
            <Ionicons name="people" size={64} color={Colors.primary} />
            <Text style={styles.title}>{t('onboarding.coachTeamTitle')}</Text>
          </View>
          <View style={{ gap: Spacing.md, marginTop: Spacing.xl }}>
            <TouchableOpacity
              style={{ backgroundColor: Colors.surface, borderRadius: BorderRadius.lg, borderWidth: 2, borderColor: Colors.border, padding: Spacing.lg, alignItems: 'center', gap: Spacing.sm }}
              onPress={() => setMode('create')}
              activeOpacity={0.75}
            >
              <Ionicons name="add-circle-outline" size={32} color={Colors.primary} />
              <Text style={{ fontSize: FontSize.lg, fontWeight: '700', color: Colors.text }}>{t('onboarding.coachChoiceCreate')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={{ backgroundColor: Colors.surface, borderRadius: BorderRadius.lg, borderWidth: 2, borderColor: Colors.border, padding: Spacing.lg, alignItems: 'center', gap: Spacing.sm }}
              onPress={() => setMode('join')}
              activeOpacity={0.75}
            >
              <Ionicons name="enter-outline" size={32} color={Colors.primary} />
              <Text style={{ fontSize: FontSize.lg, fontWeight: '700', color: Colors.text }}>{t('onboarding.coachChoiceJoin')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  if (mode === 'join') {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>{t('onboarding.coachChoiceJoin')}</Text>
        </View>
        <View style={styles.teamForm}>
          <Ionicons name="enter-outline" size={64} color={Colors.primary} style={styles.teamIcon} />
          <Input
            label={t('settings.enterInviteCode')}
            placeholder={t('settings.inviteCodePlaceholder')}
            value={inviteCode}
            onChangeText={setInviteCode}
            autoCapitalize="characters"
          />
        </View>
        <View style={styles.buttonRow}>
          <Button title={t('common.back')} onPress={() => setMode('choose')} variant="outline" style={{ flex: 1 }} />
          <Button title={t('settings.join')} onPress={handleJoin} loading={loading} style={{ flex: 1 }} />
        </View>
      </ScrollView>
    );
  }

  // mode === 'create'
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('onboarding.coachChoiceCreate')}</Text>
      </View>
      <View style={styles.teamForm}>
        <Ionicons name="people" size={64} color={Colors.primary} style={styles.teamIcon} />
        <Input
          label={t('onboarding.coachTeamTitle')}
          placeholder={t('onboarding.coachTeamPlaceholder')}
          value={teamName}
          onChangeText={setTeamName}
        />
      </View>
      <View style={styles.buttonRow}>
        <Button title={t('common.back')} onPress={() => setMode('choose')} variant="outline" style={{ flex: 1 }} />
        <Button title={t('onboarding.createTeam')} onPress={handleCreate} loading={loading} style={{ flex: 1 }} />
      </View>
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
