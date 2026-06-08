# Deco

A field hockey development coaching app that helps athletes track skills, set goals, and reflect on training — while giving coaches visibility into their team's progress.

## Download

**[Download for Android (v2.3.1)](https://github.com/sando-rev/deco/releases/download/v2.3.1/deco-v2.3.1.apk)**

iOS build in progress.

Website: [decotraining.com](https://decotraining.com)

## Features

### Athletes
- **Skill Radar** — Choose from 30+ field hockey skills across 4 categories (Technical, Tactical, Physical, Mental) and visualize scores on a radar chart
- **AI Goal Setting** — Write development goals and get AI feedback on specificity, measurability, and challenge level
- **Session Goals** — Set focus goals before each training or match
- **Reflections** — Rate progress with 1-5 stars after each session
- **Training Schedule** — Set up weekly schedule with smart pre/post-training notifications
- **Gamification** — Earn XP, unlock achievements, climb the team leaderboard
- **Session Prompt** — App automatically prompts for goals or reflection based on your schedule

### Coaches
- **Team Management** — Create teams with invite codes
- **Player Overview** — View each athlete's radar chart, goals, and recent activity
- **Goal Feedback** — Leave comments and thumbs-up on athlete goals
- **Weekly Reports** — Rate player progress (thumbs up/neutral/down) with notes
- **Score Feedback** — Assess player skill scores

### Admin Dashboard
- **Analytics** — Overview, users, engagement, gamification, coaches, training, funnel, goal insights, power users
- **Notifications** — Send push notifications to users, manage notification templates
- **App Store Tools** — Screenshot generator, feature graphic generator
- **Brand Key** — Branding assets

## Tech Stack

- **App**: React Native (Expo SDK 55) with Expo Router
- **Backend**: Supabase (PostgreSQL, Auth, Edge Functions, Row Level Security)
- **AI**: Anthropic Claude Haiku via Supabase Edge Function for goal analysis
- **Notifications**: Expo Push API + pg_cron for scheduled delivery
- **State Management**: TanStack React Query
- **Landing Page**: Next.js 16 + Tailwind CSS 4 on Vercel
- **Testing**: Playwright (database-level tests)
- **OTA Updates**: EAS Update

## Project Structure

```
app/
  (auth)/              # Sign in, sign up, onboarding (11 steps)
  (athlete)/           # Athlete tabs (profile, goals, development, settings)
  (coach)/             # Coach tabs (players, team, reports, settings)
src/
  components/          # Shared components (RadarChart, GoalCard, CelebrationOverlay)
  constants/           # Theme, skill categories
  hooks/               # Data hooks (useAuth, useGoals, useSkills, useSchedule, useNotifications, useSessionPrompt)
  services/            # Supabase client
  i18n/                # Dutch + English translations
  types/               # TypeScript database types
supabase/
  functions/           # Edge functions (goal-feedback, send-notifications)
  migrations/          # Database migrations
landing/               # Next.js landing page + admin dashboard
  app/admin/           # Admin dashboard (analytics, notifications, app store tools)
  app/blog/            # SEO blog (10 Dutch articles)
  components/          # Landing page + admin components
tests/                 # Playwright test suites
docs/                  # Admin rebuild prompt
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

### Build Android APK
```bash
ANDROID_HOME=~/Library/Android/sdk npx eas build --platform android --profile preview --local --output ./deco.apk --non-interactive
```

### Build Android AAB (Play Store)
```bash
ANDROID_HOME=~/Library/Android/sdk npx eas build --platform android --profile production --local --output ./deco.aab --non-interactive
```

### Build iOS (App Store)
```bash
EXPO_APPLE_TEAM_ID=Q2L43947K2 npx eas build --platform ios --profile ios-production
```

### OTA Update
```bash
CI=1 npx eas update --branch preview --message "description" --platform android
```

### Deploy Landing Page
```bash
cd landing && npx vercel --prod --yes
```

### Deploy Edge Functions
```bash
npx supabase functions deploy send-notifications --project-ref hjbzknaionxkdkiowcch
npx supabase functions deploy goal-feedback --project-ref hjbzknaionxkdkiowcch
```

### Run Tests
```bash
npx playwright test
```

## Environment

- **Supabase**: URL and anon key in `src/services/supabase.ts`
- **Edge functions**: `ANTHROPIC_API_KEY` secret in Supabase (stored as `deco`)
- **Vercel**: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- **EAS**: Project ID `1d4ac95d-3bd4-4fc4-aa17-2df95e766acc`
