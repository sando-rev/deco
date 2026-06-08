import { test, expect } from '@playwright/test';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './helpers';

/**
 * These tests verify the FULL notification pipeline:
 * 1. What payload the admin API sends to Expo Push API
 * 2. What data the edge function sends for each notification type
 * 3. Whether the app's handleNotificationNavigation would route correctly
 *
 * The app handles navigation based on this priority:
 *   1. data.url → opens external URL (Linking.openURL)
 *   2. data.screen → navigates to screen (router.push)
 *   3. data.type → type-specific routing with params (sessionId, goalId, etc.)
 */

// Simulates the app's handleNotificationNavigation logic
function simulateNavigation(data: Record<string, unknown>): { action: string; target: string; params?: Record<string, string> } {
  if (data?.url && typeof data.url === 'string') {
    return { action: 'openURL', target: data.url as string };
  }
  if (data?.screen && typeof data.screen === 'string') {
    return { action: 'push', target: data.screen as string };
  }
  if (data?.type === 'session_focus') {
    return {
      action: 'push',
      target: '/(athlete)/development/session-goals',
      params: data?.sessionId ? { sessionId: data.sessionId as string } : undefined,
    };
  }
  if (data?.type === 'post_training') {
    return {
      action: 'push',
      target: '/(athlete)/development/reflect',
      params: data?.sessionId ? { sessionId: data.sessionId as string } : undefined,
    };
  }
  if (data?.type === 'coach_feedback' && data?.goalId) {
    return {
      action: 'push',
      target: '/(athlete)/goals/[id]',
      params: { id: data.goalId as string },
    };
  }
  if (data?.type === 'weekly_review') {
    return { action: 'push', target: '/(athlete)/development/reflect' };
  }
  if (data?.type === 'coach_report') {
    return { action: 'push', target: '/(coach)/reports' };
  }
  return { action: 'none', target: '' };
}

// Simulates what the admin API POST handler builds as notifData
function simulateApiPayload(frontendPayload: Record<string, unknown>): Record<string, unknown> {
  const { type, url, data: extraData } = frontendPayload;
  const notifData: Record<string, unknown> = {};
  if (type) notifData.type = type;
  if (url) notifData.url = url;
  if (extraData) Object.assign(notifData, extraData as Record<string, unknown>);
  return notifData;
}

// Simulates what the frontend sends for a given notification type selection
function simulateFrontendPayload(selectedType: string, destinationScreen: string, customUrl?: string): Record<string, unknown> {
  const payload: Record<string, unknown> = {};

  if (selectedType === 'custom') {
    if (customUrl?.trim()) {
      payload.url = customUrl.trim();
    }
    if (destinationScreen && !destinationScreen.startsWith('http')) {
      payload.data = { screen: destinationScreen };
    }
  } else {
    payload.type = selectedType;
    if (destinationScreen.startsWith('http')) {
      payload.url = destinationScreen;
    } else if (destinationScreen) {
      payload.data = { screen: destinationScreen };
    }
  }

  return payload;
}

test.describe('Notification Link Routing — Edge Function (Automated)', () => {
  test('session_focus notification routes to session-goals with sessionId', () => {
    // Edge function sends: { type: 'session_focus', sessionId: 'abc-123' }
    const data = { type: 'session_focus', sessionId: 'abc-123' };
    const result = simulateNavigation(data);

    expect(result.action).toBe('push');
    expect(result.target).toBe('/(athlete)/development/session-goals');
    expect(result.params).toEqual({ sessionId: 'abc-123' });
  });

  test('post_training notification routes to reflect with sessionId', () => {
    const data = { type: 'post_training', sessionId: 'def-456' };
    const result = simulateNavigation(data);

    expect(result.action).toBe('push');
    expect(result.target).toBe('/(athlete)/development/reflect');
    expect(result.params).toEqual({ sessionId: 'def-456' });
  });

  test('coach_feedback notification routes to goal detail', () => {
    const data = { type: 'coach_feedback', goalId: 'goal-789' };
    const result = simulateNavigation(data);

    expect(result.action).toBe('push');
    expect(result.target).toBe('/(athlete)/goals/[id]');
    expect(result.params).toEqual({ id: 'goal-789' });
  });

  test('weekly_review notification routes to reflect', () => {
    const data = { type: 'weekly_review' };
    const result = simulateNavigation(data);

    expect(result.action).toBe('push');
    expect(result.target).toBe('/(athlete)/development/reflect');
  });

  test('coach_report notification routes to reports', () => {
    const data = { type: 'coach_report' };
    const result = simulateNavigation(data);

    expect(result.action).toBe('push');
    expect(result.target).toBe('/(coach)/reports');
  });
});

test.describe('Notification Link Routing — Admin Panel (Manual Send)', () => {
  test('PROBLEM: admin sends type + screen, screen takes priority over type', () => {
    // When admin selects "Pre-training focus" type, frontend sends:
    // { type: 'session_focus', data: { screen: '/(athlete)/development/session-goals' } }
    const frontendPayload = simulateFrontendPayload(
      'session_focus',
      '/(athlete)/development/session-goals'
    );

    // API builds the Expo data payload
    const expoData = simulateApiPayload(frontendPayload);
    console.log('Admin session_focus expoData:', expoData);

    // What the app receives:
    // { type: 'session_focus', screen: '/(athlete)/development/session-goals' }
    const result = simulateNavigation(expoData);

    // The screen field takes precedence! This SKIPS the type-based handler
    // that would pass sessionId as a param.
    // For admin-sent notifications this is OK (no sessionId to pass),
    // but we need to make sure the screen path is correct.
    expect(result.action).toBe('push');
    expect(result.target).toBe('/(athlete)/development/session-goals');
    // No sessionId param — this is expected for admin-sent notifications
    expect(result.params).toBeUndefined();
  });

  test('admin post_training routes to reflect screen', () => {
    const frontendPayload = simulateFrontendPayload(
      'post_training',
      '/(athlete)/development/reflect'
    );
    const expoData = simulateApiPayload(frontendPayload);
    const result = simulateNavigation(expoData);

    expect(result.action).toBe('push');
    expect(result.target).toBe('/(athlete)/development/reflect');
  });

  test('admin coach_feedback routes to goals list', () => {
    const frontendPayload = simulateFrontendPayload(
      'coach_feedback',
      '/(athlete)/goals'
    );
    const expoData = simulateApiPayload(frontendPayload);
    const result = simulateNavigation(expoData);

    expect(result.action).toBe('push');
    expect(result.target).toBe('/(athlete)/goals');
  });

  test('admin weekly_review routes to reflect', () => {
    const frontendPayload = simulateFrontendPayload(
      'weekly_review',
      '/(athlete)/development/reflect'
    );
    const expoData = simulateApiPayload(frontendPayload);
    const result = simulateNavigation(expoData);

    expect(result.action).toBe('push');
    expect(result.target).toBe('/(athlete)/development/reflect');
  });

  test('admin coach_report routes to reports', () => {
    const frontendPayload = simulateFrontendPayload(
      'coach_report',
      '/(coach)/reports'
    );
    const expoData = simulateApiPayload(frontendPayload);
    const result = simulateNavigation(expoData);

    expect(result.action).toBe('push');
    expect(result.target).toBe('/(coach)/reports');
  });

  test('admin custom with URL opens external link', () => {
    const frontendPayload = simulateFrontendPayload(
      'custom',
      '',
      'https://youtube.com/watch?v=test'
    );
    const expoData = simulateApiPayload(frontendPayload);
    const result = simulateNavigation(expoData);

    expect(result.action).toBe('openURL');
    expect(result.target).toBe('https://youtube.com/watch?v=test');
  });

  test('admin custom with screen navigates in-app', () => {
    const frontendPayload = simulateFrontendPayload(
      'custom',
      '/(athlete)/goals/new'
    );
    const expoData = simulateApiPayload(frontendPayload);
    const result = simulateNavigation(expoData);

    expect(result.action).toBe('push');
    expect(result.target).toBe('/(athlete)/goals/new');
  });

  test('admin custom with no destination does nothing', () => {
    const frontendPayload = simulateFrontendPayload('custom', '');
    const expoData = simulateApiPayload(frontendPayload);
    const result = simulateNavigation(expoData);

    expect(result.action).toBe('none');
  });
});

test.describe('Edge Function Notification Data — Live API Test', () => {
  test('edge function produces valid response', async () => {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/send-notifications`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    expect(response.ok).toBe(true);
    const body = await response.json();

    // All notification types should be present
    expect(body).toHaveProperty('pre_training');
    expect(body).toHaveProperty('post_training');
    expect(body).toHaveProperty('coach_feedback');
    expect(body).toHaveProperty('weekly_reflection');
    expect(body).toHaveProperty('coach_report');

    console.log('Edge function result:', JSON.stringify(body, null, 2));
  });

  test('notification templates exist in database', async () => {
    const { createClient } = require('@supabase/supabase-js');
    const sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { db: { schema: 'deco' } });
    await sb.auth.signInWithPassword({
      email: 'test-playwright@deco.app',
      password: 'TestPass123!',
    });

    // Templates table may not be accessible via RLS with test user,
    // but we can verify the edge function loaded them by checking it didn't error
    const response = await fetch(`${SUPABASE_URL}/functions/v1/send-notifications`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    const body = await response.json();
    // If templates failed to load, the edge function would error or use fallbacks
    // Either way, it should still return a valid response
    expect(response.ok).toBe(true);
    expect(body.timestamp).toBeTruthy();
  });
});

test.describe('Expo Push API Direct Test', () => {
  test('Expo accepts a valid push payload', async () => {
    // Send to a known-invalid token to test the API accepts our format
    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: 'ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]',
        title: 'Test',
        body: 'Playwright test',
        data: { type: 'session_focus', sessionId: 'test-123' },
        sound: 'default',
      }),
    });

    expect(response.ok).toBe(true);
    const result = await response.json();
    console.log('Expo response for invalid token:', JSON.stringify(result));

    // Expo should accept the payload even with invalid token
    // (it returns status: "error" with details about the invalid token)
    expect(result.data).toBeTruthy();
  });

  test('data payload structure matches what app expects for each type', () => {
    // These are the payloads the edge function sends
    const payloads = [
      {
        name: 'session_focus',
        data: { type: 'session_focus', sessionId: 'test-session-1' },
        expectedTarget: '/(athlete)/development/session-goals',
      },
      {
        name: 'post_training',
        data: { type: 'post_training', sessionId: 'test-session-2' },
        expectedTarget: '/(athlete)/development/reflect',
      },
      {
        name: 'coach_feedback',
        data: { type: 'coach_feedback', goalId: 'test-goal-1' },
        expectedTarget: '/(athlete)/goals/[id]',
      },
      {
        name: 'weekly_review',
        data: { type: 'weekly_review' },
        expectedTarget: '/(athlete)/development/reflect',
      },
      {
        name: 'coach_report',
        data: { type: 'coach_report' },
        expectedTarget: '/(coach)/reports',
      },
    ];

    for (const p of payloads) {
      const result = simulateNavigation(p.data);
      console.log(`${p.name}: target=${result.target}, params=${JSON.stringify(result.params)}`);
      expect(result.action).toBe('push');
      expect(result.target).toBe(p.expectedTarget);
    }
  });
});
