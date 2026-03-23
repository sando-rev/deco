import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { router } from 'expo-router';
import { supabase } from '../services/supabase';
import { useAuth } from './useAuth';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/**
 * Gets the push token if permission is already granted.
 * Does NOT request permission — onboarding handles that.
 * For existing users who granted permission before, this retrieves the token.
 */
async function getPushTokenIfGranted(): Promise<string | null> {
  if (!Device.isDevice) {
    return null;
  }

  const { status } = await Notifications.getPermissionsAsync();
  if (status !== 'granted') {
    return null;
  }

  const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? '1d4ac95d-3bd4-4fc4-aa17-2df95e766acc';
  const tokenData = await Notifications.getExpoPushTokenAsync({
    projectId,
  });

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
    });
  }

  return tokenData.data;
}

/**
 * Requests push notification permission and returns the token.
 * Call this explicitly from onboarding or settings.
 */
export async function requestPushPermission(): Promise<string | null> {
  if (!Device.isDevice) return null;

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') return null;

  const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? '1d4ac95d-3bd4-4fc4-aa17-2df95e766acc';
  const tokenData = await Notifications.getExpoPushTokenAsync({ projectId });

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
    });
  }

  return tokenData.data;
}

export function useNotifications() {
  const { user, profile } = useAuth();
  const notificationListener = useRef<Notifications.EventSubscription | null>(null);
  const responseListener = useRef<Notifications.EventSubscription | null>(null);

  useEffect(() => {
    if (!user || !profile) return;

    // Get push token if permission already granted, and save to profile
    getPushTokenIfGranted().then(async (token) => {
      if (token && token !== profile.push_token) {
        const { error } = await supabase
          .from('profiles')
          .update({ push_token: token })
          .eq('id', user.id);
        if (error) {
          console.error('Failed to save push token:', error);
        } else {
          console.log('Push token saved successfully');
        }
      }
    });

    // Listen for incoming notifications while app is foregrounded
    notificationListener.current =
      Notifications.addNotificationReceivedListener((notification) => {
        console.log('Notification received:', notification);
      });

    // Listen for user interaction with notification
    responseListener.current =
      Notifications.addNotificationResponseReceivedListener((response) => {
        const data = response.notification.request.content.data;
        console.log('Notification tapped:', data);

        if (data?.type === 'session_focus') {
          router.push({
            pathname: '/(athlete)/development/session-goals' as any,
            params: data?.sessionId ? { sessionId: data.sessionId as string } : {},
          });
        } else if (data?.type === 'post_training') {
          router.push({
            pathname: '/(athlete)/development/reflect' as any,
            params: data?.sessionId ? { sessionId: data.sessionId as string } : {},
          });
        } else if (data?.type === 'coach_feedback' && data?.goalId) {
          router.push({
            pathname: '/(athlete)/goals/[id]' as any,
            params: { id: data.goalId as string },
          });
        } else if (data?.type === 'weekly_review') {
          router.push('/(athlete)/development/reflect' as any);
        } else if (data?.type === 'coach_report') {
          router.push('/(coach)/reports' as any);
        }
      });

    return () => {
      notificationListener.current?.remove();
      responseListener.current?.remove();
    };
  }, [user, profile]);
}

// Helper to schedule a local notification (for testing)
export async function scheduleLocalNotification(
  title: string,
  body: string,
  seconds = 1
) {
  await Notifications.scheduleNotificationAsync({
    content: { title, body, sound: true },
    trigger: { seconds, type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL },
  });
}
