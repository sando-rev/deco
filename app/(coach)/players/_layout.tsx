import { Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Colors } from '../../../src/constants/theme';

export default function PlayersLayout() {
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
      <Stack.Screen name="index" options={{ title: t('tabs.players') }} />
      <Stack.Screen name="[id]" options={{ title: t('coach.playerDetail') }} />
    </Stack>
  );
}
