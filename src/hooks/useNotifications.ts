import { useEffect, useRef } from 'react';
import { Linking, Platform } from 'react-native';
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

/**
 * Navigate to the correct screen based on notification data.
 * Delayed slightly so AuthGate finishes its redirect first.
 */
function handleNotificationNavigation(data: Record<string, unknown>) {
  // Delay to let AuthGate settle on the correct root screen first.
  // 1000ms gives enough time for auth + profile load + AuthGate redirect.
  setTimeout(() => {
    console.log('[Notifications] Navigating for data:', JSON.stringify(data));

    // External URL — open in browser
    if (data?.url && typeof data.url === 'string') {
      console.log('[Notifications] Opening external URL:', data.url);
      Linking.openURL(data.url as string);
      return;
    }

    // Generic screen navigation from admin panel
    if (data?.screen && typeof data.screen === 'string') {
      console.log('[Notifications] Navigating to screen:', data.screen);
      router.push(data.screen as any);
      return;
    }

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
  }, 1000);
}

export function useNotifications() {
  const { user, profile } = useAuth();
  const notificationListener = useRef<Notifications.EventSubscription | null>(null);
  const responseListener = useRef<Notifications.EventSubscription | null>(null);
  const coldStartHandled = useRef(false);

  useEffect(() => {
    if (!user || !profile) return;

    // Get push token — request permission if not yet granted.
    // Notifications are critical for the app experience, so we always ensure
    // the user has been prompted and the token is saved.
    (async () => {
      let token = await getPushTokenIfGranted();

      // If no token (permission not granted or never asked), request it
      if (!token && Device.isDevice) {
        console.log('[Notifications] No push token, requesting permission...');
        token = await requestPushPermission();
      }

      if (token) {
        // Clear this token from ALL other profiles first.
        // This prevents duplicate notifications when multiple accounts
        // have been used on the same device.
        await supabase
          .from('profiles')
          .update({ push_token: null })
          .eq('push_token', token)
          .neq('id', user.id);

        // Save token to current user's profile
        if (token !== profile.push_token) {
          const { error } = await supabase
            .from('profiles')
            .update({ push_token: token })
            .eq('id', user.id);
          if (error) {
            console.error('Failed to save push token:', error);
          } else {
            console.log('[Notifications] Push token saved, cleared from other accounts');
          }
        }
      } else {
        console.log('[Notifications] User denied notification permission');
      }
    })();

    // Handle cold-start: check if the app was opened by tapping a notification.
    // The response listener below only catches taps while the listener is active.
    // On cold start, the tap event fires before this effect runs, so we need
    // getLastNotificationResponseAsync() to retrieve it.
    if (!coldStartHandled.current) {
      coldStartHandled.current = true;
      Notifications.getLastNotificationResponseAsync().then((response) => {
        if (response) {
          const data = response.notification.request.content.data;
          console.log('[Notifications] Cold start notification:', data);
          handleNotificationNavigation(data);
        }
      });
    }

    // Listen for incoming notifications while app is foregrounded
    notificationListener.current =
      Notifications.addNotificationReceivedListener((notification) => {
        console.log('Notification received:', notification);
      });

    // Listen for user interaction with notification (warm/background start)
    responseListener.current =
      Notifications.addNotificationResponseReceivedListener((response) => {
        const data = response.notification.request.content.data;
        console.log('[Notifications] Notification tapped:', data);
        handleNotificationNavigation(data);
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
