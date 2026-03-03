import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useCoachTeam, useTeamMembers } from '../../../src/hooks/useTeam';
import { PlayerCard } from '../../../src/components/PlayerCard';
import { Colors, Spacing, FontSize } from '../../../src/constants/theme';

export default function PlayersScreen() {
  const router = useRouter();
  const { data: team, isLoading: loadingTeam } = useCoachTeam();
  const { data: members, isLoading: loadingMembers } = useTeamMembers(team?.id);

  const isLoading = loadingTeam || loadingMembers;

  return (
    <View style={styles.container}>
      {team && (
        <View style={styles.teamHeader}>
          <Text style={styles.teamName}>{team.name}</Text>
          <Text style={styles.playerCount}>
            {members?.length ?? 0} player{members?.length !== 1 ? 's' : ''}
          </Text>
        </View>
      )}

      {isLoading ? (
        <ActivityIndicator
          size="large"
          color={Colors.primary}
          style={styles.loader}
        />
      ) : members && members.length > 0 ? (
        <FlatList
          data={members}
          keyExtractor={(item) => item.athlete_id}
          renderItem={({ item }) => (
            <PlayerCard
              member={item}
              onPress={() =>
                router.push(`/(coach)/players/${item.athlete_id}`)
              }
            />
          )}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <View style={styles.empty}>
          <Ionicons name="people-outline" size={48} color={Colors.textTertiary} />
          <Text style={styles.emptyTitle}>No players yet</Text>
          <Text style={styles.emptyText}>
            Share your team invite code with your athletes so they can connect
            with you. Go to the Team tab to find your code.
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  teamHeader: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  teamName: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  playerCount: {
    fontSize: FontSize.xs,
    color: Colors.textTertiary,
    marginTop: 2,
  },
  loader: {
    marginTop: Spacing.xxl,
  },
  list: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
    gap: Spacing.sm,
  },
  emptyTitle: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.text,
  },
  emptyText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
});
