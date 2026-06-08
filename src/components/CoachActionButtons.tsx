import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Colors, Spacing, FontSize, BorderRadius } from '../constants/theme';

export type CoachActionType = 'good' | 'respond' | 'attention';

const ACTION_COLORS: Record<CoachActionType, string> = {
  good: '#2D9B6A',
  respond: Colors.primary,
  attention: '#F5A623',
};

const ACTION_ICONS: Record<CoachActionType, keyof typeof Ionicons.glyphMap> = {
  good: 'checkmark-circle',
  respond: 'chatbubble',
  attention: 'alert-circle',
};

interface CoachActionButtonsProps {
  currentAction?: CoachActionType;
  currentMessage?: string | null;
  onAction: (type: CoachActionType, message?: string) => void;
  compact?: boolean;
}

export function CoachActionButtons({
  currentAction,
  currentMessage,
  onAction,
  compact,
}: CoachActionButtonsProps) {
  const { t } = useTranslation();
  const [showRespondInput, setShowRespondInput] = useState(false);
  const [message, setMessage] = useState(currentMessage ?? '');

  const handleAction = (type: CoachActionType) => {
    if (type === 'respond') {
      setShowRespondInput(!showRespondInput);
      return;
    }
    if (currentAction === type) return;
    onAction(type);
  };

  const handleSendMessage = () => {
    onAction('respond', message.trim());
    setShowRespondInput(false);
  };

  const btnSize = compact ? 30 : 36;

  return (
    <View>
      <View style={styles.actionGroup}>
        {(['good', 'respond', 'attention'] as CoachActionType[]).map((type) => {
          const active = currentAction === type;
          const color = ACTION_COLORS[type];
          return (
            <TouchableOpacity
              key={type}
              style={[
                styles.actionBtn,
                { width: btnSize, height: btnSize },
                active && { backgroundColor: color, borderColor: color },
                !active && { borderColor: Colors.border },
              ]}
              onPress={() => handleAction(type)}
              activeOpacity={0.7}
            >
              <Ionicons
                name={ACTION_ICONS[type]}
                size={compact ? 14 : 16}
                color={active ? Colors.white : Colors.textTertiary}
              />
            </TouchableOpacity>
          );
        })}
      </View>

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

      {currentAction === 'respond' && currentMessage && !showRespondInput && (
        <Text style={styles.existingMessage}>"{currentMessage}"</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  actionGroup: {
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  actionBtn: {
    borderRadius: BorderRadius.sm,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
  },
  respondContainer: {
    marginTop: Spacing.sm,
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
  },
});
