export function getRefreshToken(): Promise<string | null>;
export function setRefreshToken(refreshToken: string): Promise<void>;
export function clearRefreshToken(): Promise<void>;
