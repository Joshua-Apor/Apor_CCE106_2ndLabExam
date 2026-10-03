import { API_BASE_URL } from '@/constants/api';
import { useAuth } from '@/hooks/useAuth';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

const INVALID_LOGIN_MESSAGE = 'invalid email or password, try again';

const getErrorMessage = (value: unknown): string | undefined => {
  if (typeof value === 'string') {
    const message = value.trim();

    return message && !/^https?:\/\/\S+$/i.test(message)
      ? message
      : undefined;
  }

  if (Array.isArray(value)) {
    const messages = value
      .map(getErrorMessage)
      .filter((message): message is string => Boolean(message));

    return messages.length ? messages.join(' ') : undefined;
  }

  if (value && typeof value === 'object') {
    const errorData = value as Record<string, unknown>;

    for (const key of ['message', 'error', 'detail']) {
      const message = getErrorMessage(errorData[key]);

      if (message) {
        return message;
      }
    }

    const messages = Object.entries(errorData)
      .filter(([key]) => key !== 'code' && key !== 'status')
      .map(([, nestedValue]) => getErrorMessage(nestedValue))
      .filter((message): message is string => Boolean(message));

    return messages.length ? messages.join(' ') : undefined;
  }

  return undefined;
};

export default function SignInScreen() {
  const { login, token } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (token) {
      router.replace('/(app)');
    }
  }, [token]);

  const handleLogin = async () => {
    const normalizedEmail = email.trim();
    const normalizedPassword = password.trim();

    // Check empty fields
    if (!normalizedEmail || !normalizedPassword) {
      setError('Please enter both email and password.');
      return;
    }
    // Check email format
    if (!/\S+@\S+\.\S+/.test(normalizedEmail)) {
      setError('Please enter a valid email address.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_BASE_URL}/login`, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: normalizedEmail,
          password: normalizedPassword,
        }),
      });

      const responseText = await response.text();

      let payload: any = {};

      try {
        payload = responseText ? JSON.parse(responseText) : {};
      } catch {
        payload = {};
      }

      if (!response.ok) {
        throw new Error(INVALID_LOGIN_MESSAGE);
      }

      const rawData = payload?.data ?? payload;

      const accessToken =
        rawData?.accessToken ??
        rawData?.token ??
        rawData?.access_token ??
        payload?.token ??
        payload?.accessToken ??
        '';

      const userPayload =
        rawData?.user ??
        rawData?.profile ??
        payload?.user ??
        payload?.profile ??
        rawData ??
        payload;

      // Make sure the API returned a token
      if (!accessToken) {
        throw new Error(INVALID_LOGIN_MESSAGE);
      }
     
      await login(accessToken, {
        id:
          userPayload?.id ??
          userPayload?.userId ??
          userPayload?._id,

        name:
          userPayload?.name ??
          userPayload?.fullName ??
          userPayload?.displayName ??
          userPayload?.username ??
          normalizedEmail.split('@')[0],

        email:
          userPayload?.email ??
          normalizedEmail,

        role:
          userPayload?.role ??
          userPayload?.userRole ??
          userPayload?.type ??
          'student',
      });

      // Login successful
      setError('');

      router.replace('/(app)');
    } catch (error) {
      if (error instanceof Error) {
        setError(
          error.message === INVALID_LOGIN_MESSAGE
            ? INVALID_LOGIN_MESSAGE
            : INVALID_LOGIN_MESSAGE
        );
      } else {
        setError(INVALID_LOGIN_MESSAGE);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.card}>
        <Text style={styles.eyebrow}>
          CCE106 • PRACTICAL EXAMINATION
        </Text>

        <Text style={styles.title}>
          Student Service Portal
        </Text>

        <Text style={styles.subtitle}>
          Sign in to access student services.
        </Text>

        <Text style={styles.label}>
          Email
        </Text>

        <TextInput
          style={styles.input}
          accessibilityLabel="Email"
          placeholder="students@example.com"
          value={email}
          onChangeText={(text) => {
            setEmail(text);
            setError('');
          }}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          editable={!loading}
        />

        <Text style={styles.label}>
          Password
        </Text>

        <View style={styles.passwordInput}>
          <TextInput
            style={styles.passwordTextInput}
            accessibilityLabel="Password"
            placeholder="passwords: password123"
            value={password}
            onChangeText={(text) => {
              setPassword(text);
              setError('');
            }}
            secureTextEntry={!showPassword}
            editable={!loading}
          />

          <Pressable
            accessibilityRole="button"
            accessibilityLabel={
              showPassword ? 'Hide password' : 'Show password'
            }
            onPress={() => setShowPassword(!showPassword)}
            hitSlop={8}
            disabled={loading}
          >
            <Text style={styles.passwordToggle}>
              {showPassword ? 'Hide' : 'Show'}
            </Text>
          </Pressable>
        </View>

        <View
          style={styles.feedback}
          accessibilityLiveRegion="polite"
        >
          {loading && (
            <ActivityIndicator
              color="#245bb2"
              accessibilityLabel="Signing in"
            />
          )}

          {error ? (
            <Text style={styles.error}>
              {error}
            </Text>
          ) : null}
        </View>

        <Pressable
          accessibilityRole="button"
          style={[
            styles.button,
            loading && styles.buttonDisabled,
          ]}
          onPress={handleLogin}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? 'Signing in…' : 'Login'}
          </Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#f2f5fa',
  },

  card: {
    width: '100%',
    maxWidth: 440,
    alignSelf: 'center',
    padding: 24,
    borderRadius: 16,
    backgroundColor: '#ffffff',
  },

  eyebrow: {
    fontSize: 11,
    fontWeight: '700',
    color: '#245bb2',
    marginBottom: 12,
  },

  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#17324d',
  },

  subtitle: {
    color: '#536579',
    marginTop: 8,
    marginBottom: 24,
  },

  label: {
    color: '#17324d',
    fontWeight: '600',
    marginBottom: 8,
  },

  input: {
    borderWidth: 1,
    borderColor: '#c6d2e1',
    borderRadius: 8,
    padding: 14,
    fontSize: 16,
    marginBottom: 16,
    color: '#17324d',
  },

  passwordInput: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#c6d2e1',
    borderRadius: 8,
    paddingHorizontal: 14,
    marginBottom: 16,
  },

  passwordTextInput: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 16,
    color: '#17324d',
  },

  passwordToggle: {
    color: '#245bb2',
    fontWeight: '700',
    marginLeft: 12,
  },

  feedback: {
    minHeight: 28,
  },

  error: {
    color: '#b42318',
  },

  button: {
    backgroundColor: '#245bb2',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },

  buttonDisabled: {
    opacity: 0.6,
  },

  buttonText: {
    color: '#ffffff',
    fontWeight: '700',
  },
});