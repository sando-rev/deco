import { useEffect } from 'react';
import { useFonts } from 'expo-font';
import { Slot, Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from '../src/hooks/useAuth';
import { useNotifications } from '../src/hooks/useNotifications';
import { Colors } from '../src/constants/theme';
import { StatusBar } from 'expo-status-bar';
import '../src/i18n';

export { ErrorBoundary } from 'expo-router';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 2,
    },
  },
});

SplashScreen.preventAutoHideAsync();

function AuthGate() {
  const { session, profile, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  // Register push notifications when authenticated
  useNotifications();

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === '(auth)';
    const inAthleteGroup = segments[0] === '(athlete)';
    const inCoachGroup = segments[0] === '(coach)';

    console.log('[AuthGate] segments:', segments.join('/'), 'session:', !!session, 'profile:', profile?.role, 'onboarded:', profile?.onboarding_completed);

    if (!session) {
      // Not signed in → go to auth
      if (!inAuthGroup) {
        console.log('[AuthGate] -> sign-in');
        router.replace('/(auth)/sign-in');
      }
    } else if (!profile?.onboarding_completed) {
      // Signed in but haven't completed onboarding
      const onOnboarding = inAuthGroup && segments[1] === 'onboarding';
      if (!onOnboarding) {
        console.log('[AuthGate] -> onboarding');
        router.replace('/(auth)/onboarding');
      }
    } else if (profile.role === 'coach') {
      if (!inCoachGroup) {
        console.log('[AuthGate] -> coach/players');
        router.replace('/(coach)/players');
      }
    } else {
      if (!inAthleteGroup) {
        console.log('[AuthGate] -> athlete/profile');
        router.replace('/(athlete)/profile');
      }
    }
  }, [session, profile, isLoading, segments]);

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: Colors.background },
        headerTintColor: Colors.text,
        headerTitleStyle: { fontWeight: '700' },
        contentStyle: { backgroundColor: Colors.background },
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      <Stack.Screen name="(athlete)" options={{ headerShown: false }} />
      <Stack.Screen name="(coach)" options={{ headerShown: false }} />
    </Stack>
  );
}

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) return null;

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <StatusBar style="dark" />
        <AuthGate />
      </AuthProvider>
    </QueryClientProvider>
  );
}
