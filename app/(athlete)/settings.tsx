import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, Switch, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';
import { useTranslation } from 'react-i18next';
import { parseIcs } from '../../src/utils/icsParser';
import { useAuth } from '../../src/hooks/useAuth';
import { useJoinTeam, useMyTeams } from '../../src/hooks/useTeam';
import { useSavePosition, useSaveDefaultMatchDay, useSaveLanguage } from '../../src/hooks/useProfile';
import { useTrainingSchedule, useSaveTrainingSchedule, useGenerateUpcomingSessions, useMatchDates, useSaveMatchDate, useDeleteMatchDate, useAddMatch } from '../../src/hooks/useSchedule';
import { Button } from '../../src/components/ui/Button';
import { Input } from '../../src/components/ui/Input';
import { Card } from '../../src/components/ui/Card';
import { Colors, Spacing, FontSize, BorderRadius } from '../../src/constants/theme';
import { supabase } from '../../src/services/supabase';
import { NotificationPrefs, PositionType, ScheduleSessionType, TrainingSchedule } from '../../src/types/database';
import { DISPLAY_DAY_ORDER, DAY_LABELS, DAY_LABELS_FULL, dayOfWeekToDisplayIndex } from '../../src/constants/skills';

export default function SettingsScreen() {
  const { t } = useTranslation();
  const { profile, signOut, refreshProfile } = useAuth();
  const { data: teams } = useMyTeams();
  const joinTeam = useJoinTeam();
  const savePosition = useSavePosition();
  const saveDefaultMatchDay = useSaveDefaultMatchDay();
  const saveLanguage = useSaveLanguage();
  const { data: trainingSchedule } = useTrainingSchedule();
  const saveTrainingSchedule = useSaveTrainingSchedule();
  const generateSessions = useGenerateUpcomingSessions();
  const { data: matchDates } = useMatchDates();
  const saveMatchDate = useSaveMatchDate();
  const deleteMatchDate = useDeleteMatchDate();
  const addMatch = useAddMatch();
  const [inviteCode, setInviteCode] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [showTrainingTimePicker, setShowTrainingTimePicker] = useState<{
    day: number;
    field: 'start' | 'end';
  } | null>(null);
  const [pickerDate, setPickerDate] = useState(new Date());
  const [pickerTime, setPickerTime] = useState<Date | null>(null);

  const notifPrefs = profile?.notification_prefs ?? {
    pre_training: true,
    post_session: true,
    motivational: true,
    weekly_review: true,
  };

  const NOTIFICATION_LABELS: Record<keyof NotificationPrefs, { label: string; description: string }> = {
    pre_training: {
      label: t('settings.preTraining'),
      description: t('settings.preTrainingDesc'),
    },
    post_session: {
      label: t('settings.postSession'),
      description: t('settings.postSessionDesc'),
    },
    motivational: {
      label: t('settings.motivational'),
      description: t('settings.motivationalDesc'),
    },
    weekly_review: {
      label: t('settings.weeklyReview'),
      description: t('settings.weeklyReviewDesc'),
    },
  };

  const handleToggleNotification = async (key: keyof NotificationPrefs, newValue: boolean) => {
    if (!newValue) {
      Alert.alert(
        t('settings.disableConfirm'),
        t('settings.disableConfirmMsg'),
        [
          { text: t('settings.keepOn'), style: 'cancel' },
          {
            text: t('settings.disable'),
            style: 'destructive',
            onPress: () => saveNotificationPref(key, false),
          },
        ]
      );
    } else {
      await saveNotificationPref(key, true);
    }
  };

  const saveNotificationPref = async (key: keyof NotificationPrefs, value: boolean) => {
    if (!profile) return;
    const updatedPrefs = { ...notifPrefs, [key]: value };
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ notification_prefs: updatedPrefs })
        .eq('id', profile.id);
      if (error) throw error;
      refreshProfile();
    } catch (error: any) {
      Alert.alert(t('common.error'), error.message);
    }
  };

  // --- Training schedule helpers ---
  const scheduleEntries = (trainingSchedule ?? []).map((s) => ({
    day_of_week: s.day_of_week,
    start_time: s.start_time,
    end_time: s.end_time,
    session_type: s.session_type as ScheduleSessionType,
    label: s.label ?? 'Training',
  }));

  const sortedScheduleEntries = [...scheduleEntries].sort(
    (a, b) => dayOfWeekToDisplayIndex(a.day_of_week) - dayOfWeekToDisplayIndex(b.day_of_week)
  );

  const saveSchedule = async (
    entries: { day_of_week: number; start_time: string; end_time: string; session_type: ScheduleSessionType; label: string }[]
  ) => {
    try {
      await saveTrainingSchedule.mutateAsync(entries);
      // Re-fetch saved schedules to get real UUIDs for session generation
      const { data: savedSchedules } = await supabase
        .from('training_schedules')
        .select('*')
        .eq('athlete_id', profile!.id);
      if (savedSchedules && savedSchedules.length > 0) {
        await generateSessions.mutateAsync(savedSchedules as TrainingSchedule[]);
      }
    } catch (error: any) {
      Alert.alert(t('common.error'), error.message);
    }
  };

  const handleToggleTrainingDay = (dayOfWeek: number) => {
    const existing = scheduleEntries.find((e) => e.day_of_week === dayOfWeek);
    if (existing) {
      saveSchedule(scheduleEntries.filter((e) => e.day_of_week !== dayOfWeek));
    } else {
      saveSchedule([
        ...scheduleEntries,
        { day_of_week: dayOfWeek, start_time: '18:00', end_time: '19:30', session_type: 'training', label: 'Training' },
      ]);
    }
  };

  const handleTrainingTimeChange = (_: any, date: Date | undefined) => {
    if (Platform.OS !== 'ios') {
      setShowTrainingTimePicker(null);
    }
    if (date && showTrainingTimePicker) {
      const timeStr = `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
      const field = showTrainingTimePicker.field === 'start' ? 'start_time' : 'end_time';
      const updated = scheduleEntries.map((e) =>
        e.day_of_week === showTrainingTimePicker.day ? { ...e, [field]: timeStr } : e
      );
      saveSchedule(updated);
    }
  };

  const parseTimeStr = (time: string): Date => {
    const [h, m] = time.split(':').map(Number);
    const d = new Date();
    d.setHours(h, m, 0, 0);
    return d;
  };

  const handlePositionChange = (newPosition: PositionType) => {
    if (newPosition === profile?.position) return;
    Alert.alert(
      t('settings.changePosition'),
      t('settings.changePositionMsg'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('settings.change'),
          onPress: () => savePosition.mutateAsync(newPosition),
        },
      ]
    );
  };

  const handleMatchDayChange = (dayOfWeek: number) => {
    saveDefaultMatchDay.mutateAsync(dayOfWeek);
  };

  const handleAddMatchDate = async (date: Date, startTime: Date) => {
    try {
      const dateStr = format(date, 'yyyy-MM-dd');
      const timeStr = format(startTime, 'HH:mm');
      // Compute end_time as start_time + 3 hours for the scheduled session
      const endTime = new Date(startTime);
      endTime.setHours(endTime.getHours() + 3);
      const endTimeStr = format(endTime, 'HH:mm');

      await saveMatchDate.mutateAsync({
        date: dateStr,
        start_time: timeStr,
      });

      // Also create a scheduled session so notifications fire
      await addMatch.mutateAsync({
        date: dateStr,
        start_time: timeStr,
        end_time: endTimeStr,
      });
    } catch (error: any) {
      Alert.alert(t('common.error'), error.message);
    }
  };

  const handleDeleteMatchDate = (id: string) => {
    Alert.alert(t('settings.deleteMatch'), t('settings.deleteMatchMsg'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('settings.delete'),
        style: 'destructive',
        onPress: () => deleteMatchDate.mutateAsync(id),
      },
    ]);
  };

  const handleImportIcs = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['text/calendar', 'application/octet-stream'],
        copyToCacheDirectory: true,
      });

      if (result.canceled || !result.assets?.[0]) return;

      const fileUri = result.assets[0].uri;
      const content = await FileSystem.readAsStringAsync(fileUri);
      const events = parseIcs(content);

      if (events.length === 0) {
        Alert.alert(t('settings.noMatchesFound'), t('settings.noMatchesFoundMsg'));
        return;
      }

      // Filter future events only
      const today = new Date().toISOString().slice(0, 10);
      const futureEvents = events.filter((e) => e.date >= today);

      if (futureEvents.length === 0) {
        Alert.alert(t('settings.noFutureMatches'), t('settings.noFutureMatchesMsg'));
        return;
      }

      Alert.alert(
        t('settings.importMatches'),
        t('settings.importMatchesMsg', { count: futureEvents.length }),
        [
          { text: t('common.cancel'), style: 'cancel' },
          {
            text: t('settings.import'),
            onPress: async () => {
              let count = 0;
              for (const event of futureEvents) {
                try {
                  await saveMatchDate.mutateAsync({
                    date: event.date,
                    start_time: event.startTime ?? undefined,
                    label: event.label,
                  });
                  count++;
                } catch {
                  // Skip duplicates or errors
                }
              }
              Alert.alert(t('settings.importSuccess'), t('settings.importSuccessMsg', { count }));
            },
          },
        ]
      );
    } catch (error: any) {
      Alert.alert(t('common.error'), t('settings.fileReadError'));
    }
  };

  const handleJoinTeam = async () => {
    if (!inviteCode.trim()) {
      Alert.alert(t('common.error'), t('settings.enterInviteCode'));
      return;
    }
    try {
      const team = await joinTeam.mutateAsync(inviteCode.trim());
      Alert.alert(t('settings.joinSuccess'), t('settings.joinSuccessMsg', { name: team.name }));
      setInviteCode('');
    } catch (error: any) {
      Alert.alert(t('common.error'), error.message);
    }
  };

  const handleSignOut = () => {
    Alert.alert(t('settings.signOut'), t('settings.signOutConfirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('settings.signOut'), style: 'destructive', onPress: signOut },
    ]);
  };

  const handleDeleteAccount = () => {
    Alert.alert(t('settings.deleteAccount'), t('settings.deleteAccountConfirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('settings.deleteAccountButton'),
        style: 'destructive',
        onPress: async () => {
          try {
            const { error } = await supabase.rpc('delete_my_account');
            if (error) throw error;
            await supabase.auth.signOut();
          } catch (error: any) {
            Alert.alert(t('common.error'), error.message);
          }
        },
      },
    ]);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Profile info */}
      <Card style={styles.profileCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {profile?.full_name
              ?.split(' ')
              .map((n) => n[0])
              .join('')
              .toUpperCase()
              .slice(0, 2)}
          </Text>
        </View>
        <Text style={styles.name}>{profile?.full_name}</Text>
        <Text style={styles.role}>{t('settings.athlete')}</Text>
      </Card>

      {/* Position */}
      <Text style={styles.sectionTitle}>{t('settings.position')}</Text>
      <Card style={styles.chipsCard}>
        <View style={styles.chipsRow}>
          {(
            [
              { value: 'outfield' as PositionType, label: t('settings.outfield') },
              { value: 'goalkeeper' as PositionType, label: t('settings.goalkeeper') },
            ] as { value: PositionType; label: string }[]
          ).map((opt) => {
            const isSelected = profile?.position === opt.value;
            return (
              <TouchableOpacity
                key={opt.value}
                style={[styles.chip, isSelected && styles.chipSelected]}
                onPress={() => handlePositionChange(opt.value)}
                accessibilityRole="button"
                accessibilityState={{ selected: isSelected }}
              >
                <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
                  {opt.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </Card>

      {/* Notifications */}
      <Text style={styles.sectionTitle}>{t('settings.notifications')}</Text>
      <Card style={styles.notifCard}>
        {(Object.keys(NOTIFICATION_LABELS) as (keyof NotificationPrefs)[]).map((key) => {
          const config = NOTIFICATION_LABELS[key];
          return (
            <View key={key} style={styles.notifRow}>
              <View style={styles.notifInfo}>
                <Text style={styles.notifLabel}>{config.label}</Text>
                <Text style={styles.notifDesc}>{config.description}</Text>
              </View>
              <Switch
                value={notifPrefs[key]}
                onValueChange={(val) => handleToggleNotification(key, val)}
                trackColor={{ false: Colors.border, true: Colors.primary + '60' }}
                thumbColor={notifPrefs[key] ? Colors.primary : Colors.textTertiary}
              />
            </View>
          );
        })}
      </Card>

      {/* Language */}
      <Text style={styles.sectionTitle}>{t('settings.language')}</Text>
      <Card style={styles.chipsCard}>
        <View style={styles.chipsRow}>
          {(['nl', 'en'] as const).map((lang) => {
            const isSelected = (profile?.language ?? 'nl') === lang;
            return (
              <TouchableOpacity
                key={lang}
                style={[styles.chip, isSelected && styles.chipSelected]}
                onPress={() => saveLanguage.mutateAsync(lang)}
              >
                <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
                  {lang === 'nl' ? 'Nederlands' : 'English'}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </Card>

      {/* Training schedule */}
      <Text style={styles.sectionTitle}>{t('settings.trainingSchedule')}</Text>
      <Card style={styles.matchCard}>
        <Text style={styles.matchSubLabel}>{t('settings.selectDay')}</Text>
        <View style={styles.chipsRow}>
          {DISPLAY_DAY_ORDER.map((dayOfWeek) => {
            const hasSession = scheduleEntries.some((e) => e.day_of_week === dayOfWeek);
            return (
              <TouchableOpacity
                key={dayOfWeek}
                style={[styles.dayChip, hasSession && styles.chipSelected]}
                onPress={() => handleToggleTrainingDay(dayOfWeek)}
                accessibilityRole="button"
                accessibilityState={{ selected: hasSession }}
              >
                <Text style={[styles.dayChipText, hasSession && styles.chipTextSelected]}>
                  {DAY_LABELS[dayOfWeek]}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {sortedScheduleEntries.map((entry) => (
          <View key={entry.day_of_week} style={styles.trainingEntry}>
            <Text style={styles.trainingEntryDay}>{DAY_LABELS_FULL[entry.day_of_week]}</Text>
            <View style={styles.trainingTimeRow}>
              <TouchableOpacity
                style={styles.trainingTimeButton}
                onPress={() => setShowTrainingTimePicker({ day: entry.day_of_week, field: 'start' })}
              >
                <Ionicons name="time-outline" size={14} color={Colors.primary} />
                <Text style={styles.trainingTimeText}>{entry.start_time}</Text>
              </TouchableOpacity>
              <Text style={styles.trainingTimeSeparator}>—</Text>
              <TouchableOpacity
                style={styles.trainingTimeButton}
                onPress={() => setShowTrainingTimePicker({ day: entry.day_of_week, field: 'end' })}
              >
                <Text style={styles.trainingTimeText}>{entry.end_time}</Text>
              </TouchableOpacity>
            </View>
            {showTrainingTimePicker?.day === entry.day_of_week && (
              <DateTimePicker
                value={parseTimeStr(
                  showTrainingTimePicker.field === 'start' ? entry.start_time : entry.end_time
                )}
                mode="time"
                is24Hour={true}
                minuteInterval={5}
                onChange={handleTrainingTimeChange}
              />
            )}
          </View>
        ))}

        {scheduleEntries.length === 0 && (
          <Text style={styles.noMatchDates}>{t('settings.noTrainings')}</Text>
        )}
      </Card>

      {/* Match schedule */}
      <Text style={styles.sectionTitle}>{t('settings.matches')}</Text>
      <Card style={styles.matchCard}>
        <Text style={styles.matchSubLabel}>{t('settings.defaultMatchDay')}</Text>
        <View style={styles.chipsRow}>
          {DISPLAY_DAY_ORDER.map((dayOfWeek) => {
            const isSelected = profile?.default_match_day === dayOfWeek;
            return (
              <TouchableOpacity
                key={dayOfWeek}
                style={[styles.dayChip, isSelected && styles.chipSelected]}
                onPress={() => handleMatchDayChange(dayOfWeek)}
                accessibilityRole="button"
                accessibilityState={{ selected: isSelected }}
              >
                <Text style={[styles.dayChipText, isSelected && styles.chipTextSelected]}>
                  {DAY_LABELS[dayOfWeek]}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.matchDivider} />

        <Text style={styles.matchSubLabel}>{t('settings.scheduledMatches')}</Text>
        {matchDates && matchDates.length > 0 ? (
          matchDates.map((md) => (
            <View key={md.id} style={styles.matchDateRow}>
              <View style={styles.matchDateInfo}>
                <Text style={styles.matchDateText}>
                  {format(new Date(md.date), 'd MMMM yyyy', { locale: nl })}
                </Text>
                {md.start_time ? (
                  <Text style={styles.matchDateTime}>{md.start_time.slice(0, 5)}</Text>
                ) : null}
              </View>
              <TouchableOpacity
                onPress={() => handleDeleteMatchDate(md.id)}
                style={styles.deleteButton}
                accessibilityLabel={t('settings.deleteMatch')}
                accessibilityRole="button"
              >
                <Ionicons name="trash-outline" size={18} color={Colors.error ?? '#E53E3E'} />
              </TouchableOpacity>
            </View>
          ))
        ) : (
          <Text style={styles.noMatchDates}>{t('settings.noScheduledMatches')}</Text>
        )}

        <TouchableOpacity
          style={styles.addMatchButton}
          onPress={() => setShowDatePicker(true)}
          accessibilityRole="button"
        >
          <Ionicons name="add-circle-outline" size={18} color={Colors.primary} />
          <Text style={styles.addMatchButtonText}>{t('settings.addMatch')}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.addMatchButton}
          onPress={handleImportIcs}
          accessibilityRole="button"
        >
          <Ionicons name="cloud-upload-outline" size={18} color={Colors.primary} />
          <Text style={styles.addMatchButtonText}>{t('settings.importIcs')}</Text>
        </TouchableOpacity>
      </Card>

      {showDatePicker && (
        <DateTimePicker
          value={pickerDate}
          mode="date"
          display={Platform.OS === 'ios' ? 'inline' : 'default'}
          minimumDate={new Date()}
          onChange={(event, selectedDate) => {
            if (Platform.OS === 'android') {
              setShowDatePicker(false);
            }
            if (event.type === 'set' && selectedDate) {
              setPickerDate(selectedDate);
              if (Platform.OS === 'ios') {
                setShowDatePicker(false);
              }
              // After date selection, show time picker
              const defaultTime = new Date();
              defaultTime.setHours(10, 0, 0, 0);
              setPickerTime(defaultTime);
              setShowTimePicker(true);
            } else if (event.type === 'dismissed') {
              setShowDatePicker(false);
            }
          }}
        />
      )}

      {showTimePicker && (
        <DateTimePicker
          value={pickerTime ?? new Date()}
          mode="time"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          minuteInterval={5}
          onChange={(event, selectedTime) => {
            if (Platform.OS === 'android') {
              setShowTimePicker(false);
            }
            if (event.type === 'set' && selectedTime) {
              setPickerTime(selectedTime);
              handleAddMatchDate(pickerDate, selectedTime);
              if (Platform.OS === 'ios') {
                setShowTimePicker(false);
              }
            } else if (event.type === 'dismissed') {
              setShowTimePicker(false);
            }
          }}
        />
      )}

      {/* Join team */}
      <Text style={styles.sectionTitle}>{t('settings.team')}</Text>

      {teams && teams.length > 0 ? (
        teams.map((team) => (
          <Card key={team.id} style={styles.teamCard}>
            <Ionicons name="people" size={20} color={Colors.primary} />
            <Text style={styles.teamName}>{team.name}</Text>
          </Card>
        ))
      ) : (
        <Text style={styles.noTeam}>{t('settings.noTeam')}</Text>
      )}

      <View style={styles.joinRow}>
        <Input
          placeholder={t('settings.enterInviteCode')}
          value={inviteCode}
          onChangeText={setInviteCode}
          autoCapitalize="characters"
          containerStyle={{ flex: 1, marginBottom: 0 }}
        />
        <Button
          title={t('settings.join')}
          onPress={handleJoinTeam}
          loading={joinTeam.isPending}
          size="md"
        />
      </View>

      {/* Feed visibility */}
      <Card style={styles.notifCard} padding={Spacing.md}>
        <View style={styles.notifRow}>
          <View style={styles.notifInfo}>
            <Text style={styles.notifLabel}>{t('settings.feedVisible')}</Text>
            <Text style={styles.notifDesc}>{t('settings.feedVisibleDesc')}</Text>
          </View>
          <Switch
            value={(profile as any)?.feed_visible ?? true}
            onValueChange={async (value) => {
              await supabase.from('profiles').update({ feed_visible: value }).eq('id', profile!.id);
              refreshProfile();
            }}
            trackColor={{ true: Colors.primary, false: Colors.border }}
          />
        </View>
      </Card>

      {/* Sign out */}
      <Button
        title={t('settings.signOut')}
        onPress={handleSignOut}
        variant="outline"
        style={styles.signOutButton}
        icon={<Ionicons name="log-out-outline" size={18} color={Colors.primary} />}
      />

      {/* Delete account */}
      <TouchableOpacity
        onPress={handleDeleteAccount}
        style={styles.deleteAccountButton}
        accessibilityRole="button"
        accessibilityLabel={t('settings.deleteAccount')}
      >
        <Text style={styles.deleteAccountText}>{t('settings.deleteAccount')}</Text>
      </TouchableOpacity>
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
  profileCard: {
    alignItems: 'center',
    padding: Spacing.xl,
    marginBottom: Spacing.lg,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  avatarText: {
    fontSize: FontSize.xl,
    fontWeight: '700',
    color: Colors.primary,
  },
  name: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.text,
  },
  role: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    textTransform: 'capitalize',
  },
  sectionTitle: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: Spacing.md,
  },
  chipsCard: {
    marginBottom: Spacing.lg,
    padding: Spacing.md,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  chip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full ?? 999,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.surface ?? Colors.background,
  },
  chipSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary + '15',
  },
  chipText: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  chipTextSelected: {
    color: Colors.primary,
  },
  dayChip: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.surface ?? Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayChipText: {
    fontSize: FontSize.xs,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  notifCard: {
    marginBottom: Spacing.lg,
    padding: 0,
    overflow: 'hidden',
  },
  notifRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  notifInfo: {
    flex: 1,
    marginRight: Spacing.md,
  },
  notifLabel: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.text,
  },
  notifDesc: {
    fontSize: FontSize.xs,
    color: Colors.textTertiary,
    marginTop: 2,
  },
  matchCard: {
    marginBottom: Spacing.lg,
    padding: Spacing.md,
  },
  matchSubLabel: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
  },
  matchDivider: {
    height: 1,
    backgroundColor: Colors.borderLight,
    marginVertical: Spacing.md,
  },
  matchDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  matchDateInfo: {
    flex: 1,
  },
  matchDateText: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.text,
  },
  matchDateTime: {
    fontSize: FontSize.xs,
    color: Colors.textTertiary,
    marginTop: 2,
  },
  deleteButton: {
    padding: Spacing.xs,
    marginLeft: Spacing.sm,
  },
  noMatchDates: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    paddingVertical: Spacing.sm,
  },
  addMatchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginTop: Spacing.md,
  },
  addMatchButtonText: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.primary,
  },
  teamCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  teamName: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: Colors.text,
  },
  noTeam: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
  },
  joinRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  trainingEntry: {
    marginTop: Spacing.md,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  trainingEntryDay: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  trainingTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  trainingTimeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.primary + '10',
  },
  trainingTimeText: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.primary,
  },
  trainingTimeSeparator: {
    fontSize: FontSize.sm,
    color: Colors.textTertiary,
  },
  signOutButton: {
    marginTop: Spacing.xl,
  },
  deleteAccountButton: {
    alignItems: 'center',
    paddingVertical: Spacing.md,
    marginTop: Spacing.sm,
  },
  deleteAccountText: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.error ?? '#E53E3E',
  },
});
