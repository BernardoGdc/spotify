import { SpotifyAuthenticationError } from '../errors';
import { refreshAccessToken } from '../tokens';

function createTokenResponse({
  body,
  headers = {},
  status = 200,
}: {
  body: unknown;
  headers?: Record<string, string>;
  status?: number;
}): Response {
  return {
    headers: {
      get: (name: string) => headers[name] ?? null,
    },
    json: jest.fn().mockResolvedValue(body),
    ok: status >= 200 && status < 300,
    status,
  } as unknown as Response;
}

describe('refreshAccessToken', () => {
  it('keeps the existing refresh token when Spotify does not rotate it', async () => {
    const fetchImplementation = jest
      .fn()
      .mockResolvedValue(
        createTokenResponse({
          body: {
            access_token: 'new-access-token',
            expires_in: 3600,
          },
        }),
      ) as unknown as typeof fetch;

    await expect(
      refreshAccessToken({
        clientId: 'client-id',
        fetchImplementation,
        refreshToken: 'existing-refresh-token',
      }),
    ).resolves.toMatchObject({
      accessToken: 'new-access-token',
      refreshToken: 'existing-refresh-token',
    });
  });

  it('classifies invalid_grant as a definitive session failure', async () => {
    const fetchImplementation = jest
      .fn()
      .mockResolvedValue(
        createTokenResponse({
          body: { error: 'invalid_grant' },
          status: 400,
        }),
      ) as unknown as typeof fetch;

    const promise = refreshAccessToken({
      clientId: 'client-id',
      fetchImplementation,
      refreshToken: 'expired-refresh-token',
    });

    await expect(promise).rejects.toMatchObject({
      shouldClearSession: true,
    });
  });

  it('preserves the session on transient token-service failures', async () => {
    const fetchImplementation = jest
      .fn()
      .mockResolvedValue(
        createTokenResponse({
          body: { error: 'temporarily_unavailable' },
          headers: { 'Retry-After': '12' },
          status: 429,
        }),
      ) as unknown as typeof fetch;

    try {
      await refreshAccessToken({
        clientId: 'client-id',
        fetchImplementation,
        refreshToken: 'valid-refresh-token',
      });
      throw new Error('Expected refreshAccessToken to reject.');
    } catch (error) {
      expect(error).toBeInstanceOf(SpotifyAuthenticationError);
      expect(error).toMatchObject({
        retryAfterSeconds: 12,
        shouldClearSession: false,
      });
    }
  });
});
