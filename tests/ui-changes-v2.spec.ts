import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

const ROOT = '/Users/sando/deco';
function readFile(filePath: string): string {
  return fs.readFileSync(path.join(ROOT, filePath), 'utf-8');
}

// ─── Session Goals: Celebration overlay instead of inline success ──

test.describe('Session Goals Completion', () => {
  const sessionGoals = () => readFile('app/(athlete)/development/session-goals.tsx');

  test('uses CelebrationContext overlay (not inline success view)', () => {
    const src = sessionGoals();
    expect(src).toContain('useCelebration');
    expect(src).toContain('celebrate(');
    // Should NOT have a saved state with inline success view
    expect(src).not.toMatch(/if\s*\(\s*saved\s*\)/);
  });

  test('calls router.back() after celebration to dismiss screen', () => {
    const src = sessionGoals();
    expect(src).toContain('router.back()');
  });
});

// ─── Development Tab: FAB offers choice ──────────────

test.describe('Development Tab FAB', () => {
  const devIndex = () => readFile('app/(athlete)/development/index.tsx');

  test('FAB shows Alert with two options (not direct navigation)', () => {
    const src = devIndex();
    expect(src).toContain('Alert.alert');
    // Should offer focus goal option
    expect(src).toMatch(/[Ff]ocus.*doel|session-goals/);
    // Should offer reflection option
    expect(src).toMatch(/[Rr]eflectie|reflect/);
  });

  test('FAB navigates to session-goals for focus goal', () => {
    const src = devIndex();
    expect(src).toContain('session-goals');
  });

  test('FAB navigates to reflect for reflection', () => {
    const src = devIndex();
    expect(src).toContain('reflect');
  });

  test('uses useUpcomingSessions to find today session', () => {
    const src = devIndex();
    expect(src).toContain('useUpcomingSessions');
  });
});

// ─── XP Explanation Modal ────────────────────────────

test.describe('XP Explanation Modal', () => {
  const devIndex = () => readFile('app/(athlete)/development/index.tsx');

  test('XP explanation modal exists', () => {
    const src = devIndex();
    expect(src).toContain('xpExplanation');
  });
});

// ─── Onboarding: Team Join in Leaderboard Step ──────

test.describe('Onboarding Leaderboard Step', () => {
  const onboarding = () => readFile('app/(auth)/onboarding.tsx');

  test('LeaderboardStep has team invite code input', () => {
    const src = onboarding();
    // Should have an input for invite code
    expect(src).toMatch(/inviteCode|invite_code|teamcode/i);
    // Should have join functionality
    expect(src).toMatch(/useJoinTeam|joinTeam|handleJoin/);
  });

  test('shows hint text about joining team or doing it later', () => {
    const src = onboarding();
    // Should mention joining a team or doing it later in settings
    expect(src).toMatch(/leaderboardJoinHint|teamcode.*later|later.*[Ii]nstellingen/i);
  });

  test('i18n has join hint strings', () => {
    const nl = readFile('src/i18n/nl.ts');
    expect(nl).toContain('leaderboardJoinHint');
  });
});

// ─── Coach Reports: Player Rating List ──────────────

test.describe('Coach Reports', () => {
  const reports = () => readFile('app/(coach)/reports.tsx');

  test('shows player list (not just text area)', () => {
    const src = reports();
    // Should reference team members/players
    expect(src).toMatch(/useTeamMembers|teamMembers|members/);
    // Should have player names
    expect(src).toMatch(/full_name|player.*name/i);
  });

  test('has three rating options per player (up/neutral/down)', () => {
    const src = reports();
    // Should have thumbs up and down icons
    expect(src).toContain('thumbs-up');
    expect(src).toContain('thumbs-down');
    // Should have neutral option
    expect(src).toMatch(/remove|neutral|tilde/i);
  });

  test('rating colors are green, amber, red', () => {
    const src = reports();
    expect(src).toMatch(/#2D9B6A|deco-primary|green/i); // green for up
    expect(src).toMatch(/#F5A623|accent|amber/i); // amber for neutral
    expect(src).toMatch(/#E53E3E|red|error/i); // red for down
  });

  test('player skills are shown below names', () => {
    const src = reports();
    // Should reference skills or goals for players
    expect(src).toMatch(/skill|active_goal/i);
  });

  test('tapping player name navigates to player detail', () => {
    const src = reports();
    expect(src).toMatch(/players\/\$|router\.push.*players/);
  });

  test('has notes field at bottom', () => {
    const src = reports();
    // Should have a TextInput for notes
    expect(src).toContain('TextInput');
    expect(src).toMatch(/notes|notities|opmerkingen/i);
  });

  test('encodes ratings in report data', () => {
    const src = reports();
    // Should encode ratings somehow (JSON in notes field)
    expect(src).toMatch(/encodeReport|JSON\.stringify|ratings/);
  });

  test('decodes ratings from existing reports', () => {
    const src = reports();
    expect(src).toMatch(/decodeReport|JSON\.parse|ratings/);
  });
});
