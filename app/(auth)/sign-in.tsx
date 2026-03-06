import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { Link } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../src/hooks/useAuth';
import { Input } from '../../src/components/ui/Input';
import { Button } from '../../src/components/ui/Button';
import { Colors, Spacing, FontSize } from '../../src/constants/theme';

export default function SignIn() {
  const { t } = useTranslation();
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignIn = async () => {
    if (!email || !password) {
      Alert.alert(t('common.error'), t('auth.fillAllFields'));
      return;
    }

    setLoading(true);
    const { error } = await signIn(email, password);
    setLoading(false);

    if (error) {
      Alert.alert(t('auth.signInFailed'), error.message);
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
          <Text style={styles.subtitle}>{t('auth.tagline')}</Text>
          <Text style={styles.tagline}>
            {t('auth.subtitle')}
          </Text>
        </View>

        <View style={styles.form}>
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
            placeholder={t('auth.passwordPlaceholder')}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
          <Button
            title={t('auth.signIn')}
            onPress={handleSignIn}
            loading={loading}
            size="lg"
            style={styles.button}
          />
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>{t('auth.noAccount')} </Text>
          <Link href="/(auth)/sign-up" style={styles.link}>
            {t('auth.signUp')}
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
  },
  header: {
    alignItems: 'center',
    marginBottom: Spacing.xxl,
  },
  logo: {
    fontSize: 48,
    fontWeight: '800',
    color: Colors.primary,
    letterSpacing: -1,
  },
  subtitle: {
    fontSize: FontSize.md,
    color: Colors.primaryLight,
    fontWeight: '600',
    marginTop: Spacing.xs,
  },
  tagline: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: Spacing.sm,
    maxWidth: 280,
  },
  form: {
    marginBottom: Spacing.lg,
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
