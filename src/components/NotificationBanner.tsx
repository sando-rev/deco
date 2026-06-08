import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Linking, Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Colors, Spacing, FontSize, BorderRadius } from '../constants/theme';
import { useAuth } from '../hooks/useAuth';

export function NotificationBanner() {
  const { t } = useTranslation();
  const { profile } = useAuth();
  const [denied, setDenied] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (!Device.isDevice) return;
    if (!profile) return;

    // Only show if user has no push token saved
    if (profile.push_token) {
      setDenied(false);
      return;
    }

    // Check actual device permission status
    Notifications.getPermissionsAsync().then(({ status }) => {
      setDenied(status === 'denied' || status === 'undetermined');
    });
  }, [profile]);

  if (!denied || dismissed) return null;

  const openSettings = () => {
    if (Platform.OS === 'ios') {
      Linking.openURL('app-settings:');
    } else {
      Linking.openSettings();
    }
  };

  return (
    <View style={styles.banner}>
      <View style={styles.iconWrap}>
        <Ionicons name="notifications-off-outline" size={20} color={Colors.accent} />
      </View>
      <View style={styles.textWrap}>
        <Text style={styles.title}>{t('notificationBanner.title')}</Text>
        <Text style={styles.body}>{t('notificationBanner.body')}</Text>
      </View>
      <TouchableOpacity style={styles.button} onPress={openSettings}>
        <Text style={styles.buttonText}>{t('notificationBanner.action')}</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.close} onPress={() => setDismissed(true)}>
        <Ionicons name="close" size={16} color={Colors.textTertiary} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.accent + '15',
    borderWidth: 1,
    borderColor: Colors.accent + '30',
    borderRadius: BorderRadius.md,
    marginHorizontal: Spacing.md,
    marginTop: Spacing.sm,
    marginBottom: Spacing.xs,
    padding: Spacing.sm,
    gap: Spacing.sm,
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.accent + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textWrap: {
    flex: 1,
  },
  title: {
    fontSize: FontSize.sm,
    fontWeight: '700',
    color: Colors.text,
  },
  body: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  button: {
    backgroundColor: Colors.accent,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
    borderRadius: BorderRadius.sm,
  },
  buttonText: {
    fontSize: FontSize.xs,
    fontWeight: '700',
    color: Colors.white,
  },
  close: {
    padding: 4,
  },
});
