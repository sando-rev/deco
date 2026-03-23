import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { TeamMemberWithProfile } from '../types/database';
import { Colors, Spacing, FontSize, BorderRadius } from '../constants/theme';
import { Card } from './ui/Card';

interface PlayerCardProps {
  member: TeamMemberWithProfile;
  onPress: () => void;
}

export function PlayerCard({ member, onPress }: PlayerCardProps) {
  const { profile, active_goals_count, active_goal_skills = [] } = member;
  const initials = profile.full_name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
      <Card style={styles.card}>
        <View style={styles.row}>
          <View style={styles.avatar}>
            <Text style={styles.initials}>{initials}</Text>
          </View>
          <View style={styles.info}>
            <Text style={styles.name}>{profile.full_name}</Text>
            {active_goal_skills.length > 0 ? (
              active_goal_skills.map((skill, i) => (
                <Text key={i} style={styles.skillLabel}>{skill}</Text>
              ))
            ) : (
              <Text style={styles.skillLabel}>Geen actieve doelen</Text>
            )}
          </View>
          <View style={styles.stats}>
            <View style={styles.statItem}>
              <Ionicons name="flag-outline" size={14} color={Colors.primary} />
              <Text style={styles.statText}>{active_goals_count}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={Colors.textTertiary} />
          </View>
        </View>
      </Card>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: Spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primaryLight + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  initials: {
    fontSize: FontSize.md,
    fontWeight: '700',
    color: Colors.primary,
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: Colors.text,
  },
  skillLabel: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  stats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: Colors.primary + '10',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
  },
  statText: {
    fontSize: FontSize.xs,
    fontWeight: '600',
    color: Colors.primary,
  },
});
