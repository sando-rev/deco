import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { format, startOfWeek, addWeeks, subWeeks } from 'date-fns';
import { nl, enUS } from 'date-fns/locale';
import { useActiveTeam } from '../../src/hooks/useActiveTeam';
import {
  useWeeklyPlayerStats,
  useWeeklyActions,
  useSaveWeeklyAction,
  WeeklyActionType,
  PlayerWeekStats,
} from '../../src/hooks/useWeeklyOverview';
import { Colors, Spacing, FontSize, BorderRadius } from '../../src/constants/theme';
import { Card } from '../../src/components/ui/Card';

// ─── Action button colours ──────────────────────────────────────────────────

const ACTION_COLORS: Record<WeeklyActionType, string> = {
  good: '#2D9B6A',
  respond: Colors.primary,
  attention: '#F5A623',
};

const ACTION_ICONS: Record<WeeklyActionType, keyof typeof Ionicons.glyphMap> = {
  good: 'checkmark-circle',
  respond: 'chatbubble',
  attention: 'alert-circle',
};

// ─── Player Row ─────────────────────────────────────────────────────────────

interface PlayerRowProps {
  player: PlayerWeekStats;
  currentAction?: WeeklyActionType;
  currentMessage?: string | null;
  onAction: (type: WeeklyActionType, message?: string) => void;
  hasUnresolvedOutlier?: boolean;
  highlighted?: boolean;
  t: any;
}

function PlayerRow({ player, currentAction, currentMessage, onAction, hasUnresolvedOutlier, highlighted, t }: PlayerRowProps) {
  const [showRespondInput, setShowRespondInput] = useState(false);
  const [message, setMessage] = useState(currentMessage ?? '');

  const handleAction = (type: WeeklyActionType) => {
    if (type === 'respond') {
      setShowRespondInput(!showRespondInput);
      return;
    }
    // Toggle off if already selected
    if (currentAction === type) return;
    onAction(type);
  };

  const handleSendMessage = () => {
    onAction('respond', message.trim());
    setShowRespondInput(false);
  };

  return (
    <Card style={StyleSheet.flatten([styles.playerCard, highlighted && styles.playerCardHighlighted])}>
      <View style={styles.playerHeader}>
        <View style={styles.playerInfo}>
          <Text style={styles.playerName}>{player.name}</Text>
          {hasUnresolvedOutlier && (
            <View style={styles.outlierBadge}>
              <Ionicons name="alert-circle" size={12} color="#F5A623" />
              <Text style={styles.outlierBadgeText}>{t('overview.unresolvedOutlier')}</Text>
            </View>
          )}
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Ionicons name="barbell-outline" size={14} color={Colors.textTertiary} />
              <Text style={styles.statValue}>{player.trainingCount}</Text>
            </View>
            <View style={styles.statItem}>
              <Ionicons name="journal-outline" size={14} color={Colors.textTertiary} />
              <Text style={styles.statValue}>{player.reflectionCount}</Text>
            </View>
            {player.avgScore !== null && (
              <View style={styles.statItem}>
                <Ionicons name="star" size={14} color="#F5A623" />
                <Text style={styles.statValue}>{player.avgScore.toFixed(1)}</Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.actionGroup}>
          {(['good', 'respond', 'attention'] as WeeklyActionType[]).map((type) => {
            const active = currentAction === type;
            const color = ACTION_COLORS[type];
            return (
              <TouchableOpacity
                key={type}
                style={[
                  styles.actionBtn,
                  active && { backgroundColor: color, borderColor: color },
                  !active && { borderColor: Colors.border },
                ]}
                onPress={() => handleAction(type)}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={ACTION_ICONS[type]}
                  size={16}
                  color={active ? Colors.white : Colors.textTertiary}
                />
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Respond text input */}
      {showRespondInput && (
        <View style={styles.respondContainer}>
          <TextInput
            style={styles.respondInput}
            placeholder={t('overview.messagePlaceholder')}
            placeholderTextColor={Colors.textTertiary}
            value={message}
            onChangeText={(text) => setMessage(text.slice(0, 280))}
            multiline
            maxLength={280}
          />
          <View style={styles.respondFooter}>
            <Text style={styles.charCount}>{message.length}/280</Text>
            <TouchableOpacity
              style={[styles.sendBtn, !message.trim() && { opacity: 0.4 }]}
              onPress={handleSendMessage}
              disabled={!message.trim()}
            >
              <Text style={styles.sendBtnText}>{t('overview.send')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Show existing message if action is 'respond' and input is not open */}
      {currentAction === 'respond' && currentMessage && !showRespondInput && (
        <Text style={styles.existingMessage}>"{currentMessage}"</Text>
      )}
    </Card>
  );
}

// ─── Main Screen ────────────────────────────────────────────────────────────

export default function WeeklyOverviewScreen() {
  const { t, i18n } = useTranslation();
  const { highlightAthleteId } = useLocalSearchParams<{ highlightAthleteId?: string }>();
  const { activeTeam: team } = useActiveTeam();
  const locale = i18n.language === 'nl' ? nl : enUS;

  const [weekOffset, setWeekOffset] = useState(0);
  const currentWeekStart = useMemo(() => {
    const base = startOfWeek(new Date(), { weekStartsOn: 1 });
    const target = weekOffset === 0 ? base : addWeeks(base, weekOffset);
    return format(target, 'yyyy-MM-dd');
  }, [weekOffset]);

  const weekLabel = format(new Date(currentWeekStart), 'd MMMM yyyy', { locale });

  const { data: players, isLoading: loadingStats } = useWeeklyPlayerStats(team?.id, currentWeekStart);
  const { data: actions } = useWeeklyActions(team?.id, currentWeekStart);
  const saveAction = useSaveWeeklyAction();

  // Map actions by athlete_id for quick lookup
  const actionMap = useMemo(() => {
    const map = new Map<string, { type: WeeklyActionType; message: string | null }>();
    for (const a of actions ?? []) {
      map.set(a.athlete_id, { type: a.action_type as WeeklyActionType, message: a.message });
    }
    return map;
  }, [actions]);

  const handleAction = async (athleteId: string, type: WeeklyActionType, message?: string) => {
    if (!team?.id) return;
    try {
      await saveAction.mutateAsync({
        teamId: team.id,
        athleteId,
        weekStart: currentWeekStart,
        actionType: type,
        message,
      });
    } catch (error: any) {
      Alert.alert(t('common.error'), error.message);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Week navigation header */}
      <View style={styles.weekNav}>
        <TouchableOpacity onPress={() => setWeekOffset(weekOffset - 1)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="chevron-back" size={24} color={Colors.primary} />
        </TouchableOpacity>
        <View style={styles.weekInfo}>
          <Text style={styles.weekTitle}>{t('overview.title')}</Text>
          <Text style={styles.weekLabel}>{t('overview.weekOf', { date: weekLabel })}</Text>
        </View>
        <TouchableOpacity
          onPress={() => setWeekOffset(weekOffset + 1)}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          disabled={weekOffset >= 0}
        >
          <Ionicons name="chevron-forward" size={24} color={weekOffset >= 0 ? Colors.border : Colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Stats legend */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <Ionicons name="barbell-outline" size={12} color={Colors.textTertiary} />
          <Text style={styles.legendText}>{t('overview.trainings')}</Text>
        </View>
        <View style={styles.legendItem}>
          <Ionicons name="journal-outline" size={12} color={Colors.textTertiary} />
          <Text style={styles.legendText}>{t('overview.reflections')}</Text>
        </View>
        <View style={styles.legendItem}>
          <Ionicons name="star" size={12} color="#F5A623" />
          <Text style={styles.legendText}>{t('overview.avgScore')}</Text>
        </View>
      </View>

      {/* Player list */}
      {loadingStats ? (
        <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: Spacing.xxl }} />
      ) : players && players.length > 0 ? (
        <FlatList
          data={players}
          keyExtractor={(item) => item.athleteId}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          renderItem={({ item }) => {
            const action = actionMap.get(item.athleteId);
            return (
              <PlayerRow
                player={item}
                currentAction={action?.type}
                currentMessage={action?.message}
                onAction={(type, msg) => handleAction(item.athleteId, type, msg)}
                hasUnresolvedOutlier={item.hasUnresolvedOutlier}
                highlighted={item.athleteId === highlightAthleteId}
                t={t}
              />
            );
          }}
        />
      ) : (
        <View style={styles.empty}>
          <Ionicons name="people-outline" size={48} color={Colors.textTertiary} />
          <Text style={styles.emptyTitle}>{t('overview.noPlayers')}</Text>
          <Text style={styles.emptyText}>{t('overview.noPlayersDesc')}</Text>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  weekNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  weekInfo: {
    alignItems: 'center',
  },
  weekTitle: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.text,
  },
  weekLabel: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.lg,
    paddingBottom: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
    marginHorizontal: Spacing.lg,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendText: {
    fontSize: FontSize.xs,
    color: Colors.textTertiary,
  },
  list: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
  playerCard: {
    marginBottom: Spacing.md,
    padding: Spacing.md,
  },
  playerCardHighlighted: {
    borderWidth: 1.5,
    borderColor: '#F5A623',
    backgroundColor: '#F5A623' + '10',
  },
  playerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  playerInfo: {
    flex: 1,
    minWidth: 0,
  },
  playerName: {
    fontSize: FontSize.md,
    fontWeight: '700',
    color: Colors.text,
  },
  outlierBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F5A623' + '20',
    paddingHorizontal: Spacing.xs,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
    marginTop: 4,
  },
  outlierBadgeText: {
    fontSize: FontSize.xs,
    fontWeight: '600',
    color: '#F5A623',
  },
  statsRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: 4,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  statValue: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  actionGroup: {
    flexDirection: 'row',
    gap: Spacing.xs,
    flexShrink: 0,
  },
  actionBtn: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.sm,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
  },
  respondContainer: {
    marginTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    paddingTop: Spacing.sm,
  },
  respondInput: {
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
  respondFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.xs,
  },
  charCount: {
    fontSize: FontSize.xs,
    color: Colors.textTertiary,
  },
  sendBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  sendBtnText: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.white,
  },
  existingMessage: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    fontStyle: 'italic',
    marginTop: Spacing.sm,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
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
