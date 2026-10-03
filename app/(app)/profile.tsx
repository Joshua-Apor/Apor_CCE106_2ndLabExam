import { useAuth } from '@/hooks/useAuth';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

export default function ProfileScreen() {
  const { user, token, logout } = useAuth();

  const [profile, setProfile] = useState(user);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadProfile = useCallback(async () => {
    setLoading(true);
    setError('');

    // The logged-in user from useAuth() is the dynamic profile.
    if (!token || !user) {
      setProfile(null);
      setLoading(false);
      return;
    }

    try {
      // Use the user returned by the login API.
      // This prevents a fixed Postman /profile example
      // from showing the wrong student's information.
      setProfile({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      });
    } catch (loadError) {
      console.error('Failed to load profile:', loadError);

      setProfile(null);
      setError(
        loadError instanceof Error
          ? loadError.message
          : 'Something went wrong while loading your profile.'
      );
    } finally {
      setLoading(false);
    }
  }, [token, user]);

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
        <View style={styles.state}>
          <Text
            style={styles.error}
            accessibilityLiveRegion="polite"
          >
            {error}
          </Text>
        </View>
      ) : !displayProfile ? (
        <View style={styles.card}>
          <Text style={styles.text}>No profile loaded yet.</Text>
        </View>
      ) : (
        <View style={styles.card}>
          <View style={styles.profileRow}>
            <Text style={styles.label}>Name</Text>
            <Text style={styles.value}>
              {displayProfile.name || '—'}
            </Text>
          </View>

          <View style={styles.profileRow}>
            <Text style={styles.label}>Email</Text>
            <Text style={styles.value}>
              {displayProfile.email || '—'}
            </Text>
          </View>

          <View style={styles.profileRow}>
            <Text style={styles.label}>Role</Text>
            <Text style={styles.value}>
              {displayProfile.role || '—'}
            </Text>
          </View>
        </View>
      )}

      <View style={styles.sessionCard}>
        <Text style={styles.sessionTitle}>Session Status</Text>

        <Text style={styles.sessionText}>
          {token ? 'Authenticated' : 'Not Available'}
        </Text>
      </View>

      <Pressable
        accessibilityRole="button"
        style={styles.button}
        onPress={logout}
      >
        <Text style={styles.buttonText}>LOGOUT</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 24,
    gap: 20,
    backgroundColor: '#f2f5fa',
  },

  title: {
    color: '#17324d',
    fontSize: 24,
    fontWeight: '700',
  },

  state: {
    paddingVertical: 20,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },

  card: {
    backgroundColor: '#ffffff',
    padding: 20,
    gap: 18,
    borderRadius: 12,
  },

  profileRow: {
    gap: 5,
  },

  label: {
    color: '#7a8796',
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
  },

  value: {
    color: '#17324d',
    fontSize: 17,
    fontWeight: '600',
  },

  text: {
    color: '#536579',
    fontSize: 16,
  },

  sessionCard: {
    backgroundColor: '#ffffff',
    padding: 18,
    borderRadius: 12,
    gap: 6,
  },

  sessionTitle: {
    color: '#17324d',
    fontSize: 14,
    fontWeight: '700',
  },

  sessionText: {
    color: '#536579',
    fontSize: 15,
  },

  error: {
    color: '#b42318',
    fontSize: 15,
    textAlign: 'center',
  },

  button: {
    backgroundColor: '#245bb2',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },

  buttonText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 15,
  },
});