export class SpotifyConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SpotifyConfigurationError';
  }
}

export class SpotifyAuthenticationError extends Error {
  constructor(
    message = 'Your Spotify session has expired. Please sign in again.',
    readonly shouldClearSession = true,
    readonly retryAfterSeconds: number | null = null,
  ) {
    super(message);
    this.name = 'SpotifyAuthenticationError';
  }
}

export class SpotifyApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly retryAfterSeconds: number | null = null,
  ) {
    super(message);
    this.name = 'SpotifyApiError';
  }
}
