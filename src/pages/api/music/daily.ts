import type { APIRoute } from 'astro';
import fs from 'node:fs';
import path from 'node:path';

type NeteaseSong = {
  id?: number;
  name?: string;
  dt?: number;
  al?: { name?: string; picUrl?: string };
  ar?: Array<{ name?: string }>;
};

const RECOMMEND_URL = 'https://music.163.com/api/v1/discovery/recommend/songs';
const PLAYLIST_URL = (id: string) => `https://music.163.com/api/playlist/detail?id=${encodeURIComponent(id)}&n=1000&s=8`;
const SONG_URL = (id: number) => `https://music.163.com/song/media/outer/url?id=${id}.mp3`;
const DEFAULT_PLAYLIST_ID = '18182184443';

export const prerender = false;

function readLocalEnv(name: string) {
  for (const filename of ['.env.local', '.env']) {
    try {
      const file = fs.readFileSync(path.join(process.cwd(), filename), 'utf8');
      const line = file.split(/\r?\n/).find((item) => item.startsWith(`${name}=`));
      if (line) return line.slice(name.length + 1).trim().replace(/^(['"])(.*)\1$/, '$2');
    } catch {
      // Local env files are optional in deployed serverless functions.
    }
  }
  return '';
}

export const GET: APIRoute = async () => {
  const cookie = import.meta.env.NETEASE_COOKIE || process.env.NETEASE_COOKIE || readLocalEnv('NETEASE_COOKIE');
  const playlistId = import.meta.env.NETEASE_PLAYLIST_ID
    || process.env.NETEASE_PLAYLIST_ID
    || readLocalEnv('NETEASE_PLAYLIST_ID')
    || DEFAULT_PLAYLIST_ID;

  if (!playlistId && !cookie) {
    return Response.json({ tracks: [], error: 'Configure NETEASE_PLAYLIST_ID or NETEASE_COOKIE.' }, { status: 503 });
  }

  try {
    const endpoint = playlistId ? PLAYLIST_URL(playlistId) : RECOMMEND_URL;
    const response = await fetch(endpoint, {
      headers: {
        Accept: 'application/json',
        ...(cookie ? { Cookie: cookie } : {}),
        Referer: 'https://music.163.com/',
        'User-Agent': 'Mozilla/5.0',
      },
    });

    if (!response.ok) {
      return Response.json({ tracks: [], error: 'Netease music request failed.' }, { status: 502 });
    }

    const payload = await response.json() as {
      recommend?: NeteaseSong[];
      playlist?: { tracks?: NeteaseSong[] };
    };
    const songs = playlistId ? payload.playlist?.tracks : payload.recommend;
    const tracks = (songs || [])
      .filter((song): song is NeteaseSong & { id: number; name: string } => Boolean(song.id && song.name))
      .map((song) => ({
        id: song.id,
        name: song.name,
        artists: (song.ar || []).map((artist) => artist.name).filter(Boolean),
        album: song.al?.name || '',
        cover: song.al?.picUrl || '',
        duration: song.dt || 0,
        url: SONG_URL(song.id),
      }));

    if (!tracks.length) {
      return Response.json({
        tracks: [],
        error: playlistId
          ? 'The playlist is empty, private, or unavailable.'
          : 'Daily recommendations are unavailable.',
      }, { status: 502 });
    }

    return Response.json({ tracks, source: playlistId ? 'playlist' : 'daily' }, {
      headers: { 'Cache-Control': 'private, max-age=300' },
    });
  } catch {
    return Response.json({ tracks: [], error: 'Unable to load Netease music.' }, { status: 502 });
  }
};
