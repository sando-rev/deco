import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useActiveTeam } from '../../src/hooks/useActiveTeam';
import { useFeedEvents, useCreateAnnouncement } from '../../src/hooks/useFeed';
import { FeedEventCard } from '../../src/components/FeedEventCard';
import { Colors, Spacing, FontSize, BorderRadius } from '../../src/constants/theme';

export default function CoachFeedScreen() {
  const { t } = useTranslation();
  const { activeTeam: team } = useActiveTeam();
  const { data: events, isLoading, refetch } = useFeedEvents(team?.id);
  const createAnnouncement = useCreateAnnouncement();
  const [announcement, setAnnouncement] = useState('');
  const [showInput, setShowInput] = useState(false);

  const handlePost = async () => {
    if (!announcement.trim() || !team?.id) return;
    try {
      await createAnnouncement.mutateAsync({ teamId: team.id, message: announcement.trim() });
      setAnnouncement('');
      setShowInput(false);
    } catch (error: any) {
      Alert.alert(t('common.error'), error.message);
    }
  };

  return (
    <View style={styles.container}>
      {/* Coach announcement input */}
      <View style={styles.announcementSection}>
        {showInput ? (
          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              placeholder={t('feed.announcementPlaceholder')}
              placeholderTextColor={Colors.textTertiary}
              value={announcement}
              onChangeText={setAnnouncement}
              multiline
              maxLength={280}
            />
            <View style={styles.inputActions}>
              <TouchableOpacity onPress={() => { setShowInput(false); setAnnouncement(''); }}>
                <Ionicons name="close" size={20} color={Colors.textTertiary} />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handlePost}
                disabled={!announcement.trim() || createAnnouncement.isPending}
              >
                <Ionicons name="send" size={20} color={announcement.trim() ? Colors.primary : Colors.textTertiary} />
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <TouchableOpacity style={styles.addBtn} onPress={() => setShowInput(true)}>
            <Ionicons name="megaphone-outline" size={16} color={Colors.primary} />
            <Text style={styles.addBtnText}>{t('feed.postAnnouncement')}</Text>
          </TouchableOpacity>
        )}
      </View>

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
  announcementSection: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.xs,
  },
  addBtnText: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.primary,
  },
  inputRow: {
    gap: Spacing.xs,
  },
  input: {
    minHeight: 60,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
    fontSize: FontSize.sm,
    color: Colors.text,
    backgroundColor: Colors.surface,
    textAlignVertical: 'top',
  },
  inputActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: Spacing.md,
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
