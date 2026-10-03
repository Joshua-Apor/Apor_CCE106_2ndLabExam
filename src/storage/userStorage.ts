import AsyncStorage from "@react-native-async-storage/async-storage";

const USER_KEY = "current_user";

export type AuthUser = {
  id: number;
  name: string;
  email: string;
  role: string;
};

export async function saveUser(user: AuthUser) {
  await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
}

export async function getUser(): Promise<AuthUser | null> {
  const storedUser = await AsyncStorage.getItem(USER_KEY);

  if (!storedUser) {
    return null;
  }

  return JSON.parse(storedUser);
}

export async function deleteUser() {
  await AsyncStorage.removeItem(USER_KEY);
}