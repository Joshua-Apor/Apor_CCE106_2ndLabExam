import { AuthProvider } from '@/context/AuthContext';
import { useAuth } from '@/hooks/useAuth';
import { Redirect, Stack, useSegments } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';

function AppGate() {
  const { token, authLoading } = useAuth();
  const segments = useSegments();
  const protectedRoute = segments[0] === '(app)' || segments[0] === 'student';

  if (authLoading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f2f5fa' }}>
        <ActivityIndicator color="#245bb2" size="large" />
      </View>
    );
  }

  if (!token && protectedRoute) {
    return <Redirect href="/sign-in" />;
  }

  return (
    <Stack screenOptions={{ headerTintColor: '#17324d' }}>
      <Stack.Screen name="sign-in" options={{ title: 'Sign In' }} />
      <Stack.Screen name="(app)" options={{ headerShown: false }} />
      <Stack.Screen name="student/[id]" options={{ title: 'Student Details' }} />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <AppGate />
    </AuthProvider>
  );
}
