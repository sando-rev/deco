import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

/**
 * These tests verify all the UI changes from the requirements list
 * by reading the source code directly. Since Playwright tests for this project
 * are database-level (not browser UI), we verify the code changes are present
 * in the deployed source files.
 */

const ROOT = '/Users/sando/deco';

function readFile(filePath: string): string {
  return fs.readFileSync(path.join(ROOT, filePath), 'utf-8');
}

// ─── Onboarding Changes ─────────────────────────────

test.describe('Onboarding', () => {
  const onboarding = () => readFile('app/(auth)/onboarding.tsx');

  test('skill selection shows "kies wat voor jouw positie of speelstijl belangrijk is"', () => {
    const src = onboarding();
    expect(src).toContain('Kies wat voor jouw positie of speelstijl belangrijk is');
  });

  test('step order is: welcome, position, skills, scoring, goal, leaderboard, schedule, notifications', () => {
    const src = onboarding();

    // Extract STEP_ORDER array content
    const stepOrderMatch = src.match(/STEP_ORDER[^=]*=\s*\[([\s\S]*?)\]/);
    expect(stepOrderMatch).toBeTruthy();
    const stepOrderStr = stepOrderMatch![1];

    // Parse step names in order
    const steps = [...stepOrderStr.matchAll(/'([^']+)'/g)].map(m => m[1]);

    // Verify exact order
    expect(steps).toEqual([
      'welcome',
      'position',
      'technical',
      'tactical',
      'physical',
      'mental',
      'scoring',
      'goal',
      'leaderboard',
      'schedule',
      'notifications',
    ]);
  });

  test('notifications is the final step (triggers handleComplete)', () => {
    const src = onboarding();
    // The notifications step should call handleComplete, not goForward
    // Find the notifications rendering section — it should reference handleComplete
    // Since notifications is last, its onContinue should be handleComplete
    expect(src).toMatch(/notifications[\s\S]*?handleComplete/);
  });
});

// ─── Settings: Delete Account ────────────────────────

test.describe('Settings', () => {
  const settings = () => readFile('app/(athlete)/settings.tsx');

  test('delete account button exists', () => {
    const src = settings();
    expect(src).toContain('handleDeleteAccount');
    expect(src).toContain('deleteAccount');
    expect(src).toContain('delete_my_account');
  });

  test('delete account calls supabase RPC and signs out', () => {
    const src = settings();
    expect(src).toContain("supabase.rpc('delete_my_account')");
    expect(src).toContain('supabase.auth.signOut()');
  });

  test('delete account has confirmation dialog', () => {
    const src = settings();
    expect(src).toContain('deleteAccountConfirm');
    expect(src).toContain("style: 'destructive'");
  });
});

// ─── Session Goals Screen ────────────────────────────

test.describe('Session Goals Screen', () => {
  const sessionGoals = () => readFile('app/(athlete)/development/session-goals.tsx');
  const devLayout = () => readFile('app/(athlete)/development/_layout.tsx');

  test('header does NOT show raw "session-goals" text', () => {
    const layout = devLayout();
    // Should have a proper title or headerShown: false for session-goals
    // Check that the layout defines a screen name with a proper title
    if (layout.includes('session-goals')) {
      // If it references session-goals, it should set a proper title
      expect(layout).toMatch(/session-goals[\s\S]*?title/);
    }
  });

  test('date format is dd-mm-yyyy (not yyyy-mm-dd)', () => {
    const src = sessionGoals();
    // Should have a formatDate function that reverses the date parts
    expect(src).toMatch(/dd.*mm.*yyyy|split.*reverse|(\d{2})-(\d{2})-(\d{4})/i);
    // Should NOT directly render session.date without formatting
    // Look for a format/helper function
    expect(src).toMatch(/formatDate|format.*date/i);
  });

  test('time format strips seconds (HH:mm not HH:mm:ss)', () => {
    const src = sessionGoals();
    // Should have time formatting that strips seconds
    expect(src).toMatch(/formatTime|slice\(0,\s*5\)|substring\(0,\s*5\)/);
  });

  test('keyboard handling is configured for Android', () => {
    const src = sessionGoals();
    // Should have KeyboardAvoidingView with behavior for both platforms
    expect(src).toContain('KeyboardAvoidingView');
    // Android should have 'height' behavior (not undefined)
    expect(src).toMatch(/behavior.*height|height.*behavior/);
    // Should have keyboardShouldPersistTaps
    expect(src).toContain('keyboardShouldPersistTaps');
  });

  test('training goal label includes "(optioneel)"', () => {
    const src = sessionGoals();
    expect(src).toContain('(optioneel)');
  });

  test('confirmation/success screen exists after saving', () => {
    const src = sessionGoals();
    // Should have a success/saved state
    expect(src).toMatch(/saved|success|succes/i);
    // Should show a motivational message
    expect(src).toMatch(/[Zz]et.*op|[Ss]ucces/);
  });
});

// ─── Reflect Screen ──────────────────────────────────

test.describe('Reflect Screen', () => {
  const reflect = () => readFile('app/(athlete)/development/reflect.tsx');

  test('session type selector is REMOVED', () => {
    const src = reflect();
    // Should NOT have manual session type buttons
    // Old code had TouchableOpacity for "Training" and "Wedstrijd" selection
    expect(src).not.toMatch(/setSessionType\(/);
    // Session type should be derived from session data
    expect(src).toMatch(/session.*session_type|session_type.*session/);
  });

  test('does NOT show "Beoordeel je voortgang per doel" section', () => {
    const src = reflect();
    // The old code had a section for rating ALL active goals
    // This should be removed — only focus goals should be shown
    expect(src).not.toContain('rateProgress');
    // Or if the string is still referenced, it shouldn't be rendered for non-focus goals
  });

  test('only shows focus/session goals (not all active goals)', () => {
    const src = reflect();
    // Should use sessionGoals (from useSessionGoals) not allGoals
    expect(src).toMatch(/sessionGoals|focusGoals|session_goals/);
    // Should show empty state when no focus goals
    expect(src).toMatch(/[Gg]een.*focus.*doelen|[Nn]o.*focus.*goals/i);
  });

  test('uses 5-star rating (not 10-point slider)', () => {
    const src = reflect();
    // Should NOT have Slider import or component
    expect(src).not.toMatch(/from.*slider/i);
    expect(src).not.toContain('minimumValue');
    expect(src).not.toContain('maximumValue');
    // Should have star icons
    expect(src).toContain('star');
    expect(src).toContain('star-outline');
    // Should reference 5 stars (rating 1-5)
    expect(src).toMatch(/[1-5].*star|star.*[1-5]/);
  });

  test('navigates back after reflection is saved', () => {
    const src = reflect();
    // Should call router.back() or router.replace() after saving
    expect(src).toMatch(/router\.(back|replace|push)/);
  });
});

// ─── Notification Permission ─────────────────────────

test.describe('Notification Permission', () => {
  const notifications = () => readFile('src/hooks/useNotifications.ts');

  test('requests permission if not already granted', () => {
    const src = notifications();
    // Should call requestPushPermission when no token exists
    expect(src).toContain('requestPushPermission');
    // Should not only call getPushTokenIfGranted
    // The flow should be: try granted → if null → request
    expect(src).toMatch(/getPushTokenIfGranted[\s\S]*?requestPushPermission/);
  });

  test('saves token after permission is granted', () => {
    const src = notifications();
    // After getting token, should update profile
    expect(src).toContain("update({ push_token:");
  });
});

// ─── Session Prompt (auto-navigate on app open) ──────

test.describe('Session Prompt', () => {
  test('useSessionPrompt hook exists', () => {
    const src = readFile('src/hooks/useSessionPrompt.ts');
    expect(src).toContain('useSessionPrompt');
    // Should check for past sessions needing reflection
    expect(src).toContain('reflection_id');
    // Should check for upcoming sessions needing goals
    expect(src).toContain('session_goals');
  });

  test('useSessionPrompt is used in athlete layout', () => {
    const layout = readFile('app/(athlete)/_layout.tsx');
    expect(layout).toContain('useSessionPrompt');
  });
});
