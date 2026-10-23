const REFRESH_TOKEN_KEY = 'spotify.refreshToken';

export async function getRefreshToken(): Promise<string | null> {
  return globalThis.sessionStorage?.getItem(REFRESH_TOKEN_KEY) ?? null;
}

export async function setRefreshToken(refreshToken: string): Promise<void> {
  globalThis.sessionStorage?.setItem(REFRESH_TOKEN_KEY, refreshToken);
}

export async function clearRefreshToken(): Promise<void> {
  globalThis.sessionStorage?.removeItem(REFRESH_TOKEN_KEY);
}
