import React from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Google from 'expo-auth-session/providers/google';
import {
  loginOrRegisterWithEmail,
  loginWithGoogleIdToken,
  loginWithGooglePopup,
} from '../services/auth-service';
import { borderRadius, colors, shadows, spacing } from '../theme/colors';

export function LoginScreen() {
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [isLoadingEmail, setIsLoadingEmail] = React.useState(false);
  const [isLoadingGoogle, setIsLoadingGoogle] = React.useState(false);

  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
    iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
  });

  React.useEffect(() => {
    const completeGoogleLogin = async () => {
      if (response?.type !== 'success') {
        return;
      }

      try {
        setIsLoadingGoogle(true);
        const idToken = response.params?.id_token;
        const accessToken = response.params?.access_token;
        await loginWithGoogleIdToken(idToken, accessToken);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Falha ao entrar com Google.';
        Alert.alert('Erro no login', message);
      } finally {
        setIsLoadingGoogle(false);
      }
    };

    completeGoogleLogin();
  }, [response]);

  const handleEmailLogin = async () => {
    try {
      setIsLoadingEmail(true);
      await loginOrRegisterWithEmail(email, password);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Falha ao entrar com email.';
      Alert.alert('Erro no login', message);
    } finally {
      setIsLoadingEmail(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setIsLoadingGoogle(true);

      if (Platform.OS === 'web') {
        await loginWithGooglePopup();
        return;
      }

      if (!request) {
        throw new Error(
          'Configure EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID e EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID.'
        );
      }

      await promptAsync();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Falha ao entrar com Google.';
      Alert.alert('Erro no login', message);
      setIsLoadingGoogle(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.keyboard}>
        <View style={styles.header}>
          <Text style={styles.title}>Curuka</Text>
          <Text style={styles.subtitle}>Entre com email ou Google</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            onChangeText={setEmail}
            placeholder="voce@email.com"
            placeholderTextColor={colors.neutral.text.muted}
            style={styles.input}
            value={email}
          />

          <Text style={styles.label}>Senha</Text>
          <TextInput
            onChangeText={setPassword}
            placeholder="Sua senha"
            placeholderTextColor={colors.neutral.text.muted}
            secureTextEntry
            style={styles.input}
            value={password}
          />

          <TouchableOpacity
            disabled={isLoadingEmail || isLoadingGoogle}
            onPress={handleEmailLogin}
            style={[styles.button, styles.emailButton]}
          >
            {isLoadingEmail ? (
              <ActivityIndicator color={colors.neutral.white} />
            ) : (
              <Text style={styles.buttonText}>Entrar com email</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            disabled={isLoadingEmail || isLoadingGoogle}
            onPress={handleGoogleLogin}
            style={[styles.button, styles.googleButton]}
          >
            {isLoadingGoogle ? (
              <ActivityIndicator color={colors.neutral.text.primary} />
            ) : (
              <Text style={styles.googleButtonText}>Continuar com Google</Text>
            )}
          </TouchableOpacity>

          <Text style={styles.helpText}>Se o email nao existir, a conta sera criada automaticamente.</Text>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.neutral.background,
  },
  keyboard: {
    flex: 1,
    justifyContent: 'center',
    padding: spacing.md,
  },
  header: {
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: 34,
    fontWeight: '800',
    color: colors.primary[700],
  },
  subtitle: {
    fontSize: 15,
    marginTop: spacing.xs,
    color: colors.neutral.text.secondary,
  },
  card: {
    backgroundColor: colors.neutral.card,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    ...shadows.medium,
  },
  label: {
    color: colors.neutral.text.secondary,
    fontSize: 13,
    marginBottom: spacing.xs,
    marginTop: spacing.sm,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.neutral.border,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    fontSize: 15,
    color: colors.neutral.text.primary,
    backgroundColor: colors.neutral.white,
  },
  button: {
    borderRadius: borderRadius.md,
    paddingVertical: 13,
    alignItems: 'center',
    marginTop: spacing.md,
  },
  emailButton: {
    backgroundColor: colors.primary[600],
  },
  googleButton: {
    backgroundColor: '#F4F5F7',
    borderWidth: 1,
    borderColor: colors.neutral.border,
  },
  buttonText: {
    color: colors.neutral.white,
    fontWeight: '700',
    fontSize: 15,
  },
  googleButtonText: {
    color: colors.neutral.text.primary,
    fontWeight: '700',
    fontSize: 15,
  },
  helpText: {
    marginTop: spacing.md,
    color: colors.neutral.text.muted,
    fontSize: 12,
    textAlign: 'center',
  },
});
