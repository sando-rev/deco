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
import { Colors, Spacing, FontSize } from '../../../src/constants/theme';

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
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: Spacing.md }} contentContainerStyle={{ gap: Spacing.sm, paddingHorizontal: Spacing.lg }}>
          {teams.map((t) => (
            <TouchableOpacity
              key={t.id}
              style={[
                { paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs, borderRadius: 999, backgroundColor: t.id === team?.id ? Colors.primary : Colors.surfaceSecondary, borderWidth: 1.5, borderColor: t.id === team?.id ? Colors.primary : Colors.border },
              ]}
              onPress={() => setActiveTeam(t)}
            >
              <Text style={{ fontSize: 14, fontWeight: '600', color: t.id === team?.id ? Colors.white : Colors.textSecondary }}>{t.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
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
});
