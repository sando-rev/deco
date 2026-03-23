import { View, Text, StyleSheet } from 'react-native';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Colors } from '../../src/constants/theme';
import { useUnseenFeedbackCount } from '../../src/hooks/useGamification';
import { useUnseenScoreFeedback } from '../../src/hooks/useTeam';
import { useRealtimeCoachFeedback } from '../../src/hooks/useGoals';

export default function AthleteLayout() {
  const { t } = useTranslation();
  const { data: unseenCount } = useUnseenFeedbackCount();
  const { hasUnseen: hasUnseenScoreFeedback } = useUnseenScoreFeedback();
  useRealtimeCoachFeedback();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textTertiary,
        tabBarStyle: {
          backgroundColor: Colors.surface,
          borderTopColor: Colors.borderLight,
          paddingBottom: 4,
          height: 88,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
        headerStyle: {
          backgroundColor: Colors.background,
        },
        headerShadowVisible: false,
        headerTitleStyle: {
          fontWeight: '700',
          fontSize: 20,
        },
        headerTintColor: Colors.text,
      }}
    >
      <Tabs.Screen
        name="profile"
        options={{
          title: t('tabs.profile'),
          tabBarIcon: ({ color, size }) => (
            <View>
              <Ionicons name="person" size={size} color={color} />
              {hasUnseenScoreFeedback && (
                <View style={styles.dot} />
              )}
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="goals"
        options={{
          title: t('tabs.goals'),
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <View>
              <Ionicons name="flag" size={size} color={color} />
              {(unseenCount ?? 0) > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{unseenCount}</Text>
                </View>
              )}
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="development"
        options={{
          title: t('tabs.development'),
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="trending-up" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: t('tabs.settings'),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="settings" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  badge: {
    position: 'absolute',
    top: -4,
    right: -8,
    backgroundColor: '#F5A623',
    borderRadius: 9,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: Colors.surface,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#fff',
  },
  dot: {
    position: 'absolute',
    top: -2,
    right: -4,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#F5A623',
    borderWidth: 2,
    borderColor: Colors.surface,
  },
});
