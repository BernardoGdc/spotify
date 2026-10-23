import {
  ResponseType,
  useAuthRequest,
  type AuthSessionResult,
} from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PropsWithChildren,
} from 'react';

import {
  exchangeAuthorizationCode,
  getSpotifyConfiguration,
  refreshAccessToken,
  SPOTIFY_AUTH_DISCOVERY,
  SPOTIFY_SCOPES,
  SpotifyAuthenticationError,
  SpotifyConfigurationError,
  type SpotifyTokenSet,
} from '../../integrations/spotify';
import {
  clearRefreshToken,
  getRefreshToken,
  setRefreshToken,
} from '../../platform';

WebBrowser.maybeCompleteAuthSession();

export type AuthStatus =
  | 'restoring'
  | 'signedOut'
  | 'signingIn'
  | 'signedIn';

interface AuthContextValue {
  error: string | null;
  getAccessToken: (forceRefresh?: boolean) => Promise<string>;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
  status: AuthStatus;
}

const AuthContext = createContext<AuthContextValue | null>(null);
const TOKEN_EXPIRY_BUFFER_MS = 60_000;

function readConfiguration() {
  try {
    return {
      configuration: getSpotifyConfiguration(),
      error: null,
    };
  } catch (error) {
    return {
      configuration: null,
      error:
        error instanceof SpotifyConfigurationError
          ? error.message
          : 'Spotify authentication is not configured.',
    };
  }
}

function getAuthenticationErrorMessage(error: unknown): string {
  return error instanceof Error
    ? error.message
    : 'Spotify sign-in failed. Please try again.';
}

export function AuthProvider({ children }: PropsWithChildren) {
  const [{ configuration, error: configurationError }] = useState(
    readConfiguration,
  );
  const [status, setStatus] = useState<AuthStatus>('restoring');
  const [error, setError] = useState<string | null>(configurationError);
  const tokenSetRef = useRef<SpotifyTokenSet | null>(null);
  const refreshPromiseRef = useRef<Promise<SpotifyTokenSet> | null>(null);
  const processedAuthorizationCodeRef = useRef<string | null>(null);
  const sessionGenerationRef = useRef(0);
  const storageMutationRef = useRef<Promise<void>>(Promise.resolve());
  const refreshBlockedUntilRef = useRef(0);

  const [request, response, promptAsync] = useAuthRequest(
    {
      clientId: configuration?.clientId ?? 'spotify-client-id-not-configured',
      redirectUri:
        configuration?.redirectUri ?? 'spotify-queue-login://callback',
      responseType: ResponseType.Code,
      scopes: SPOTIFY_SCOPES,
      usePKCE: true,
    },
    SPOTIFY_AUTH_DISCOVERY,
  );

  const enqueueStorageMutation = useCallback(
    async (mutation: () => Promise<void>): Promise<void> => {
      const operation = storageMutationRef.current
        .catch(() => undefined)
        .then(mutation);
      storageMutationRef.current = operation.catch(() => undefined);
      await operation;
    },
    [],
  );

  const persistTokenSet = useCallback(
    async (
      tokenSet: SpotifyTokenSet,
      expectedGeneration = sessionGenerationRef.current,
    ): Promise<boolean> => {
      if (expectedGeneration !== sessionGenerationRef.current) {
        return false;
      }

      tokenSetRef.current = tokenSet;
      await enqueueStorageMutation(() =>
        setRefreshToken(tokenSet.refreshToken),
      );

      if (expectedGeneration !== sessionGenerationRef.current) {
        return false;
      }

      setStatus('signedIn');
      setError(null);
      return true;
    },
    [enqueueStorageMutation],
  );

  const clearSession = useCallback(async () => {
    sessionGenerationRef.current += 1;
    tokenSetRef.current = null;
    refreshPromiseRef.current = null;
    await enqueueStorageMutation(clearRefreshToken);
    setStatus('signedOut');
  }, [enqueueStorageMutation]);

  const refreshSession = useCallback(async (): Promise<SpotifyTokenSet> => {
    if (!configuration) {
      throw new SpotifyConfigurationError(
        configurationError ?? 'Spotify authentication is not configured.',
      );
    }

    if (refreshPromiseRef.current) {
      return refreshPromiseRef.current;
    }

    const retryAfterSeconds = Math.ceil(
      (refreshBlockedUntilRef.current - Date.now()) / 1000,
    );

    if (retryAfterSeconds > 0) {
      throw new SpotifyAuthenticationError(
        `Spotify is rate limiting session refresh. Retry in ${retryAfterSeconds} seconds.`,
        false,
        retryAfterSeconds,
      );
    }

    const generation = sessionGenerationRef.current;
    const refreshPromise = (async () => {
      const storedRefreshToken =
        tokenSetRef.current?.refreshToken ?? (await getRefreshToken());

      if (!storedRefreshToken) {
        throw new SpotifyAuthenticationError(
          'No Spotify session is available. Please sign in.',
        );
      }

      const tokenSet = await refreshAccessToken({
        clientId: configuration.clientId,
        refreshToken: storedRefreshToken,
      });

      if (!(await persistTokenSet(tokenSet, generation))) {
        throw new SpotifyAuthenticationError(
          'The Spotify session ended while it was refreshing.',
          false,
        );
      }

      refreshBlockedUntilRef.current = 0;
      return tokenSet;
    })();

    refreshPromiseRef.current = refreshPromise;

    try {
      return await refreshPromise;
    } catch (refreshError) {
      if (
        refreshError instanceof SpotifyAuthenticationError &&
        refreshError.retryAfterSeconds !== null
      ) {
        refreshBlockedUntilRef.current =
          Date.now() + refreshError.retryAfterSeconds * 1000;
      }

      if (
        generation === sessionGenerationRef.current &&
        refreshError instanceof SpotifyAuthenticationError &&
        refreshError.shouldClearSession
      ) {
        await clearSession();
      }
      throw refreshError;
    } finally {
      if (refreshPromiseRef.current === refreshPromise) {
        refreshPromiseRef.current = null;
      }
    }
  }, [
    clearSession,
    configuration,
    configurationError,
    persistTokenSet,
  ]);

  const getAccessToken = useCallback(
    async (forceRefresh = false): Promise<string> => {
      const tokenSet = tokenSetRef.current;

      if (
        !forceRefresh &&
        tokenSet &&
        tokenSet.expiresAt > Date.now() + TOKEN_EXPIRY_BUFFER_MS
      ) {
        return tokenSet.accessToken;
      }

      return (await refreshSession()).accessToken;
    },
    [refreshSession],
  );

  const signOut = useCallback(async () => {
    await clearSession();
    setError(null);
  }, [clearSession]);

  const signIn = useCallback(async () => {
    if (!configuration) {
      setError(
        configurationError ?? 'Spotify authentication is not configured.',
      );
      setStatus('signedOut');
      return;
    }

    if (!request) {
      setError('Spotify sign-in is still initializing. Try again in a moment.');
      return;
    }

    setError(null);
    setStatus('signingIn');

    try {
      await promptAsync();
    } catch (promptError) {
      setError(getAuthenticationErrorMessage(promptError));
      setStatus('signedOut');
    }
  }, [configuration, configurationError, promptAsync, request]);

  useEffect(() => {
    let isMounted = true;

    async function restoreSession() {
      if (!configuration) {
        if (isMounted) {
          setStatus('signedOut');
        }
        return;
      }

      const generation = sessionGenerationRef.current;

      try {
        const storedRefreshToken = await getRefreshToken();

        if (!storedRefreshToken) {
          if (isMounted) {
            setStatus('signedOut');
          }
          return;
        }

        const tokenSet = await refreshAccessToken({
          clientId: configuration.clientId,
          refreshToken: storedRefreshToken,
        });

        if (isMounted) {
          await persistTokenSet(tokenSet, generation);
        }
      } catch (restoreError) {
        if (
          restoreError instanceof SpotifyAuthenticationError &&
          restoreError.retryAfterSeconds !== null
        ) {
          refreshBlockedUntilRef.current =
            Date.now() + restoreError.retryAfterSeconds * 1000;
        }

        if (
          isMounted &&
          generation === sessionGenerationRef.current &&
          restoreError instanceof SpotifyAuthenticationError &&
          restoreError.shouldClearSession
        ) {
          await clearSession();
        } else if (
          isMounted &&
          generation === sessionGenerationRef.current
        ) {
          setError(getAuthenticationErrorMessage(restoreError));
          setStatus('signedOut');
        }
      }
    }

    void restoreSession();

    return () => {
      isMounted = false;
    };
  }, [clearSession, configuration, persistTokenSet]);

  useEffect(() => {
    async function finishAuthorization(result: AuthSessionResult) {
      if (
        result.type === 'cancel' ||
        result.type === 'dismiss' ||
        result.type === 'locked'
      ) {
        setStatus('signedOut');
        return;
      }

      if (result.type !== 'success') {
        setError('Spotify sign-in was not completed.');
        setStatus('signedOut');
        return;
      }

      const code = result.params.code;

      if (
        !configuration ||
        !request?.codeVerifier ||
        typeof code !== 'string'
      ) {
        setError('Spotify returned an invalid authorization response.');
        setStatus('signedOut');
        return;
      }

      if (result.params.state !== request.state) {
        setError('Spotify sign-in state validation failed. Please try again.');
        setStatus('signedOut');
        return;
      }

      if (processedAuthorizationCodeRef.current === code) {
        return;
      }
      processedAuthorizationCodeRef.current = code;

      const generation = sessionGenerationRef.current;

      try {
        const tokenSet = await exchangeAuthorizationCode({
          clientId: configuration.clientId,
          code,
          codeVerifier: request.codeVerifier,
          redirectUri: configuration.redirectUri,
        });
        refreshBlockedUntilRef.current = 0;
        await persistTokenSet(tokenSet, generation);
      } catch (exchangeError) {
        if (generation === sessionGenerationRef.current) {
          setError(getAuthenticationErrorMessage(exchangeError));
          setStatus('signedOut');
        }
      }
    }

    if (response) {
      void finishAuthorization(response);
    }
  }, [configuration, persistTokenSet, request, response]);

  const value = useMemo<AuthContextValue>(
    () => ({
      error,
      getAccessToken,
      signIn,
      signOut,
      status,
    }),
    [error, getAccessToken, signIn, signOut, status],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider.');
  }

  return context;
}
