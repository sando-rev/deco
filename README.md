# Deco

A field hockey development app that helps athletes track skills, set goals, and reflect on training — while giving coaches visibility into their team's progress.

## Download

**[Download for Android (v1.2.0)](https://github.com/sando-rev/deco/releases/download/v1.2.0/deco-v1.2.0.apk)**

iOS coming soon.

Landing page: [landing-weld-chi-78.vercel.app](https://landing-weld-chi-78.vercel.app)

## Features

### Athletes
- **Skill Selection** — Choose from 30+ field hockey skills across 4 categories (Technical, Tactical, Physical, Mental)
- **Dynamic Radar Chart** — Visualize your skill scores on a radar chart that adapts to your selected skills
- **AI Goal Setting** — Write a development goal and get AI feedback on specificity, measurability, and challenge level
- **Training Schedule** — Set up your weekly schedule (training, matches, gym) with smart notifications
- **Session Reflections** — Log reflections after training and rate progress toward your goals
- **Development Timeline** — Track sessions, reflections, and skill progression over time

### Coaches
- **Team Management** — Create a team and share an invite code with athletes
- **Player Overview** — View each athlete's radar chart, goals, and recent activity
- **Goal Feedback** — Leave comments and thumbs-up on athlete goals

## Tech Stack

- **Frontend**: React Native (Expo SDK 55) with Expo Router
- **Backend**: Supabase (PostgreSQL, Auth, Edge Functions, Row Level Security)
- **AI**: Anthropic Claude Haiku via Supabase Edge Function for goal analysis
- **State Management**: TanStack React Query
- **Landing Page**: Next.js on Vercel

## Project Structure

```
app/
  (auth)/          # Sign in, sign up, onboarding
  (athlete)/       # Athlete screens (profile, goals, development, settings)
  (coach)/         # Coach screens (team, players, settings)
src/
  components/      # Shared components (RadarChart, GoalCard, GoalAnalysisCard)
  constants/       # Theme, skill categories
  hooks/           # Data hooks (useAuth, useGoals, useSkills, useSchedule, useTeam)
  services/        # Supabase client, AI service
  types/           # TypeScript database types
supabase/
  functions/       # Edge functions (goal-feedback)
landing/           # Next.js landing page
```

## Development

### Prerequisites
- Node.js 18+
- Expo CLI
- Android SDK (for local builds)

### Setup
```bash
npm install
npx expo start
```

### Build APK
```bash
eas build --platform android --profile preview --local
```

### Environment
The app connects to a Supabase project. The Supabase URL and anon key are configured in `src/services/supabase.ts`.

The `goal-feedback` edge function requires an `ANTHROPIC_API_KEY` secret set in Supabase.
