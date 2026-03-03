"use client";

const ATHLETE_FEATURES = [
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <circle cx="12" cy="12" r="10" />
        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
      </svg>
    ),
    title: "Skill Self-Assessment",
    description:
      "Rate yourself across 8 core field hockey attributes and see your strengths visualized in a radar chart.",
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
      </svg>
    ),
    title: "Smart Goal Setting",
    description:
      "Set targeted development goals. Our AI analyzes each goal and gives you feedback on how to make it more actionable.",
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path d="M11 5H6a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2v-5m-1.414-9.414a2 2 0 1 1 2.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
      </svg>
    ),
    title: "Session Reflections",
    description:
      "After every training or match, reflect on your goals. Rate your progress and write what you learned.",
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
      </svg>
    ),
    title: "Development Tracking",
    description:
      "Watch your skill profile evolve over time. See trends, streaks, and progress charts for every goal.",
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0" />
      </svg>
    ),
    title: "Smart Reminders",
    description:
      "Get nudged before training to review your goals, and after sessions to reflect. Never lose focus.",
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path d="M12 2a4 4 0 0 1 4 4c0 1.95-2 4-4 6-2-2-4-4.05-4-6a4 4 0 0 1 4-4z" />
        <path d="M12 14v4m-4-2h8" />
      </svg>
    ),
    title: "AI Coaching Feedback",
    description:
      "Deco AI reviews your goals and reflections, providing personalized tips to accelerate your growth.",
  },
];

const COACH_FEATURES = [
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
    title: "Team Management",
    description:
      "Create your team and invite players with a simple code. Onboard your entire squad in minutes.",
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <path d="M3 9h18M9 3v18" />
      </svg>
    ),
    title: "Player Profiles",
    description:
      "See every player's skill radar chart at a glance. Understand strengths and areas for development instantly.",
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <circle cx="12" cy="12" r="10" />
        <path d="M12 8v4l3 3" />
      </svg>
    ),
    title: "Goal Oversight",
    description:
      "View and track each player's active development goals. Know exactly what everyone is working on.",
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3H14z" />
        <path d="M1 12h4" />
      </svg>
    ),
    title: "Feedback & Endorsement",
    description:
      "Give thumbs-up or write comments on player goals. Small gestures of encouragement go a long way.",
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
      </svg>
    ),
    title: "Activity Monitoring",
    description:
      "See which players are actively reflecting and growing. Spot disengagement early and intervene.",
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
      </svg>
    ),
    title: "Weekly Check-ins",
    description:
      "Get reminded each week to review your team's development. Stay proactive, not reactive.",
  },
];

interface FeatureShowcaseProps {
  activeRole: "athlete" | "coach";
}

export function FeatureShowcase({ activeRole }: FeatureShowcaseProps) {
  const features = activeRole === "athlete" ? ATHLETE_FEATURES : COACH_FEATURES;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
      {features.map((feature, i) => (
        <div
          key={`${activeRole}-${i}`}
          className="bg-white rounded-2xl p-6 border border-deco-border hover:border-deco-primary/30 hover:shadow-lg transition-all duration-300"
        >
          <div className="w-10 h-10 bg-deco-primary/10 rounded-xl flex items-center justify-center text-deco-primary mb-4">
            {feature.icon}
          </div>
          <h3 className="text-base font-bold text-deco-text mb-2">
            {feature.title}
          </h3>
          <p className="text-sm text-deco-text-secondary leading-relaxed">
            {feature.description}
          </p>
        </div>
      ))}
    </div>
  );
}
