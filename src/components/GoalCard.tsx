import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Goal, SkillDefinition } from '../types/database';
import { Colors, Spacing, FontSize, BorderRadius } from '../constants/theme';
import { Card } from './ui/Card';
import { format, differenceInDays } from 'date-fns';

interface GoalCardProps {
  goal: Goal;
  onPress?: () => void;
  showAiFeedback?: boolean;
  coachView?: boolean;
  skillDefinitions?: SkillDefinition[];
}

export function GoalCard({ goal, onPress, showAiFeedback = false, coachView = false, skillDefinitions }: GoalCardProps) {
  // Look up skill label from definitions, fall back to attribute
  const skillLabel = (() => {
    if (goal.skill_id && skillDefinitions) {
      const skill = skillDefinitions.find((s) => s.id === goal.skill_id);
      if (skill) return skill.label;
    }
    if (goal.attribute) {
      return goal.attribute.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase());
    }
    return null;
  })();

  const daysLeft = goal.deadline
    ? differenceInDays(new Date(goal.deadline), new Date())
    : null;
  const isOverdue = daysLeft !== null && daysLeft < 0;

  const statusConfig = {
    active: { color: Colors.primary, label: 'Active', icon: 'radio-button-on' as const },
    achieved: { color: Colors.success, label: 'Achieved', icon: 'checkmark-circle' as const },
    abandoned: { color: Colors.textTertiary, label: 'Abandoned', icon: 'close-circle' as const },
  };

  const status = statusConfig[goal.status];

  return (
    <TouchableOpacity onPress={onPress} disabled={!onPress} activeOpacity={0.7}>
      <Card style={styles.card}>
        <View style={styles.header}>
          <View style={[styles.statusBadge, { backgroundColor: status.color + '15' }]}>
            <Ionicons name={status.icon} size={14} color={status.color} />
            <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
          </View>
          {skillLabel && (
            <View style={styles.attributeBadge}>
              <Text style={styles.attributeText}>{skillLabel}</Text>
            </View>
          )}
        </View>

        <Text style={styles.title}>{goal.title}</Text>
        {goal.description && (
          <Text style={styles.description} numberOfLines={2}>
            {goal.description}
          </Text>
        )}

        <View style={styles.footer}>
          {goal.status === 'achieved' && goal.score_improvement ? (
            <View style={styles.targetContainer}>
              <Ionicons name="trending-up" size={14} color={Colors.success} />
              <Text style={[styles.footerText, { color: Colors.success, fontWeight: '600' }]}>
                +{goal.score_improvement} improvement
              </Text>
            </View>
          ) : skillLabel ? (
            <View style={styles.targetContainer}>
              <Ionicons name="flag-outline" size={14} color={Colors.textSecondary} />
              <Text style={styles.footerText}>{skillLabel}</Text>
            </View>
          ) : (
            <View />
          )}
          {daysLeft !== null && (
            <View style={styles.deadlineContainer}>
              <Ionicons
                name="calendar-outline"
                size={14}
                color={isOverdue ? Colors.error : Colors.textSecondary}
              />
              <Text
                style={[
                  styles.footerText,
                  isOverdue && { color: Colors.error },
                ]}
              >
                {goal.status === 'active'
                  ? isOverdue
                    ? `${Math.abs(daysLeft)}d overdue`
                    : `${daysLeft}d left`
                  : format(new Date(goal.deadline!), 'MMM d')}
              </Text>
            </View>
          )}
        </View>

        {showAiFeedback && goal.ai_feedback && (
          <View style={styles.aiFeedback}>
            <View style={styles.aiHeader}>
              <Ionicons name="sparkles" size={14} color={Colors.accent} />
              <Text style={styles.aiLabel}>Deco AI Feedback</Text>
            </View>
            <Text style={styles.aiText}>{goal.ai_feedback}</Text>
          </View>
        )}
      </Card>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: Spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  statusText: {
    fontSize: FontSize.xs,
    fontWeight: '600',
  },
  attributeBadge: {
    backgroundColor: Colors.surfaceSecondary,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  attributeText: {
    fontSize: FontSize.xs,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
  title: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 4,
  },
  description: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    lineHeight: 20,
    marginBottom: Spacing.sm,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  targetContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  deadlineContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  footerText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  aiFeedback: {
    marginTop: Spacing.md,
    padding: Spacing.md,
    backgroundColor: Colors.accent + '10',
    borderRadius: BorderRadius.sm,
    borderLeftWidth: 3,
    borderLeftColor: Colors.accent,
  },
  aiHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: Spacing.xs,
  },
  aiLabel: {
    fontSize: FontSize.xs,
    fontWeight: '700',
    color: Colors.accent,
  },
  aiText: {
    fontSize: FontSize.sm,
    color: Colors.text,
    lineHeight: 20,
  },
});
