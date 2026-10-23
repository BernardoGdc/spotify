import * as SecureStore from 'expo-secure-store';

const REFRESH_TOKEN_KEY = 'spotify.refreshToken';

export function getRefreshToken(): Promise<string | null> {
  return SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
}

export function setRefreshToken(refreshToken: string): Promise<void> {
  return SecureStore.setItemAsync(REFRESH_TOKEN_KEY, refreshToken);
}

export function clearRefreshToken(): Promise<void> {
  return SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
}
