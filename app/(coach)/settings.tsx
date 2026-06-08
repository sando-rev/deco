import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, TouchableOpacity, Switch } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../src/hooks/useAuth';
import { Button } from '../../src/components/ui/Button';
import { Card } from '../../src/components/ui/Card';
import { Input } from '../../src/components/ui/Input';
import { useQueryClient } from '@tanstack/react-query';
import { useJoinTeam, useCoachTeams, useCreateTeam, useDeleteTeam, useLeaveTeam } from '../../src/hooks/useTeam';
import { useCoachOverviewPrefs } from '../../src/hooks/useWeeklyOverview';
import { supabase } from '../../src/services/supabase';
import { Colors, Spacing, FontSize, BorderRadius } from '../../src/constants/theme';

const DAY_LABELS_NL = ['Zo', 'Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za'];
const DAY_LABELS_EN = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const TIME_OPTIONS = ['08:00', '09:00', '10:00', '12:00', '14:00', '16:00', '17:00', '18:00', '19:00', '20:00'];

export default function CoachSettingsScreen() {
  const { t, i18n } = useTranslation();
  const { profile, signOut } = useAuth();
  const [joinCode, setJoinCode] = useState('');
  const [newTeamName, setNewTeamName] = useState('');
  const joinTeam = useJoinTeam();
  const createTeam = useCreateTeam();
  const deleteTeam = useDeleteTeam();
  const leaveTeam = useLeaveTeam();
  const { data: teams } = useCoachTeams();

  const handleJoin = async () => {
    if (!joinCode.trim()) return;
    try {
      await joinTeam.mutateAsync(joinCode.trim());
      setJoinCode('');
    } catch (error: any) {
      Alert.alert(t('common.error'), error.message);
    }
  };

  const handleCreateTeam = async () => {
    if (!newTeamName.trim()) return;
    try {
      await createTeam.mutateAsync(newTeamName.trim());
      setNewTeamName('');
      Alert.alert(t('common.success'), t('coach.teamCreated'));
    } catch (error: any) {
      Alert.alert(t('common.error'), error.message);
    }
  };

  const handleDeleteTeam = (teamId: string, teamName: string) => {
    Alert.alert(t('coach.deleteTeam'), t('coach.deleteTeamConfirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'),
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteTeam.mutateAsync(teamId);
            Alert.alert(t('common.success'), t('coach.teamDeleted'));
          } catch (error: any) {
            Alert.alert(t('common.error'), error.message);
          }
        },
      },
    ]);
  };

  const handleLeaveTeam = (teamId: string, teamName: string) => {
    Alert.alert(t('coach.leaveTeam'), t('coach.leaveTeamConfirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('coach.leaveTeam'),
        style: 'destructive',
        onPress: async () => {
          try {
            await leaveTeam.mutateAsync(teamId);
          } catch (error: any) {
            Alert.alert(t('common.error'), error.message);
          }
        },
      },
    ]);
  };

  const handleSignOut = () => {
    Alert.alert(t('settings.signOut'), t('settings.signOutConfirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('settings.signOut'), style: 'destructive', onPress: signOut },
    ]);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
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
        <Text style={styles.role}>{t('coach.role')}</Text>
      </Card>

      {/* Team Management */}
      <Card style={styles.teamsCard}>
        <Text style={styles.sectionTitle}>{t('coach.teamManagement')}</Text>

        {teams && teams.length > 0 ? (
          teams.map((team) => (
            <View key={team.id} style={styles.teamRow}>
              <View style={styles.teamInfo}>
                <Ionicons name="shield" size={20} color={Colors.primary} />
                <Text style={styles.teamNameText}>{team.name}</Text>
              </View>
              <View style={styles.teamActions}>
                <TouchableOpacity
                  onPress={() => handleLeaveTeam(team.id, team.name)}
                  style={styles.actionButton}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons name="exit-outline" size={18} color={Colors.textSecondary} />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => handleDeleteTeam(team.id, team.name)}
                  style={styles.actionButton}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons name="trash-outline" size={18} color={Colors.error} />
                </TouchableOpacity>
              </View>
            </View>
          ))
        ) : (
          <Text style={styles.noTeamsText}>{t('coach.noTeams')}</Text>
        )}

        {/* Create team */}
        <View style={styles.createRow}>
          <Input
            placeholder={t('coach.teamNamePlaceholder')}
            value={newTeamName}
            onChangeText={setNewTeamName}
            style={{ flex: 1 }}
          />
          <Button
            title={t('coach.createTeam')}
            onPress={handleCreateTeam}
            loading={createTeam.isPending}
            size="sm"
            disabled={!newTeamName.trim()}
          />
        </View>
      </Card>

      {/* Join team */}
      <Card style={styles.teamsCard}>
        <Text style={styles.sectionTitle}>{t('settings.team')}</Text>
        <View style={styles.joinRow}>
          <Input
            placeholder={t('settings.inviteCodePlaceholder')}
            value={joinCode}
            onChangeText={setJoinCode}
            autoCapitalize="characters"
            style={{ flex: 1 }}
          />
          <Button
            title={t('settings.join')}
            onPress={handleJoin}
            loading={joinTeam.isPending}
            size="sm"
            disabled={!joinCode.trim()}
          />
        </View>
      </Card>

      {/* Weekly overview notification preferences */}
      <OverviewPrefsCard t={t} language={i18n.language} />

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

function OverviewPrefsCard({ t, language }: { t: (key: string) => string; language: string }) {
  const { day, time, updatePrefs } = useCoachOverviewPrefs();
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const dayLabels = language === 'nl' ? DAY_LABELS_NL : DAY_LABELS_EN;

  const outlierEnabled = (profile as any)?.outlier_notifications_enabled ?? true;

  const handleDayChange = (newDay: number) => {
    updatePrefs.mutate({ day: newDay, time });
  };

  const handleTimeChange = (newTime: string) => {
    updatePrefs.mutate({ day, time: newTime });
  };

  const handleOutlierToggle = async (value: boolean) => {
    await supabase
      .from('profiles')
      .update({ outlier_notifications_enabled: value })
      .eq('id', profile!.id);
    queryClient.invalidateQueries({ queryKey: ['profile'] });
  };

  return (
    <Card style={overviewStyles.card}>
      <Text style={overviewStyles.title}>{t('overview.settingsDay')}</Text>
      <View style={overviewStyles.dayRow}>
        {dayLabels.map((label, idx) => (
          <TouchableOpacity
            key={idx}
            style={[
              overviewStyles.dayBtn,
              day === idx && { backgroundColor: Colors.primary, borderColor: Colors.primary },
            ]}
            onPress={() => handleDayChange(idx)}
          >
            <Text style={[overviewStyles.dayLabel, day === idx && { color: Colors.white }]}>
              {label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={[overviewStyles.title, { marginTop: Spacing.md }]}>{t('overview.settingsTime')}</Text>
      <View style={overviewStyles.timeRow}>
        {TIME_OPTIONS.map((opt) => (
          <TouchableOpacity
            key={opt}
            style={[
              overviewStyles.timeBtn,
              time === opt && { backgroundColor: Colors.primary, borderColor: Colors.primary },
            ]}
            onPress={() => handleTimeChange(opt)}
          >
            <Text style={[overviewStyles.timeLabel, time === opt && { color: Colors.white }]}>
              {opt}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Outlier notifications toggle */}
      <View style={overviewStyles.toggleRow}>
        <View style={{ flex: 1 }}>
          <Text style={overviewStyles.toggleTitle}>{t('settings.outlierNotifications')}</Text>
          <Text style={overviewStyles.toggleDesc}>{t('settings.outlierNotificationsDesc')}</Text>
        </View>
        <Switch
          value={outlierEnabled}
          onValueChange={handleOutlierToggle}
          trackColor={{ true: Colors.primary, false: Colors.border }}
        />
      </View>
    </Card>
  );
}

const overviewStyles = StyleSheet.create({
  card: {
    marginBottom: Spacing.lg,
    padding: Spacing.lg,
  },
  title: {
    fontSize: FontSize.md,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  dayRow: {
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  dayBtn: {
    flex: 1,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
    borderWidth: 1.5,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  dayLabel: {
    fontSize: FontSize.xs,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  timeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
  },
  timeBtn: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  timeLabel: {
    fontSize: FontSize.xs,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.lg,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  toggleTitle: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.text,
  },
  toggleDesc: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },
});

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
  },
  teamsCard: {
    marginBottom: Spacing.lg,
    padding: Spacing.lg,
  },
  sectionTitle: {
    fontSize: FontSize.md,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: Spacing.md,
  },
  teamRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  teamInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    flex: 1,
  },
  teamNameText: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: Colors.text,
  },
  teamActions: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  actionButton: {
    padding: Spacing.xs,
  },
  noTeamsText: {
    fontSize: FontSize.sm,
    color: Colors.textTertiary,
    fontStyle: 'italic',
    marginBottom: Spacing.md,
  },
  createRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.md,
    alignItems: 'flex-end',
  },
  joinRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    alignItems: 'flex-end',
  },
  signOutButton: {
    marginTop: Spacing.xl,
  },
});
