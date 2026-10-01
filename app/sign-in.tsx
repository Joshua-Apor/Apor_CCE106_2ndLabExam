import { API_BASE_URL } from '@/constants/api';
import { useAuth } from '@/hooks/useAuth';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

export default function SignInScreen() {
  const { login, token } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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

    if (!normalizedEmail || !normalizedPassword) {
      setError('Please enter both email and password.');
      return;
    }

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
      const payload = responseText ? JSON.parse(responseText) : {};

      if (!response.ok) {
        const serverMessage = payload?.message ?? payload?.error ?? 'Login failed. Please try again.';
        throw new Error(serverMessage);
      }

      const rawData = payload?.data ?? payload;
      const accessToken = rawData?.accessToken ?? rawData?.token ?? rawData?.access_token ?? payload?.token ?? payload?.accessToken ?? '';
      const userPayload = rawData?.user ?? rawData?.profile ?? payload?.user ?? payload?.profile ?? rawData ?? payload;

      if (!accessToken) {
        throw new Error('The server did not return an access token.');
      }

      await login(accessToken, {
        id: userPayload?.id ?? userPayload?.userId ?? userPayload?._id,
        name: userPayload?.name ?? userPayload?.fullName ?? userPayload?.displayName ?? userPayload?.username ?? normalizedEmail.split('@')[0],
        email: userPayload?.email ?? normalizedEmail,
        role: userPayload?.role ?? userPayload?.userRole ?? userPayload?.type,
      });

      router.replace('/(app)');
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Something went wrong while signing in.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <View style={styles.card}>
        <Text style={styles.eyebrow}>CCE106 • PRACTICAL EXAMINATION</Text>
        <Text style={styles.title}>Student Service Portal</Text>
        <Text style={styles.subtitle}>Sign in to access student services.</Text>
        <Text style={styles.label}>Email</Text>
        <TextInput style={styles.input} accessibilityLabel="Email" placeholder="student@example.com" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" autoCorrect={false} />
        <Text style={styles.label}>Password</Text>
        <TextInput style={styles.input} accessibilityLabel="Password" placeholder="Enter your password" value={password} onChangeText={setPassword} secureTextEntry />
        <View style={styles.feedback} accessibilityLiveRegion="polite">
          {loading && <ActivityIndicator color="#245bb2" accessibilityLabel="Signing in" />}
          {error ? <Text style={styles.error}>{error}</Text> : null}
        </View>
        <Pressable accessibilityRole="button" style={styles.button} onPress={handleLogin} disabled={loading}>
          <Text style={styles.buttonText}>{loading ? 'Signing in…' : 'Login'}</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, justifyContent: 'center', padding: 24, backgroundColor: '#f2f5fa' },
  card: { width: '100%', maxWidth: 440, alignSelf: 'center', padding: 24, borderRadius: 16, backgroundColor: '#ffffff' },
  eyebrow: { fontSize: 11, fontWeight: '700', color: '#245bb2', marginBottom: 12 },
  title: { fontSize: 28, fontWeight: '700', color: '#17324d' },
  subtitle: { color: '#536579', marginTop: 8, marginBottom: 24 },
  label: { color: '#17324d', fontWeight: '600', marginBottom: 8 },
  input: { borderWidth: 1, borderColor: '#c6d2e1', borderRadius: 8, padding: 14, fontSize: 16, marginBottom: 16, color: '#17324d' },
  feedback: { minHeight: 28 },
  error: { color: '#b42318' },
  button: { backgroundColor: '#245bb2', padding: 15, borderRadius: 8, alignItems: 'center' },
  buttonText: { color: '#ffffff', fontWeight: '700' },
});
