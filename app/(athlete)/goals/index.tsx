import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useGoals } from '../../../src/hooks/useGoals';
import { useSkillDefinitions } from '../../../src/hooks/useSkills';
import { GoalCard } from '../../../src/components/GoalCard';
import { Colors, Spacing, FontSize, BorderRadius } from '../../../src/constants/theme';
import { GoalStatus } from '../../../src/types/database';

export default function GoalsScreen() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<GoalStatus | 'all'>('active');
  const router = useRouter();

  const TABS: { key: GoalStatus | 'all'; label: string }[] = [
    { key: 'active', label: t('goals.active') },
    { key: 'achieved', label: t('goals.achieved') },
    { key: 'all', label: t('goals.all') },
  ];
  const { data: goals, isLoading } = useGoals(
    undefined,
    activeTab === 'all' ? undefined : activeTab
  );
  const { data: skillDefs } = useSkillDefinitions();

  return (
    <View style={styles.container}>
      <View style={styles.tabs}>
        {TABS.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, activeTab === tab.key && styles.tabActive]}
            onPress={() => setActiveTab(tab.key)}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === tab.key && styles.tabTextActive,
              ]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {isLoading ? (
        <ActivityIndicator
          size="large"
          color={Colors.primary}
          style={styles.loader}
        />
      ) : goals && goals.length > 0 ? (
        <FlatList
          data={goals}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <GoalCard
              goal={item}
              showAiFeedback
              skillDefinitions={skillDefs}
              onPress={() => router.push(`/(athlete)/goals/${item.id}`)}
            />
          )}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <View style={styles.empty}>
          <Ionicons name="flag-outline" size={48} color={Colors.textTertiary} />
          <Text style={styles.emptyTitle}>{t('goals.noGoals')}</Text>
          <Text style={styles.emptyText}>
            {t('goals.noGoalsDesc')}
          </Text>
        </View>
      )}

      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push('/(athlete)/goals/new')}
        activeOpacity={0.8}
      >
        <Ionicons name="add" size={28} color={Colors.white} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
    gap: Spacing.sm,
  },
  tab: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surfaceSecondary,
  },
  tabActive: {
    backgroundColor: Colors.primary,
  },
  tabText: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  tabTextActive: {
    color: Colors.white,
  },
  list: {
    padding: Spacing.lg,
    paddingBottom: 100,
  },
  loader: {
    marginTop: Spacing.xxl,
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
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
});
