import { supabase } from './supabase';
import i18n from '../i18n';

interface GoalFeedbackInput {
  description: string;
  athlete_skills: string[]; // skill labels for context
  skill_label?: string; // selected skill label for focused feedback
}

export interface GoalFeedbackResponse {
  specificity_score: number;
  measurability_score: number;
  challenge_score: number;
  feedback: string;
  suggestions: string[];
  detected_skills: string[];
}

export async function getGoalFeedback(
  input: GoalFeedbackInput
): Promise<GoalFeedbackResponse> {
  const { data, error } = await supabase.functions.invoke('goal-feedback', {
    body: { ...input, language: i18n.language as 'nl' | 'en' },
  });

  if (error) {
    console.error('AI feedback error:', error);
    return {
      specificity_score: 5,
      measurability_score: 5,
      challenge_score: 5,
      feedback: i18n.language === 'en'
        ? 'Feedback cannot be generated at this time. Your goal has been saved.'
        : 'Feedback kan op dit moment niet gegenereerd worden. Je doel is opgeslagen.',
      suggestions: [],
      detected_skills: [],
    };
  }

  return data as GoalFeedbackResponse;
}
