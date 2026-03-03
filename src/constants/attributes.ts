import { AttributeKey } from '../types/database';

export interface AttributeDefinition {
  key: AttributeKey;
  label: string;
  description: string;
  icon: string; // Ionicons name
}

export const ATTRIBUTES: AttributeDefinition[] = [
  {
    key: 'dribbling',
    label: 'Dribbling',
    description: 'Ball control, 1v1 skills, close control',
    icon: 'football-outline',
  },
  {
    key: 'passing',
    label: 'Passing',
    description: 'Short pass, long pass, accuracy, vision',
    icon: 'swap-horizontal-outline',
  },
  {
    key: 'shooting',
    label: 'Shooting',
    description: 'Shot power, accuracy, finishing, penalty corners',
    icon: 'flash-outline',
  },
  {
    key: 'defending',
    label: 'Defending',
    description: 'Tackling, positioning, interceptions, marking',
    icon: 'shield-outline',
  },
  {
    key: 'fitness',
    label: 'Fitness',
    description: 'Speed, stamina, agility, strength',
    icon: 'fitness-outline',
  },
  {
    key: 'game_insight',
    label: 'Game Insight',
    description: 'Tactical awareness, decision making, reading the game',
    icon: 'bulb-outline',
  },
  {
    key: 'communication',
    label: 'Communication',
    description: 'On-field communication, leadership, team coordination',
    icon: 'chatbubbles-outline',
  },
  {
    key: 'mental_strength',
    label: 'Mental Strength',
    description: 'Focus, resilience, confidence, handling pressure',
    icon: 'brain-outline',
  },
];

export const ATTRIBUTE_MAP = Object.fromEntries(
  ATTRIBUTES.map((a) => [a.key, a])
) as Record<AttributeKey, AttributeDefinition>;
