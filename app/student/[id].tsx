import { type Student } from '@/components/StudentCard';
import { API_BASE_URL } from '@/constants/api';
import { useAuth } from '@/hooks/useAuth';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

export default function StudentDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { token } = useAuth();
  const [student, setStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadStudent = useCallback(async () => {
    const requestedId = Array.isArray(id) ? id[0] : id;

    if (!requestedId) {
      setStudent(null);
      setError('Student id is missing.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_BASE_URL}/students/${encodeURIComponent(requestedId)}`, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (response.status === 401 || response.status === 403) {
        setStudent(null);
        setError('Your session is no longer valid. Please sign in again.');
        return;
      }

      if (response.status === 404) {
        setStudent(null);
        setError('Student not found.');
        return;
      }

      if (!response.ok) {
        throw new Error(`Unable to load student (${response.status}).`);
      }

      const payload = await response.json().catch(() => null);
      const nextStudent = payload && typeof payload === 'object' ? payload : null;

      if (!nextStudent) {
        throw new Error('The server returned an unexpected student payload.');
      }

      setStudent({
        id: nextStudent.id ?? nextStudent._id ?? nextStudent.studentId,
        name: nextStudent.name ?? nextStudent.fullName ?? nextStudent.displayName ?? nextStudent.username ?? 'Name not available',
        email: nextStudent.email ?? nextStudent.emailAddress ?? null,
        course: nextStudent.course ?? nextStudent.program ?? nextStudent.major ?? null,
      });
    } catch (loadError) {
      console.error('Failed to fetch student detail', loadError);
      setStudent(null);
      setError(loadError instanceof Error ? loadError.message : 'Something went wrong while loading the student.');
    } finally {
      setLoading(false);
    }
  }, [id, token]);

  useEffect(() => {
    void loadStudent();
  }, [loadStudent]);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Student Details</Text>
      {loading ? <View style={styles.state}><ActivityIndicator color="#245bb2" /><Text style={styles.text}>Loading student…</Text></View>
        : error ? <Text style={styles.error} accessibilityLiveRegion="polite">{error}</Text>
        : !student ? <Text style={styles.text}>No student record available.</Text> : null}
      <View style={styles.card}>
        <Text style={styles.text}>ID: {student?.id ?? id ?? 'Not available'}</Text>
        <Text style={styles.text}>Name: {student?.name || '—'}</Text>
        <Text style={styles.text}>Email: {student?.email || '—'}</Text>
        <Text style={styles.text}>Course: {student?.course || '—'}</Text>
      </View>
      <Pressable accessibilityRole="button" style={styles.button} onPress={() => router.back()}><Text style={styles.buttonText}>Back</Text></Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: 24, gap: 20, backgroundColor: '#f2f5fa' },
  title: { color: '#17324d', fontSize: 28, fontWeight: '700' },
  state: { gap: 12, alignItems: 'center' },
  card: { backgroundColor: '#ffffff', padding: 20, gap: 16, borderRadius: 12 },
  text: { color: '#536579', fontSize: 16 },
  error: { color: '#b42318' },
  button: { backgroundColor: '#245bb2', padding: 16, borderRadius: 8, alignItems: 'center' },
  buttonText: { color: '#ffffff', fontWeight: '600' },
});
