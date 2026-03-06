import { SkillCategory } from '../types/database';

export interface SkillCategoryDefinition {
  key: SkillCategory;
  label: string;
  description: string;
  icon: string;
  minSelection: number;
  maxSelection: number;
}

export const SKILL_CATEGORIES: SkillCategoryDefinition[] = [
  {
    key: 'technical',
    label: 'Technische vaardigheden',
    description: 'Balvaardigheden en stickwerk',
    icon: 'football-outline',
    minSelection: 2,
    maxSelection: 4,
  },
  {
    key: 'tactical',
    label: 'Tactische vaardigheden',
    description: 'Spelinzicht en besluitvorming',
    icon: 'bulb-outline',
    minSelection: 2,
    maxSelection: 4,
  },
  {
    key: 'physical',
    label: 'Fysieke vaardigheden',
    description: 'Atletisch vermogen en conditie',
    icon: 'fitness-outline',
    minSelection: 2,
    maxSelection: 4,
  },
  {
    key: 'mental',
    label: 'Mentale vaardigheden',
    description: 'Mindset en mentale weerbaarheid',
    icon: 'sparkles-outline',
    minSelection: 2,
    maxSelection: 4,
  },
];

export const CATEGORY_ORDER: SkillCategory[] = ['technical', 'tactical', 'physical', 'mental'];

// DAY_LABELS indexed by JS day_of_week (0=Sunday)
export const DAY_LABELS = ['Zo', 'Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za'];
export const DAY_LABELS_FULL = ['Zondag', 'Maandag', 'Dinsdag', 'Woensdag', 'Donderdag', 'Vrijdag', 'Zaterdag'];

// Display order: Monday first → Sunday last
// Each value is the JS day_of_week (0=Sun, 1=Mon, ..., 6=Sat)
export const DISPLAY_DAY_ORDER = [1, 2, 3, 4, 5, 6, 0];

/** Convert display index (0=Monday) to JS day_of_week (0=Sunday) */
export function displayIndexToDayOfWeek(displayIndex: number): number {
  return DISPLAY_DAY_ORDER[displayIndex];
}

/** Convert JS day_of_week (0=Sunday) to display index (0=Monday) */
export function dayOfWeekToDisplayIndex(dayOfWeek: number): number {
  return DISPLAY_DAY_ORDER.indexOf(dayOfWeek);
}
