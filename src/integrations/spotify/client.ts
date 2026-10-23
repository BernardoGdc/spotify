import type { CurrentPlayback } from '../../domain/playback';
import { SPOTIFY_API_BASE_URL } from './config';
import { SpotifyApiError, SpotifyAuthenticationError } from './errors';
import { mapCurrentPlayback } from './playback';

export type FetchImplementation = typeof fetch;

function readRetryAfter(response: Response): number | null {
  const header = response.headers.get('Retry-After');
  const seconds = header === null ? Number.NaN : Number(header);

  return Number.isFinite(seconds) && seconds >= 0 ? seconds : null;
}

async function throwForSpotifyError(response: Response): Promise<never> {
  if (response.status === 401) {
    throw new SpotifyAuthenticationError();
  }

  if (response.status === 403) {
    throw new SpotifyApiError(
      'Spotify denied playback access. Confirm the account is allowlisted and the playback scope was granted.',
      403,
    );
  }

  if (response.status === 429) {
    throw new SpotifyApiError(
      'Spotify is rate limiting playback requests. Try again later.',
      429,
      readRetryAfter(response),
    );
  }

  throw new SpotifyApiError(
    'Spotify could not load the current playback state.',
    response.status,
  );
}

export async function getCurrentPlayback(
  accessToken: string,
  fetchImplementation: FetchImplementation = fetch,
): Promise<CurrentPlayback | null> {
  let response: Response;

  try {
    response = await fetchImplementation(`${SPOTIFY_API_BASE_URL}/me/player`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      method: 'GET',
    });
  } catch {
    throw new SpotifyApiError(
      'Could not reach Spotify. Check your connection and try again.',
      0,
    );
  }

  if (response.status === 204) {
    return null;
  }

  if (!response.ok) {
    return throwForSpotifyError(response);
  }

  let body: unknown;

  try {
    body = await response.json();
  } catch {
    throw new SpotifyApiError(
      'Spotify returned an invalid playback response.',
      502,
    );
  }

  return mapCurrentPlayback(body);
}
