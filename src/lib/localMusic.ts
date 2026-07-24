export type LocalMusicTrack = {
  id: number;
  name: string;
  artists: string[];
  album: string;
  cover: string;
  duration: number;
  url: string;
};

// Keep the metadata ASCII-safe so Windows encoding cannot corrupt it.
export const LOCAL_MUSIC: LocalMusicTrack[] = [
  {
    id: 1,
    name: '\u5fc3\u5899',
    artists: ['\u6797\u4fca\u6770'],
    album: '\u672c\u5730\u97f3\u4e50',
    cover: '/images/music/xinqiang-cover.png',
    duration: 0,
    url: '/music/%E5%BF%83%E5%A2%99.mp3',
  },
];
