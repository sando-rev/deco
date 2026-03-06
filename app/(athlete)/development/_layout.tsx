import { Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Colors } from '../../../src/constants/theme';

export default function DevelopmentLayout() {
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
      <Stack.Screen name="index" options={{ title: t('development.title') }} />
      <Stack.Screen
        name="reflect"
        options={{
          title: t('development.reflect'),
          presentation: 'modal',
        }}
      />
    </Stack>
  );
}
