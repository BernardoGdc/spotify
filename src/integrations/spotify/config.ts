import { makeRedirectUri } from 'expo-auth-session';
import { Platform } from 'react-native';

import { SpotifyConfigurationError } from './errors';

export const SPOTIFY_AUTH_DISCOVERY = {
  authorizationEndpoint: 'https://accounts.spotify.com/authorize',
  tokenEndpoint: 'https://accounts.spotify.com/api/token',
};

export const SPOTIFY_API_BASE_URL = 'https://api.spotify.com/v1';
export const SPOTIFY_SCOPES = ['user-read-playback-state'];

export interface SpotifyConfiguration {
  clientId: string;
  redirectUri: string;
}

export function getSpotifyConfiguration(): SpotifyConfiguration {
  const clientId = process.env.EXPO_PUBLIC_SPOTIFY_CLIENT_ID?.trim();
  const webRedirectUri =
    process.env.EXPO_PUBLIC_SPOTIFY_WEB_REDIRECT_URI?.trim();

  if (!clientId) {
    throw new SpotifyConfigurationError(
      'Set EXPO_PUBLIC_SPOTIFY_CLIENT_ID in the local .env file.',
    );
  }

  if (Platform.OS === 'web' && !webRedirectUri) {
    throw new SpotifyConfigurationError(
      'Set EXPO_PUBLIC_SPOTIFY_WEB_REDIRECT_URI in the local .env file.',
    );
  }

  return {
    clientId,
    redirectUri:
      Platform.OS === 'web'
        ? webRedirectUri!
        : makeRedirectUri({
            path: 'callback',
            scheme: 'spotify-queue-login',
          }),
  };
}
