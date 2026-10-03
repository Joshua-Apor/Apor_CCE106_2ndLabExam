import { API_BASE_URL } from '@/constants/api';
import { useAuth } from '@/hooks/useAuth';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

export default function ProfileScreen() {
  const { user, token, logout } = useAuth();
  const [profile, setProfile] = useState(user);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadProfile = useCallback(async () => {
    if (!token) {
      setProfile(null);
      setError('');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_BASE_URL}/profile`, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.status === 401 || response.status === 403) {
        setProfile(null);
        setError('Your session is no longer valid. Please sign in again.');
        await logout();
        return;
      }

      if (!response.ok) {
        throw new Error(`Unable to load profile (${response.status}).`);
      }

      const payload = await response.json().catch(() => null);
      const nextProfile = payload && typeof payload === 'object' ? payload : user;

      setProfile({
        id: nextProfile?.id ?? nextProfile?.userId ?? nextProfile?._id,
        name: nextProfile?.name ?? nextProfile?.fullName ?? nextProfile?.displayName ?? nextProfile?.username ?? 'Student',
        email: nextProfile?.email ?? nextProfile?.emailAddress ?? user?.email ?? null,
        role: nextProfile?.role ?? nextProfile?.userRole ?? nextProfile?.type ?? null,
      });
    } catch (loadError) {
      console.error('Failed to fetch profile', loadError);
      setProfile(null);
      setError(loadError instanceof Error ? loadError.message : 'Something went wrong while loading your profile.');
    } finally {
      setLoading(false);
    }
  }, [token, user, logout]);

  useEffect(() => {
    void loadProfile();
  }, [loadProfile]);

  const displayProfile = profile ?? user;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>MY PROFILE</Text>
      {loading ? (
        <View style={styles.state}>
          <ActivityIndicator color="#245bb2" />
          <Text style={styles.text}>Loading profile…</Text>
        </View>
      ) : error ? (
        <Text style={styles.error} accessibilityLiveRegion="polite">{error}</Text>
      ) : (
        <View style={styles.card}>
          <Text style={styles.text}>Name: {displayProfile?.name || '—'}</Text>
          <Text style={styles.text}>Email: {displayProfile?.email || '—'}</Text>
          <Text style={styles.text}>Role: {displayProfile?.role || '—'}</Text>
          {!displayProfile && <Text style={styles.note}>No profile loaded yet.</Text>}
        </View>
      )}
      <Text style={styles.text}>Session Status: {token ? 'Authenticated' : 'Not Available'}</Text>
      <Pressable accessibilityRole="button" style={styles.button} onPress={logout}><Text style={styles.buttonText}>LOGOUT</Text></Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: 24, gap: 20, backgroundColor: '#f2f5fa' },
  title: { color: '#17324d', fontSize: 24, fontWeight: '700' },
  state: { paddingVertical: 12, alignItems: 'center', gap: 12 },
  card: { backgroundColor: '#ffffff', padding: 20, gap: 16, borderRadius: 12 },
  text: { color: '#536579', fontSize: 16 },
  note: { color: '#536579', fontSize: 12 },
  error: { color: '#b42318' },
  button: { backgroundColor: '#245bb2', padding: 16, borderRadius: 8, alignItems: 'center' },
  buttonText: { color: '#ffffff', fontWeight: '600' },
});
