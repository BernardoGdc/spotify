/**
 * Spotify OAuth, Web API clients, DTO mapping, and Spotify errors live here.
 */
export { getCurrentPlayback } from './client';
export {
  getSpotifyConfiguration,
  SPOTIFY_AUTH_DISCOVERY,
  SPOTIFY_SCOPES,
} from './config';
export {
  SpotifyApiError,
  SpotifyAuthenticationError,
  SpotifyConfigurationError,
} from './errors';
export { mapCurrentPlayback } from './playback';
export {
  exchangeAuthorizationCode,
  refreshAccessToken,
} from './tokens';
export type { SpotifyTokenSet } from './tokens';
