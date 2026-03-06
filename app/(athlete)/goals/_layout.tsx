import { Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Colors } from '../../../src/constants/theme';

export default function GoalsLayout() {
  const { t } = useTranslation();

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: Colors.background },
        headerShadowVisible: false,
        headerTitleStyle: { fontWeight: '700', fontSize: 20 },
        headerTintColor: Colors.text,
      }}
    >
      <Stack.Screen name="index" options={{ title: t('goals.title') }} />
      <Stack.Screen
        name="new"
        options={{
          title: t('goals.newGoal'),
          presentation: 'modal',
        }}
      />
      <Stack.Screen
        name="[id]"
        options={{
          title: t('goals.goalDetail'),
        }}
      />
    </Stack>
  );
}
