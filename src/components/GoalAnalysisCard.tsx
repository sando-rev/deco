import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GoalAiAnalysis } from '../types/database';
import { Colors, Spacing, FontSize, BorderRadius } from '../constants/theme';
import { Card } from './ui/Card';

interface GoalAnalysisCardProps {
  analysis: GoalAiAnalysis;
}

function ScoreBar({ label, score, icon }: { label: string; score: number; icon: string }) {
  const getColor = (s: number) => {
    if (s >= 7) return Colors.success;
    if (s >= 4) return Colors.accent;
    return Colors.error;
  };

  const color = getColor(score);

  return (
    <View style={styles.scoreBarContainer}>
      <View style={styles.scoreBarHeader}>
        <View style={styles.scoreBarLabel}>
          <Ionicons name={icon as any} size={14} color={color} />
          <Text style={styles.scoreBarLabelText}>{label}</Text>
        </View>
        <Text style={[styles.scoreBarValue, { color }]}>{score}/10</Text>
      </View>
      <View style={styles.scoreBarTrack}>
        <View
          style={[
            styles.scoreBarFill,
            { width: `${(score / 10) * 100}%`, backgroundColor: color },
          ]}
        />
      </View>
    </View>
  );
}

export function GoalAnalysisCard({ analysis }: GoalAnalysisCardProps) {
  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <Ionicons name="sparkles" size={16} color={Colors.accent} />
        <Text style={styles.headerText}>AI Goal Analysis</Text>
      </View>

      <View style={styles.scores}>
        <ScoreBar
          label="Specificity"
          score={analysis.specificity_score}
          icon="target-outline"
        />
        <ScoreBar
          label="Measurability"
          score={analysis.measurability_score}
          icon="analytics-outline"
        />
        <ScoreBar
          label="Challenge Level"
          score={analysis.challenge_score}
          icon="trending-up-outline"
        />
      </View>

      <Text style={styles.feedback}>{analysis.feedback}</Text>

      {analysis.suggestions.length > 0 && (
        <View style={styles.suggestions}>
          <Text style={styles.suggestionsTitle}>Suggestions:</Text>
          {analysis.suggestions.map((suggestion, i) => (
            <View key={i} style={styles.suggestionRow}>
              <Ionicons name="bulb-outline" size={14} color={Colors.accent} />
              <Text style={styles.suggestionText}>{suggestion}</Text>
            </View>
          ))}
        </View>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    borderLeftWidth: 3,
    borderLeftColor: Colors.accent,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: Spacing.md,
  },
  headerText: {
    fontSize: FontSize.md,
    fontWeight: '700',
    color: Colors.accent,
  },
  scores: {
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  scoreBarContainer: {
    gap: 4,
  },
  scoreBarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  scoreBarLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  scoreBarLabelText: {
    fontSize: FontSize.sm,
    fontWeight: '500',
    color: Colors.text,
  },
  scoreBarValue: {
    fontSize: FontSize.sm,
    fontWeight: '700',
  },
  scoreBarTrack: {
    height: 6,
    backgroundColor: Colors.surfaceSecondary,
    borderRadius: 3,
    overflow: 'hidden',
  },
  scoreBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  feedback: {
    fontSize: FontSize.sm,
    color: Colors.text,
    lineHeight: 20,
    marginBottom: Spacing.sm,
  },
  suggestions: {
    gap: Spacing.xs,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  suggestionsTitle: {
    fontSize: FontSize.xs,
    fontWeight: '700',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  suggestionRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
  },
  suggestionText: {
    flex: 1,
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
});
