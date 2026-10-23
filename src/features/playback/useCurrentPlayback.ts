import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, type AppStateStatus } from 'react-native';

import type { CurrentPlayback } from '../../domain/playback';
import {
  getCurrentPlayback,
  SpotifyApiError,
  SpotifyAuthenticationError,
} from '../../integrations/spotify';
import { useAuth } from '../auth/AuthProvider';

interface CurrentPlaybackState {
  error: string | null;
  isLoading: boolean;
  playback: CurrentPlayback | null;
  refresh: () => Promise<void>;
}

function getPlaybackErrorMessage(error: unknown): string {
  if (error instanceof SpotifyApiError && error.status === 429) {
    return error.retryAfterSeconds === null
      ? error.message
      : `${error.message} Retry in ${error.retryAfterSeconds} seconds.`;
  }

  return error instanceof Error
    ? error.message
    : 'Could not load the current playback state.';
}

export function useCurrentPlayback(): CurrentPlaybackState {
  const { getAccessToken, signOut, status } = useAuth();
  const [playback, setPlayback] = useState<CurrentPlayback | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const requestIdRef = useRef(0);
  const rateLimitUntilRef = useRef(0);
  const appStateRef = useRef<AppStateStatus | null | undefined>(
    AppState.currentState as AppStateStatus | null | undefined,
  );

  const refresh = useCallback(async () => {
    if (status !== 'signedIn') {
      return;
    }

    const rateLimitRemaining = Math.ceil(
      (rateLimitUntilRef.current - Date.now()) / 1000,
    );

    if (rateLimitRemaining > 0) {
      setError(
        `Spotify is rate limiting playback requests. Retry in ${rateLimitRemaining} seconds.`,
      );
      return;
    }

    const requestId = ++requestIdRef.current;
    setIsLoading(true);
    setError(null);

    try {
      let accessToken = await getAccessToken();
      let nextPlayback: CurrentPlayback | null;

      try {
        nextPlayback = await getCurrentPlayback(accessToken);
      } catch (playbackError) {
        if (!(playbackError instanceof SpotifyAuthenticationError)) {
          throw playbackError;
        }

        accessToken = await getAccessToken(true);

        try {
          nextPlayback = await getCurrentPlayback(accessToken);
        } catch (retryError) {
          if (retryError instanceof SpotifyAuthenticationError) {
            await signOut();
          }
          throw retryError;
        }
      }

      if (requestId === requestIdRef.current) {
        rateLimitUntilRef.current = 0;
        setPlayback(nextPlayback);
      }
    } catch (refreshError) {
      if (requestId === requestIdRef.current) {
        if (
          refreshError instanceof SpotifyApiError &&
          refreshError.status === 429 &&
          refreshError.retryAfterSeconds !== null
        ) {
          rateLimitUntilRef.current =
            Date.now() + refreshError.retryAfterSeconds * 1000;
        }
        setError(getPlaybackErrorMessage(refreshError));
      }
    } finally {
      if (requestId === requestIdRef.current) {
        setIsLoading(false);
      }
    }
  }, [getAccessToken, signOut, status]);

  useEffect(() => {
    if (status !== 'signedIn') {
      requestIdRef.current += 1;
      return;
    }

    const timeout = setTimeout(() => void refresh(), 0);
    return () => clearTimeout(timeout);
  }, [refresh, status]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState) => {
      const wasInactive = appStateRef.current !== 'active';
      appStateRef.current = nextState;

      if (wasInactive && nextState === 'active' && status === 'signedIn') {
        void refresh();
      }
    });

    return () => subscription.remove();
  }, [refresh, status]);

  return {
    error,
    isLoading,
    playback,
    refresh,
  };
}
