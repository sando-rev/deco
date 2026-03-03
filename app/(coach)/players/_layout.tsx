import { Stack } from 'expo-router';
import { Colors } from '../../../src/constants/theme';

export default function PlayersLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: Colors.background },
        headerShadowVisible: false,
        headerTitleStyle: { fontWeight: '700', fontSize: 20 },
        headerTintColor: Colors.text,
      }}
    >
      <Stack.Screen name="index" options={{ title: 'Players' }} />
      <Stack.Screen name="[id]" options={{ title: 'Player Detail' }} />
    </Stack>
  );
}
