// Deco database types (deco schema)

export type Role = 'athlete' | 'coach';
export type GoalStatus = 'active' | 'achieved' | 'abandoned';
export type SessionType = 'training' | 'match';
export type SkillCategory = 'technical' | 'tactical' | 'physical' | 'mental';
export type ScheduleSessionType = 'training' | 'match' | 'gym' | 'other';

/** @deprecated Use SkillDefinition and dynamic skills instead */
export type AttributeKey =
  | 'dribbling'
  | 'passing'
  | 'shooting'
  | 'defending'
  | 'fitness'
  | 'game_insight'
  | 'communication'
  | 'mental_strength';

export interface NotificationPrefs {
  pre_training: boolean;
  post_session: boolean;
  motivational: boolean;
  weekly_review: boolean;
}

export interface Profile {
  id: string;
  role: Role;
  full_name: string;
  sport: string;
  push_token: string | null;
  notification_prefs: NotificationPrefs;
  onboarding_completed: boolean;
  created_at: string;
}

export interface Team {
  id: string;
  name: string;
  invite_code: string;
  coach_id: string;
  created_at: string;
}

export interface TeamMember {
  team_id: string;
  athlete_id: string;
  joined_at: string;
}

/** @deprecated Use athlete_selected_skills + athlete_skill_scores instead */
export interface AthleteAttributes {
  id: string;
  athlete_id: string;
  dribbling: number;
  passing: number;
  shooting: number;
  defending: number;
  fitness: number;
  game_insight: number;
  communication: number;
  mental_strength: number;
  assessed_at: string;
}

// New flexible skill system
export interface SkillDefinition {
  id: string;
  key: string;
  label: string;
  description: string;
  category: SkillCategory;
  icon: string;
  display_order: number;
}

export interface AthleteSelectedSkill {
  athlete_id: string;
  skill_id: string;
  selected_at: string;
}

export interface AthleteSkillScore {
  id: string;
  athlete_id: string;
  skill_id: string;
  score: number;
  assessed_at: string;
}

export interface AthleteSkillWithDefinition {
  skill_id: string;
  score: number;
  assessed_at: string;
  skill: SkillDefinition;
}

export interface GoalAiAnalysis {
  specificity_score: number;
  measurability_score: number;
  challenge_score: number;
  feedback: string;
  suggestions: string[];
  detected_skills: string[];
}

export interface Goal {
  id: string;
  athlete_id: string;
  title: string;
  description: string | null;
  attribute: AttributeKey | null;
  skill_id: string | null;
  target_score: number | null;
  deadline: string | null;
  status: GoalStatus;
  ai_feedback: string | null;
  ai_analysis: GoalAiAnalysis | null;
  score_improvement: number | null;
  created_at: string;
  completed_at: string | null;
}

export interface Reflection {
  id: string;
  athlete_id: string;
  session_type: SessionType;
  notes: string | null;
  created_at: string;
}

export interface ReflectionGoal {
  id: string;
  reflection_id: string;
  goal_id: string;
  rating: number;
}

export interface CoachComment {
  id: string;
  coach_id: string;
  goal_id: string;
  content: string | null;
  is_thumbs_up: boolean;
  created_at: string;
}

// Schedule types
export interface TrainingSchedule {
  id: string;
  athlete_id: string;
  day_of_week: number; // 0=Sunday, 1=Monday, ... 6=Saturday
  start_time: string; // HH:mm
  end_time: string;
  session_type: ScheduleSessionType;
  label: string | null;
  created_at: string;
}

export interface ScheduledSession {
  id: string;
  athlete_id: string;
  schedule_id: string | null;
  session_type: ScheduleSessionType;
  label: string | null;
  date: string; // YYYY-MM-DD
  start_time: string;
  end_time: string;
  reflection_id: string | null;
  notification_sent_pre: boolean;
  notification_sent_post: boolean;
  created_at: string;
}

// Extended types for joins
export interface GoalWithComments extends Goal {
  coach_comments: CoachComment[];
}

export interface ReflectionWithGoals extends Reflection {
  reflection_goals: (ReflectionGoal & { goal: Goal })[];
}

export interface TeamMemberWithProfile extends TeamMember {
  profile: Profile;
  selected_skills_count: number;
  active_goals_count: number;
  last_reflection_date: string | null;
}
