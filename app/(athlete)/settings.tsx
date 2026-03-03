import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, Switch } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../src/hooks/useAuth';
import { useJoinTeam, useMyTeams } from '../../src/hooks/useTeam';
import { Button } from '../../src/components/ui/Button';
import { Input } from '../../src/components/ui/Input';
import { Card } from '../../src/components/ui/Card';
import { Colors, Spacing, FontSize, BorderRadius } from '../../src/constants/theme';
import { supabase } from '../../src/services/supabase';
import { NotificationPrefs } from '../../src/types/database';

const NOTIFICATION_LABELS: Record<keyof NotificationPrefs, { label: string; description: string }> = {
  pre_training: {
    label: 'Pre-training reminders',
    description: 'Get your focus points before training',
  },
  post_session: {
    label: 'Post-session reflection',
    description: 'Quick prompt to reflect after training/match',
  },
  motivational: {
    label: 'Motivational messages',
    description: 'Stay inspired between sessions',
  },
  weekly_review: {
    label: 'Weekly review',
    description: 'Summary of your progress each week',
  },
};

export default function SettingsScreen() {
  const { profile, signOut, refreshProfile } = useAuth();
  const { data: teams } = useMyTeams();
  const joinTeam = useJoinTeam();
  const [inviteCode, setInviteCode] = useState('');

  const notifPrefs = profile?.notification_prefs ?? {
    pre_training: true,
    post_session: true,
    motivational: true,
    weekly_review: true,
  };

  const handleToggleNotification = async (key: keyof NotificationPrefs, newValue: boolean) => {
    if (!newValue) {
      // Show motivational message when turning off
      Alert.alert(
        'Are you sure?',
        'Research shows athletes who track and reflect consistently improve faster. These reminders help keep your development goals front and center — getting the most out of every training session.',
        [
          { text: 'Keep On', style: 'cancel' },
          {
            text: 'Turn Off',
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
      Alert.alert('Error', error.message);
    }
  };

  const handleJoinTeam = async () => {
    if (!inviteCode.trim()) {
      Alert.alert('Error', 'Please enter an invite code');
      return;
    }
    try {
      const team = await joinTeam.mutateAsync(inviteCode.trim());
      Alert.alert('Success', `You joined ${team.name}!`);
      setInviteCode('');
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: signOut },
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
        <Text style={styles.role}>Athlete</Text>
      </Card>

      {/* Notifications */}
      <Text style={styles.sectionTitle}>Notifications</Text>
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

      {/* Join team */}
      <Text style={styles.sectionTitle}>Team</Text>
      {teams && teams.length > 0 ? (
        teams.map((team) => (
          <Card key={team.id} style={styles.teamCard}>
            <Ionicons name="people" size={20} color={Colors.primary} />
            <Text style={styles.teamName}>{team.name}</Text>
          </Card>
        ))
      ) : (
        <Text style={styles.noTeam}>You're not on any team yet.</Text>
      )}

      <View style={styles.joinRow}>
        <Input
          placeholder="Enter invite code"
          value={inviteCode}
          onChangeText={setInviteCode}
          autoCapitalize="characters"
          containerStyle={{ flex: 1, marginBottom: 0 }}
        />
        <Button
          title="Join"
          onPress={handleJoinTeam}
          loading={joinTeam.isPending}
          size="md"
        />
      </View>

      {/* Sign out */}
      <Button
        title="Sign Out"
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
