import AsyncStorage from '@react-native-async-storage/async-storage';

export async function salvarCache(key, value) {
  await AsyncStorage.setItem(key, JSON.stringify(value));
}

export async function carregarCache(key) {
  const value = await AsyncStorage.getItem(key);
  if (!value) return null;

  try {
    return JSON.parse(value);
  } catch {
    await AsyncStorage.removeItem(key);
    return null;
  }
}
