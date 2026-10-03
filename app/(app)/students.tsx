import StudentCard, { type Student } from '@/components/StudentCard';
import { API_BASE_URL } from '@/constants/api';
import { useAuth } from '@/hooks/useAuth';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

export default function StudentsScreen() {
  const { token } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  const loadStudents = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_BASE_URL}/students`, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (response.status === 401 || response.status === 403) {
        setStudents([]);
        setError('Your session is no longer valid. Please sign in again.');
        return;
      }

      if (!response.ok) {
        throw new Error(`Unable to load students (${response.status}).`);
      }

      const payload = await response.json().catch(() => null);
      const rawStudents = Array.isArray(payload)
        ? payload
        : Array.isArray(payload?.data)
          ? payload.data
          : Array.isArray(payload?.students)
            ? payload.students
            : Array.isArray(payload?.value)
              ? payload.value
              : [];

      if (!Array.isArray(rawStudents)) {
        throw new Error('The server returned an unexpected student payload.');
      }

      const mappedStudents = rawStudents.map((student: any) => ({
        id: student?.id ?? student?._id ?? student?.studentId,
        name: student?.name ?? student?.fullName ?? student?.displayName ?? student?.username ?? 'Name not available',
        email: student?.email ?? student?.emailAddress ?? null,
        course: student?.course ?? student?.program ?? student?.major ?? null,
      }));

      setStudents(mappedStudents);
    } catch (loadError) {
      console.error('Failed to fetch students', loadError);
      setStudents([]);
      setError(loadError instanceof Error ? loadError.message : 'Something went wrong while loading students.');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void loadStudents();
  }, [loadStudents]);

  const filteredStudents = students.filter((student) => {
    const value = student.name ?? '';
    return value.toLowerCase().includes(search.trim().toLowerCase());
  });

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Students</Text>
      <TextInput style={styles.input} accessibilityLabel="Search students" placeholder="Search by name" value={search} onChangeText={setSearch} />
      {loading ? (
        <View style={styles.state}><ActivityIndicator color="#245bb2" /><Text style={styles.text}>Loading students…</Text><Text style={styles.note}>Complete loadStudents() to finish this state.</Text></View>
      ) : error ? (
        <View style={styles.state} accessibilityLiveRegion="polite"><Text style={styles.error}>{error}</Text><Pressable accessibilityRole="button" onPress={loadStudents}><Text style={styles.link}>Try Again</Text></Pressable></View>
      ) : (
        <FlatList
          data={filteredStudents}
          keyExtractor={(item, index) => String(item.id ?? index)}
          renderItem={({ item }) => <StudentCard student={item} />}
          ListEmptyComponent={<View style={styles.state}><Text style={styles.text}>No students found.</Text></View>}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, backgroundColor: '#f2f5fa' },
  title: { fontSize: 28, fontWeight: '700', color: '#17324d', marginBottom: 20 },
  input: { padding: 14, borderWidth: 1, borderColor: '#c6d2e1', borderRadius: 8, backgroundColor: '#ffffff', color: '#17324d', marginBottom: 20 },
  state: { padding: 24, gap: 12, alignItems: 'center' },
  text: { color: '#536579' },
  note: { color: '#536579', fontSize: 12 },
  error: { color: '#b42318' },
  link: { color: '#245bb2', padding: 12 },
});
