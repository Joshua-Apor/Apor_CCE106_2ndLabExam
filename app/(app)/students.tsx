import StudentCard, { type Student } from '@/components/StudentCard';
import { API_BASE_URL } from '@/constants/api';
import { useAuth } from '@/hooks/useAuth';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

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
      const url = `${API_BASE_URL}/students`;

      console.log('=================================');
      console.log('Fetching students');
      console.log('API URL:', url);
      console.log('Token:', token);
      console.log('=================================');

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          Accept: 'application/json',

          ...(token
            ? {
                Authorization: `Bearer ${token}`,
              }
            : {}),
        },
      });

      console.log('Response status:', response.status);

      // Read the response as text first.
      // This lets us see exactly what Postman returned.
      const responseText = await response.text();

      console.log('Raw API response:', responseText);

      // Session/authentication error
      if (response.status === 401 || response.status === 403) {
        setStudents([]);
        setError(
          'Your session is no longer valid. Please sign in again.'
        );
        return;
      }

      // Other HTTP errors
      if (!response.ok) {
        throw new Error(
          `Unable to load students (${response.status}).`
        );
      }

      // Convert response text into JSON
      let payload: any;

      try {
        payload = JSON.parse(responseText);
      } catch {
        throw new Error(
          'The server did not return valid JSON.'
        );
      }

      console.log('Parsed API response:', payload);

      /*
       * Supported response formats:
       *
       * 1. Direct array
       * [
       *   { ... },
       *   { ... }
       * ]
       *
       * 2. { data: [...] }
       *
       * 3. { students: [...] }
       *
       * 4. { value: [...] }
       */

      let rawStudents: any[] | null = null;

      if (Array.isArray(payload)) {
        rawStudents = payload;
      } else if (Array.isArray(payload?.data)) {
        rawStudents = payload.data;
      } else if (Array.isArray(payload?.students)) {
        rawStudents = payload.students;
      } else if (Array.isArray(payload?.value)) {
        rawStudents = payload.value;
      }

      if (!rawStudents) {
        console.error(
          'Unexpected API response:',
          payload
        );

        throw new Error(
          'The API response does not contain a student array.'
        );
      }

      console.log('Students received:', rawStudents.length);

      /*
       * Convert the API student objects into the format
       * expected by StudentCard.
       */
      const mappedStudents: Student[] = rawStudents.map(
        (student: any, index: number) => ({
          id:
            student?.id ??
            student?._id ??
            student?.studentId ??
            index + 1,

          name:
            student?.name ??
            student?.fullName ??
            student?.displayName ??
            student?.username ??
            'Name not available',

          email:
            student?.email ??
            student?.emailAddress ??
            null,

          course:
            student?.course ??
            student?.program ??
            student?.major ??
            null,
        })
      );

      console.log('Mapped students:', mappedStudents);

      setStudents(mappedStudents);
    } catch (loadError) {
      console.error(
        'Failed to fetch students:',
        loadError
      );

      setStudents([]);

      if (loadError instanceof Error) {
        setError(loadError.message);
      } else {
        setError(
          'Something went wrong while loading students.'
        );
      }
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void loadStudents();
  }, [loadStudents]);

  /*
   * Search students by name.
   */
  const filteredStudents = students.filter((student) => {
    const name = student.name ?? '';

    return name
      .toLowerCase()
      .includes(search.trim().toLowerCase());
  });

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Students</Text>

      <TextInput
        style={styles.input}
        accessibilityLabel="Search students"
        placeholder="Search by name"
        placeholderTextColor="#8a98a8"
        value={search}
        onChangeText={setSearch}
        autoCapitalize="none"
        autoCorrect={false}
      />

      {loading ? (
        <View style={styles.state}>
          <ActivityIndicator
            size="large"
            color="#245bb2"
          />

          <Text style={styles.text}>
            Loading students...
          </Text>
        </View>
      ) : error ? (
        <View
          style={styles.state}
          accessibilityLiveRegion="polite"
        >
          <Text style={styles.error}>
            {error}
          </Text>

          <Pressable
            accessibilityRole="button"
            onPress={loadStudents}
            style={styles.retryButton}
          >
            <Text style={styles.retryText}>
              Try Again
            </Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={filteredStudents}
          keyExtractor={(item, index) =>
            String(item.id ?? index)
          }
          renderItem={({ item }) => (
            <StudentCard student={item} />
          )}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={
            filteredStudents.length === 0
              ? styles.emptyList
              : styles.list
          }
          ListEmptyComponent={
            <View style={styles.state}>
              <Text style={styles.text}>
                {search.trim()
                  ? 'No students found matching your search.'
                  : 'No students found.'}
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    backgroundColor: '#f2f5fa',
  },

  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#17324d',
    marginBottom: 20,
  },

  input: {
    padding: 14,
    borderWidth: 1,
    borderColor: '#c6d2e1',
    borderRadius: 8,
    backgroundColor: '#ffffff',
    color: '#17324d',
    marginBottom: 20,
  },

  list: {
    paddingBottom: 20,
  },

  emptyList: {
    flexGrow: 1,
  },

  state: {
    flex: 1,
    padding: 24,
    gap: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },

  text: {
    color: '#536579',
    textAlign: 'center',
  },

  error: {
    color: '#b42318',
    textAlign: 'center',
    fontSize: 15,
  },

  retryButton: {
    backgroundColor: '#245bb2',
    paddingVertical: 12,
    paddingHorizontal: 22,
    borderRadius: 8,
  },

  retryText: {
    color: '#ffffff',
    fontWeight: '600',
  },
});