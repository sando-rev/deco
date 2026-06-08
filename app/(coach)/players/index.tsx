import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useTeamMembers } from '../../../src/hooks/useTeam';
import { useActiveTeam } from '../../../src/hooks/useActiveTeam';
import { PlayerCard } from '../../../src/components/PlayerCard';
import { Colors, Spacing, FontSize, BorderRadius } from '../../../src/constants/theme';

export default function PlayersScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { activeTeam: team, teams, setActiveTeam, isLoading: loadingTeam } = useActiveTeam();
  const { data: members, isLoading: loadingMembers } = useTeamMembers(team?.id);

  const isLoading = loadingTeam || loadingMembers;

  return (
    <View style={styles.container}>
      {team && (
        <View style={styles.teamHeader}>
          <Text style={styles.teamName}>{team.name}</Text>
          <Text style={styles.playerCount}>
            {t('coach.playerCount', { count: members?.length ?? 0 })}
          </Text>
        </View>
      )}

      {/* Team selector */}
      {teams.length > 1 && (
        <View style={{ flexDirection: 'row', gap: Spacing.sm, paddingHorizontal: Spacing.lg, marginBottom: Spacing.md, flexWrap: 'wrap' }}>
          {teams.map((tm) => (
            <TouchableOpacity
              key={tm.id}
              style={[
                styles.teamSelectorButton,
                tm.id === team?.id ? styles.teamSelectorActive : styles.teamSelectorInactive,
              ]}
              onPress={() => setActiveTeam(tm)}
            >
              <Text style={[styles.teamSelectorText, tm.id === team?.id ? styles.teamSelectorTextActive : styles.teamSelectorTextInactive]}>{tm.name}</Text>
            </TouchableOpacity>
          ))}
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
          <Text style={styles.emptyTitle}>{t('coach.noPlayersTitle')}</Text>
          <Text style={styles.emptyText}>
            {t('coach.noPlayersDesc')}
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
  teamSelectorButton: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm + 2,
    borderRadius: BorderRadius.full,
    borderWidth: 1.5,
  },
  teamSelectorActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  teamSelectorInactive: {
    backgroundColor: Colors.surfaceSecondary,
    borderColor: Colors.border,
  },
  teamSelectorText: {
    fontSize: FontSize.md,
    fontWeight: '600',
  },
  teamSelectorTextActive: {
    color: Colors.white,
  },
  teamSelectorTextInactive: {
    color: Colors.textSecondary,
  },
});
