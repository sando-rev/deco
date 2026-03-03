import { supabase } from './supabase';

interface GoalFeedbackInput {
  description: string;
  athlete_skills: string[]; // skill labels for context
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
    body: input,
  });

  if (error) {
    console.error('AI feedback error:', error);
    return {
      specificity_score: 5,
      measurability_score: 5,
      challenge_score: 5,
      feedback: 'Unable to generate feedback right now. Your goal has been saved.',
      suggestions: [],
      detected_skills: [],
    };
  }

  return data as GoalFeedbackResponse;
}
