/// <reference types="astro/client" />
/// <reference types="node" />
type MusicTrack = {
  id: number;
  name: string;
  artists: string[];
  album: string;
  cover: string;
  duration: number;
  url: string;
};

type MusicState = {
  tracks: MusicTrack[];
  currentIndex: number;
  currentTrack: MusicTrack | null;
  status: 'idle' | 'loading' | 'ready' | 'playing' | 'paused' | 'blocked' | 'error';
  error: string | null;
};

type MusicController = {
  getState: () => MusicState;
  play: () => Promise<void>;
  pause: () => void;
  toggle: () => Promise<void>;
  next: () => Promise<void>;
  previous: () => Promise<void>;
  subscribe: (listener: (state: MusicState) => void) => () => void;
};

interface Window {
  __musicPlayer?: MusicController;
  __musicHeaderBound?: boolean;
  onSpotifyIframeApiReady?: (api: unknown) => void;
}
