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
import { useMatchDates, useSaveMatchDate, useDeleteMatchDate } from '../../src/hooks/useSchedule';
import { Button } from '../../src/components/ui/Button';
import { Input } from '../../src/components/ui/Input';
import { Card } from '../../src/components/ui/Card';
import { Colors, Spacing, FontSize, BorderRadius } from '../../src/constants/theme';
import { supabase } from '../../src/services/supabase';
import { NotificationPrefs, PositionType } from '../../src/types/database';
import { DISPLAY_DAY_ORDER, DAY_LABELS } from '../../src/constants/skills';

export default function SettingsScreen() {
  const { t } = useTranslation();
  const { profile, signOut, refreshProfile } = useAuth();
  const { data: teams } = useMyTeams();
  const joinTeam = useJoinTeam();
  const savePosition = useSavePosition();
  const saveDefaultMatchDay = useSaveDefaultMatchDay();
  const saveLanguage = useSaveLanguage();
  const { data: matchDates } = useMatchDates();
  const saveMatchDate = useSaveMatchDate();
  const deleteMatchDate = useDeleteMatchDate();
  const [inviteCode, setInviteCode] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [pickerDate, setPickerDate] = useState(new Date());

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

  const handleAddMatchDate = async (date: Date) => {
    try {
      await saveMatchDate.mutateAsync({
        date: format(date, 'yyyy-MM-dd'),
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
              handleAddMatchDate(selectedDate);
              if (Platform.OS === 'ios') {
                setShowDatePicker(false);
              }
            } else if (event.type === 'dismissed') {
              setShowDatePicker(false);
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

      {/* Sign out */}
      <Button
        title={t('settings.signOut')}
        onPress={handleSignOut}
        variant="outline"
        style={styles.signOutButton}
        icon={<Ionicons name="log-out-outline" size={18} color={Colors.primary} />}
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
  signOutButton: {
    marginTop: Spacing.xl,
  },
});
