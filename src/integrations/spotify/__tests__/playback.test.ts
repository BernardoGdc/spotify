import { getCurrentPlayback, type FetchImplementation } from '../client';
import { SpotifyApiError } from '../errors';
import { mapCurrentPlayback } from '../playback';

function createResponse({
  body,
  headers = {},
  status = 200,
}: {
  body?: unknown;
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

function createFetch(response: Response): FetchImplementation {
  return jest.fn().mockResolvedValue(response) as unknown as FetchImplementation;
}

describe('mapCurrentPlayback', () => {
  it('maps a playing track and active device', () => {
    expect(
      mapCurrentPlayback({
        device: {
          name: 'Kitchen speaker',
          type: 'speaker',
        },
        is_playing: true,
        item: {
          album: {
            images: [{ url: 'https://example.com/cover.jpg' }],
          },
          artists: [{ name: 'Artist One' }, { name: 'Artist Two' }],
          name: 'Example Track',
          type: 'track',
        },
      }),
    ).toEqual({
      device: {
        name: 'Kitchen speaker',
        type: 'speaker',
      },
      isPlaying: true,
      item: {
        imageUrl: 'https://example.com/cover.jpg',
        subtitle: 'Artist One, Artist Two',
        title: 'Example Track',
        type: 'track',
      },
    });
  });

  it('returns null when Spotify has no active device', () => {
    expect(
      mapCurrentPlayback({
        device: null,
        is_playing: false,
        item: null,
      }),
    ).toBeNull();
  });

  it('rejects a malformed device response', () => {
    expect(() =>
      mapCurrentPlayback({
        device: {},
      }),
    ).toThrow(SpotifyApiError);
  });
});

describe('getCurrentPlayback', () => {
  it('maps a 204 response to no active device', async () => {
    await expect(
      getCurrentPlayback(
        'access-token',
        createFetch(createResponse({ status: 204 })),
      ),
    ).resolves.toBeNull();
  });

  it('preserves Spotify Retry-After information for rate limits', async () => {
    const promise = getCurrentPlayback(
      'access-token',
      createFetch(
        createResponse({
          headers: { 'Retry-After': '17' },
          status: 429,
        }),
      ),
    );

    await expect(promise).rejects.toMatchObject({
      retryAfterSeconds: 17,
      status: 429,
    });
  });
});
