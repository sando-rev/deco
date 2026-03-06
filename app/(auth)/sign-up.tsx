import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { Link } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../src/hooks/useAuth';
import { Input } from '../../src/components/ui/Input';
import { Button } from '../../src/components/ui/Button';
import { Colors, Spacing, FontSize, BorderRadius } from '../../src/constants/theme';
import { Role } from '../../src/types/database';

export default function SignUp() {
  const { t } = useTranslation();
  const { signUp } = useAuth();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<Role>('athlete');
  const [loading, setLoading] = useState(false);

  const handleSignUp = async () => {
    if (!fullName || !email || !password) {
      Alert.alert(t('common.error'), t('auth.fillAllFields'));
      return;
    }
    if (password.length < 6) {
      Alert.alert(t('common.error'), t('auth.passwordMinError'));
      return;
    }

    setLoading(true);
    const { error } = await signUp(email, password, fullName, role);
    setLoading(false);

    if (error) {
      Alert.alert(t('auth.signUpFailed'), error.message);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Text style={styles.logo}>{t('auth.appName')}</Text>
          <Text style={styles.subtitle}>{t('auth.createAccount')}</Text>
        </View>

        <View style={styles.form}>
          <Input
            label={t('auth.fullName')}
            placeholder={t('auth.fullNamePlaceholder')}
            value={fullName}
            onChangeText={setFullName}
            autoCapitalize="words"
          />
          <Input
            label={t('auth.email')}
            placeholder={t('auth.emailPlaceholder')}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />
          <Input
            label={t('auth.password')}
            placeholder={t('auth.passwordMin')}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <Text style={styles.roleLabel}>{t('auth.iAmA')}</Text>
          <View style={styles.roleContainer}>
            <TouchableOpacity
              style={[styles.roleCard, role === 'athlete' && styles.roleCardActive]}
              onPress={() => setRole('athlete')}
              activeOpacity={0.7}
            >
              <Ionicons
                name="person"
                size={28}
                color={role === 'athlete' ? Colors.primary : Colors.textTertiary}
              />
              <Text
                style={[
                  styles.roleTitle,
                  role === 'athlete' && styles.roleTitleActive,
                ]}
              >
                {t('auth.player')}
              </Text>
              <Text style={styles.roleDesc}>
                {t('auth.playerDesc')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.roleCard, role === 'coach' && styles.roleCardActive]}
              onPress={() => setRole('coach')}
              activeOpacity={0.7}
            >
              <Ionicons
                name="people"
                size={28}
                color={role === 'coach' ? Colors.primary : Colors.textTertiary}
              />
              <Text
                style={[
                  styles.roleTitle,
                  role === 'coach' && styles.roleTitleActive,
                ]}
              >
                {t('auth.coach')}
              </Text>
              <Text style={styles.roleDesc}>
                {t('auth.coachDesc')}
              </Text>
            </TouchableOpacity>
          </View>

          <Button
            title={t('auth.signUp')}
            onPress={handleSignUp}
            loading={loading}
            size="lg"
            style={styles.button}
          />
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>{t('auth.hasAccount')} </Text>
          <Link href="/(auth)/sign-in" style={styles.link}>
            {t('auth.signIn')}
          </Link>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.xl,
  },
  header: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  logo: {
    fontSize: 40,
    fontWeight: '800',
    color: Colors.primary,
    letterSpacing: -1,
  },
  subtitle: {
    fontSize: FontSize.lg,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
  form: {
    marginBottom: Spacing.lg,
  },
  roleLabel: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  roleContainer: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  roleCard: {
    flex: 1,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: 'center',
    gap: Spacing.xs,
  },
  roleCardActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary + '08',
  },
  roleTitle: {
    fontSize: FontSize.md,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  roleTitleActive: {
    color: Colors.primary,
  },
  roleDesc: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 16,
  },
  button: {
    marginTop: Spacing.sm,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerText: {
    color: Colors.textSecondary,
    fontSize: FontSize.md,
  },
  link: {
    color: Colors.primary,
    fontSize: FontSize.md,
    fontWeight: '600',
  },
});
