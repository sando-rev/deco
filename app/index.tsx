import { Redirect } from 'expo-router';

// This is the entry point. Always redirect to sign-in.
// The _layout.tsx AuthGate will handle routing to the correct screen.
export default function Index() {
  return <Redirect href="/(auth)/sign-in" />;
}
