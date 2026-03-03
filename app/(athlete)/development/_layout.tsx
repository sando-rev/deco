import { Stack } from 'expo-router';
import { Colors } from '../../../src/constants/theme';

export default function DevelopmentLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: Colors.background },
        headerShadowVisible: false,
        headerTitleStyle: { fontWeight: '700', fontSize: 20 },
        headerTintColor: Colors.text,
      }}
    >
      <Stack.Screen name="index" options={{ title: 'Development' }} />
      <Stack.Screen
        name="reflect"
        options={{
          title: 'Reflect',
          presentation: 'modal',
        }}
      />
    </Stack>
  );
}
