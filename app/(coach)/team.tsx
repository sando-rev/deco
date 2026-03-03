import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Share,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { useCoachTeam, useTeamMembers } from '../../src/hooks/useTeam';
import { Card } from '../../src/components/ui/Card';
import { Button } from '../../src/components/ui/Button';
import { Colors, Spacing, FontSize, BorderRadius } from '../../src/constants/theme';

export default function TeamScreen() {
  const { data: team } = useCoachTeam();
  const { data: members } = useTeamMembers(team?.id);

  const copyCode = async () => {
    if (team?.invite_code) {
      await Clipboard.setStringAsync(team.invite_code);
      Alert.alert('Copied!', 'Invite code copied to clipboard.');
    }
  };

  const shareCode = async () => {
    if (team) {
      await Share.share({
        message: `Join my team "${team.name}" on Deco! Use invite code: ${team.invite_code}`,
      });
    }
  };

  if (!team) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="shield-outline" size={48} color={Colors.textTertiary} />
        <Text style={styles.emptyTitle}>No team found</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Team info */}
      <Card style={styles.teamCard}>
        <View style={styles.teamIcon}>
          <Ionicons name="shield" size={40} color={Colors.primary} />
        </View>
        <Text style={styles.teamName}>{team.name}</Text>
        <Text style={styles.memberCount}>
          {members?.length ?? 0} player{members?.length !== 1 ? 's' : ''}
        </Text>
      </Card>

      {/* Invite code */}
      <Text style={styles.sectionTitle}>Invite Code</Text>
      <Card style={styles.codeCard}>
        <Text style={styles.codeDescription}>
          Share this code with your athletes so they can join your team.
        </Text>
        <View style={styles.codeRow}>
          <Text style={styles.codeText}>{team.invite_code}</Text>
          <TouchableOpacity onPress={copyCode} style={styles.copyButton}>
            <Ionicons name="copy-outline" size={20} color={Colors.primary} />
          </TouchableOpacity>
        </View>
        <Button
          title="Share Invite Code"
          onPress={shareCode}
          variant="outline"
          icon={<Ionicons name="share-outline" size={18} color={Colors.primary} />}
          style={styles.shareButton}
        />
      </Card>

      {/* Members list */}
      <Text style={styles.sectionTitle}>Team Members</Text>
      {members && members.length > 0 ? (
        members.map((member) => (
          <Card key={member.athlete_id} style={styles.memberCard} padding={Spacing.md}>
            <View style={styles.memberRow}>
              <View style={styles.memberAvatar}>
                <Text style={styles.memberInitials}>
                  {member.profile.full_name
                    .split(' ')
                    .map((n) => n[0])
                    .join('')
                    .toUpperCase()
                    .slice(0, 2)}
                </Text>
              </View>
              <View style={styles.memberInfo}>
                <Text style={styles.memberName}>{member.profile.full_name}</Text>
                <Text style={styles.memberGoals}>
                  {member.active_goals_count} active goal{member.active_goals_count !== 1 ? 's' : ''}
                </Text>
              </View>
            </View>
          </Card>
        ))
      ) : (
        <Text style={styles.emptyText}>
          No players have joined yet. Share the invite code above!
        </Text>
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
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
  },
  emptyTitle: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.text,
  },
  teamCard: {
    alignItems: 'center',
    padding: Spacing.xl,
    marginBottom: Spacing.lg,
  },
  teamIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  teamName: {
    fontSize: FontSize.xl,
    fontWeight: '800',
    color: Colors.text,
  },
  memberCount: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: Spacing.md,
  },
  codeCard: {
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  codeDescription: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
    lineHeight: 20,
  },
  codeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.md,
    backgroundColor: Colors.surfaceSecondary,
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
  },
  codeText: {
    fontSize: 32,
    fontWeight: '800',
    color: Colors.primary,
    letterSpacing: 4,
    fontFamily: 'SpaceMono',
  },
  copyButton: {
    padding: Spacing.sm,
  },
  shareButton: {
    marginTop: Spacing.xs,
  },
  memberCard: {
    marginBottom: Spacing.sm,
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  memberAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primaryLight + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  memberInitials: {
    fontSize: FontSize.sm,
    fontWeight: '700',
    color: Colors.primary,
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: Colors.text,
  },
  memberGoals: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  emptyText: {
    fontSize: FontSize.sm,
    color: Colors.textTertiary,
    fontStyle: 'italic',
    textAlign: 'center',
  },
});
