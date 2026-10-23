import type {
  CurrentPlayback,
  PlaybackItem,
} from '../../domain/playback';
import { SpotifyApiError } from './errors';

type JsonObject = Record<string, unknown>;

function isObject(value: unknown): value is JsonObject {
  return typeof value === 'object' && value !== null;
}

function readImageUrl(value: unknown): string | null {
  if (!Array.isArray(value)) {
    return null;
  }

  const image = value.find(
    (candidate) => isObject(candidate) && typeof candidate.url === 'string',
  );

  return isObject(image) && typeof image.url === 'string' ? image.url : null;
}

function readArtistNames(value: unknown): string {
  if (!Array.isArray(value)) {
    return 'Unknown artist';
  }

  const names = value
    .map((artist) =>
      isObject(artist) && typeof artist.name === 'string' ? artist.name : null,
    )
    .filter((name): name is string => name !== null);

  return names.length > 0 ? names.join(', ') : 'Unknown artist';
}

function mapItem(value: unknown): PlaybackItem | null {
  if (!isObject(value) || typeof value.name !== 'string') {
    return null;
  }

  if (value.type === 'track') {
    const album = isObject(value.album) ? value.album : null;

    return {
      imageUrl: readImageUrl(album?.images),
      subtitle: readArtistNames(value.artists),
      title: value.name,
      type: 'track',
    };
  }

  if (value.type === 'episode') {
    const show = isObject(value.show) ? value.show : null;

    return {
      imageUrl: readImageUrl(value.images),
      subtitle:
        show && typeof show.name === 'string' ? show.name : 'Unknown show',
      title: value.name,
      type: 'episode',
    };
  }

  return {
    imageUrl: null,
    subtitle: 'Spotify',
    title: value.name,
    type: 'unknown',
  };
}

export function mapCurrentPlayback(value: unknown): CurrentPlayback | null {
  if (!isObject(value)) {
    throw new SpotifyApiError(
      'Spotify returned an invalid playback response.',
      502,
    );
  }

  if (value.device == null) {
    return null;
  }

  if (!isObject(value.device) || typeof value.device.name !== 'string') {
    throw new SpotifyApiError(
      'Spotify returned an invalid playback device.',
      502,
    );
  }

  return {
    device: {
      name: value.device.name,
      type:
        typeof value.device.type === 'string' ? value.device.type : 'unknown',
    },
    isPlaying: value.is_playing === true,
    item: mapItem(value.item),
  };
}
