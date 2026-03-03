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
    label: 'Technical Skills',
    description: 'Ball skills and stick work',
    icon: 'football-outline',
    minSelection: 2,
    maxSelection: 4,
  },
  {
    key: 'tactical',
    label: 'Tactical Skills',
    description: 'Game understanding and decision making',
    icon: 'bulb-outline',
    minSelection: 2,
    maxSelection: 4,
  },
  {
    key: 'physical',
    label: 'Physical Skills',
    description: 'Athletic abilities and conditioning',
    icon: 'fitness-outline',
    minSelection: 2,
    maxSelection: 4,
  },
  {
    key: 'mental',
    label: 'Mental Skills',
    description: 'Mindset and psychological strength',
    icon: 'brain-outline',
    minSelection: 2,
    maxSelection: 4,
  },
];

export const CATEGORY_ORDER: SkillCategory[] = ['technical', 'tactical', 'physical', 'mental'];

export const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
export const DAY_LABELS_FULL = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
