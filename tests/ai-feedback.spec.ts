import { test, expect } from '@playwright/test';
import { SUPABASE_URL, SUPABASE_ANON_KEY, signInAsAthlete } from './helpers';

test.describe('AI Goal Feedback', () => {
  test('edge function returns real AI analysis (not fallback)', async () => {
    const supabase = await signInAsAthlete();

    // Call the goal-feedback edge function directly
    const { data, error } = await supabase.functions.invoke('goal-feedback', {
      body: {
        description: 'Ik wil mijn backhand pass verbeteren zodat ik 3 van de 5 passes succesvol aankom tijdens positioneel spel',
        athlete_skills: ['Passen', 'Dribbelen', 'Verdedigen'],
        skill_label: 'Passen',
        language: 'nl',
      },
    });

    console.log('Edge function response:', JSON.stringify(data, null, 2));
    console.log('Edge function error:', error);

    // Should not error
    expect(error).toBeNull();
    expect(data).toBeTruthy();

    // Should have real scores (not all 5s which is the fallback)
    expect(data.specificity_score).toBeGreaterThanOrEqual(1);
    expect(data.specificity_score).toBeLessThanOrEqual(10);
    expect(data.measurability_score).toBeGreaterThanOrEqual(1);
    expect(data.measurability_score).toBeLessThanOrEqual(10);
    expect(data.challenge_score).toBeGreaterThanOrEqual(1);
    expect(data.challenge_score).toBeLessThanOrEqual(10);

    // The fallback always returns exactly 5/5/5 - real AI should NOT return all 5s
    const isFallback =
      data.specificity_score === 5 &&
      data.measurability_score === 5 &&
      data.challenge_score === 5 &&
      data.feedback.includes('kan op dit moment niet');

    expect(isFallback).toBe(false);

    // Should have real feedback text
    expect(data.feedback).toBeTruthy();
    expect(data.feedback.length).toBeGreaterThan(20);

    // Should have suggestions
    expect(data.suggestions).toBeDefined();
    expect(Array.isArray(data.suggestions)).toBe(true);

    // Should detect skills
    expect(data.detected_skills).toBeDefined();
    expect(Array.isArray(data.detected_skills)).toBe(true);

    console.log('AI Analysis scores:', {
      specificity: data.specificity_score,
      measurability: data.measurability_score,
      challenge: data.challenge_score,
    });
    console.log('Feedback:', data.feedback);
  });

  test('edge function handles English language', async () => {
    const supabase = await signInAsAthlete();

    const { data, error } = await supabase.functions.invoke('goal-feedback', {
      body: {
        description: 'Improve my drag flick accuracy to score on 4 out of 5 penalty corners',
        athlete_skills: ['Shooting', 'Passing'],
        skill_label: 'Shooting',
        language: 'en',
      },
    });

    expect(error).toBeNull();
    expect(data).toBeTruthy();
    expect(data.specificity_score).toBeGreaterThanOrEqual(1);
    expect(data.feedback).toBeTruthy();

    // Should be in English (not contain Dutch fallback text)
    expect(data.feedback).not.toContain('kan op dit moment niet');

    console.log('English feedback:', data.feedback);
  });
});
