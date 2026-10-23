export type PlaybackItemType = 'track' | 'episode' | 'unknown';

export interface PlaybackItem {
  imageUrl: string | null;
  subtitle: string;
  title: string;
  type: PlaybackItemType;
}

export interface PlaybackDevice {
  name: string;
  type: string;
}

export interface CurrentPlayback {
  device: PlaybackDevice;
  isPlaying: boolean;
  item: PlaybackItem | null;
}
