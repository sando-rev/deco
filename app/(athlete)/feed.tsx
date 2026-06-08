import React from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useMyTeams } from '../../src/hooks/useTeam';
import { useFeedEvents } from '../../src/hooks/useFeed';
import { FeedEventCard } from '../../src/components/FeedEventCard';
import { Colors, Spacing, FontSize } from '../../src/constants/theme';

export default function AthleteFeedScreen() {
  const { t } = useTranslation();
  const { data: teams } = useMyTeams();
  const teamId = teams?.[0]?.id;
  const { data: events, isLoading, refetch } = useFeedEvents(teamId);

  return (
    <View style={styles.container}>
      {isLoading ? (
        <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: Spacing.xxl }} />
      ) : events && events.length > 0 ? (
        <FlatList
          data={events}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          onRefresh={refetch}
          refreshing={isLoading}
          renderItem={({ item }) => <FeedEventCard event={item} />}
        />
      ) : (
        <View style={styles.empty}>
          <Ionicons name="newspaper-outline" size={48} color={Colors.textTertiary} />
          <Text style={styles.emptyTitle}>{t('feed.title')}</Text>
          <Text style={styles.emptyText}>{t('feed.empty')}</Text>
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
