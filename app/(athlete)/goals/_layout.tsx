import { Stack } from 'expo-router';
import { Colors } from '../../../src/constants/theme';

export default function GoalsLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: Colors.background },
        headerShadowVisible: false,
        headerTitleStyle: { fontWeight: '700', fontSize: 20 },
        headerTintColor: Colors.text,
      }}
    >
      <Stack.Screen name="index" options={{ title: 'Goals' }} />
      <Stack.Screen
        name="new"
        options={{
          title: 'New Goal',
          presentation: 'modal',
        }}
      />
      <Stack.Screen
        name="[id]"
        options={{
          title: 'Goal',
        }}
      />
    </Stack>
  );
}
