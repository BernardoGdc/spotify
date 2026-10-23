import { SPOTIFY_AUTH_DISCOVERY } from './config';
import { SpotifyAuthenticationError } from './errors';

interface SpotifyTokenResponse {
  access_token?: unknown;
  error?: unknown;
  expires_in?: unknown;
  refresh_token?: unknown;
}

export interface SpotifyTokenSet {
  accessToken: string;
  expiresAt: number;
  refreshToken: string;
}

interface ExchangeAuthorizationCodeOptions {
  clientId: string;
  code: string;
  codeVerifier: string;
  fetchImplementation?: typeof fetch;
  redirectUri: string;
}

interface RefreshAccessTokenOptions {
  clientId: string;
  fetchImplementation?: typeof fetch;
  refreshToken: string;
}

async function requestToken(
  body: URLSearchParams,
  fetchImplementation: typeof fetch,
): Promise<SpotifyTokenResponse> {
  let response: Response;

  try {
    response = await fetchImplementation(SPOTIFY_AUTH_DISCOVERY.tokenEndpoint, {
      body: body.toString(),
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      method: 'POST',
    });
  } catch {
    throw new SpotifyAuthenticationError(
      'Spotify sign-in could not reach the token service. Try again.',
      false,
    );
  }

  if (!response.ok) {
    let errorCode: unknown;

    try {
      const body = (await response.json()) as SpotifyTokenResponse;
      errorCode = body.error;
    } catch {
      errorCode = null;
    }

    const retryAfterHeader = response.headers.get('Retry-After');
    const retryAfterSeconds =
      retryAfterHeader === null ? Number.NaN : Number(retryAfterHeader);
    const isTransient = response.status === 429 || response.status >= 500;

    throw new SpotifyAuthenticationError(
      isTransient
        ? 'Spotify could not refresh the session. Try again shortly.'
        : 'Your Spotify session has expired. Please sign in again.',
      errorCode === 'invalid_grant' || !isTransient,
      Number.isFinite(retryAfterSeconds) && retryAfterSeconds >= 0
        ? retryAfterSeconds
        : null,
    );
  }

  try {
    return (await response.json()) as SpotifyTokenResponse;
  } catch {
    throw new SpotifyAuthenticationError(
      'Spotify returned an invalid token response. Please sign in again.',
    );
  }
}

function parseTokenResponse(
  response: SpotifyTokenResponse,
  previousRefreshToken?: string,
): SpotifyTokenSet {
  const accessToken = response.access_token;
  const expiresIn = response.expires_in;
  const refreshToken = response.refresh_token ?? previousRefreshToken;

  if (
    typeof accessToken !== 'string' ||
    typeof expiresIn !== 'number' ||
    !Number.isFinite(expiresIn) ||
    typeof refreshToken !== 'string'
  ) {
    throw new SpotifyAuthenticationError(
      'Spotify returned an incomplete token response. Please sign in again.',
    );
  }

  return {
    accessToken,
    expiresAt: Date.now() + expiresIn * 1000,
    refreshToken,
  };
}

export async function exchangeAuthorizationCode({
  clientId,
  code,
  codeVerifier,
  fetchImplementation = fetch,
  redirectUri,
}: ExchangeAuthorizationCodeOptions): Promise<SpotifyTokenSet> {
  const response = await requestToken(
    new URLSearchParams({
      client_id: clientId,
      code,
      code_verifier: codeVerifier,
      grant_type: 'authorization_code',
      redirect_uri: redirectUri,
    }),
    fetchImplementation,
  );

  return parseTokenResponse(response);
}

export async function refreshAccessToken({
  clientId,
  fetchImplementation = fetch,
  refreshToken,
}: RefreshAccessTokenOptions): Promise<SpotifyTokenSet> {
  const response = await requestToken(
    new URLSearchParams({
      client_id: clientId,
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    }),
    fetchImplementation,
  );

  return parseTokenResponse(response, refreshToken);
}
