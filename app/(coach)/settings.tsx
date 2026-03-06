import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../src/hooks/useAuth';
import { Button } from '../../src/components/ui/Button';
import { Card } from '../../src/components/ui/Card';
import { Input } from '../../src/components/ui/Input';
import { useJoinTeam, useCoachTeams } from '../../src/hooks/useTeam';
import { Colors, Spacing, FontSize } from '../../src/constants/theme';

export default function CoachSettingsScreen() {
  const { t } = useTranslation();
  const { profile, signOut } = useAuth();
  const [joinCode, setJoinCode] = useState('');
  const joinTeam = useJoinTeam();
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

      <Card style={styles.teamsCard}>
        <Text style={styles.sectionTitle}>{t('settings.team')}</Text>
        {teams && teams.length > 0 && teams.map((team) => (
          <Text key={team.id} style={styles.teamName}>{team.name}</Text>
        ))}
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
  },
  teamsCard: {
    marginBottom: Spacing.lg,
    padding: Spacing.lg,
  },
  sectionTitle: {
    fontSize: FontSize.md,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  teamName: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  joinRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.md,
    alignItems: 'flex-end',
  },
  signOutButton: {
    marginTop: Spacing.xl,
  },
});
