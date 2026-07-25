import fs from 'node:fs';
import path from 'node:path';
import { dump, load } from 'js-yaml';

const root = process.cwd();
const musicDir = path.join(root, 'src', 'content', 'music');
const outputFile = path.join(root, 'src', 'lib', 'localMusic.ts');

const toPublicUrl = (value) => {
  if (typeof value !== 'string' || !value.trim()) return '';
  let decoded = value.trim();
  try {
    decoded = decodeURIComponent(decoded);
  } catch {
    // Keep the original value when it contains malformed percent escapes.
  }

  return decoded
    .split('/')
    .map((segment, index) => (index === 0 ? '' : encodeURIComponent(segment)))
    .join('/');
};

const publicUrlToFile = (value) => {
  if (!value.startsWith('/')) return '';
  let decoded = value;
  try {
    decoded = decodeURIComponent(value);
  } catch {
    return '';
  }
  return path.join(root, 'public', decoded.slice(1));
};

const stableId = (slug) => {
  let hash = 2166136261;
  for (const char of slug) {
    hash ^= char.codePointAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return Math.abs(hash >>> 0) || 1;
};

const syncSafeToInt = (buffer, offset) => (
  (buffer[offset] << 21)
  | (buffer[offset + 1] << 14)
  | (buffer[offset + 2] << 7)
  | buffer[offset + 3]
);

const decodeText = (buffer, encoding = 3) => {
  if (!buffer.length) return '';
  if (encoding === 0) return buffer.toString('latin1').replace(/\0/g, '').trim();
  if (encoding === 1) {
    if (buffer[0] === 0xfe && buffer[1] === 0xff) return buffer.subarray(2).swap16().toString('utf16le').replace(/\0/g, '').trim();
    if (buffer[0] === 0xff && buffer[1] === 0xfe) return buffer.subarray(2).toString('utf16le').replace(/\0/g, '').trim();
    return buffer.toString('utf16le').replace(/\0/g, '').trim();
  }
  if (encoding === 2) return Buffer.from(buffer).swap16().toString('utf16le').replace(/\0/g, '').trim();
  return buffer.toString('utf8').replace(/\0/g, '').trim();
};

const findTerminator = (buffer, start, encoding) => {
  if (encoding === 1 || encoding === 2) {
    for (let index = start; index < buffer.length - 1; index += 2) {
      if (buffer[index] === 0 && buffer[index + 1] === 0) return index;
    }
    return buffer.length;
  }
  const index = buffer.indexOf(0, start);
  return index === -1 ? buffer.length : index;
};

const parseId3 = (filePath) => {
  const buffer = fs.readFileSync(filePath);
  if (buffer.subarray(0, 3).toString('latin1') !== 'ID3') return {};

  const version = buffer[3];
  const tagSize = syncSafeToInt(buffer, 6);
  let offset = 10;
  const end = Math.min(buffer.length, offset + tagSize);
  const metadata = {};

  while (offset + 10 <= end) {
    const id = buffer.subarray(offset, offset + 4).toString('latin1');
    if (!/^[A-Z0-9]{4}$/.test(id)) break;

    const size = version === 4 ? syncSafeToInt(buffer, offset + 4) : buffer.readUInt32BE(offset + 4);
    const frameStart = offset + 10;
    const frameEnd = Math.min(frameStart + size, end);
    if (size <= 0 || frameEnd > buffer.length) break;

    const frame = buffer.subarray(frameStart, frameEnd);
    if (['TIT2', 'TPE1', 'TALB', 'TLEN'].includes(id) && frame.length > 1) {
      const text = decodeText(frame.subarray(1), frame[0]);
      if (id === 'TIT2') metadata.title = text;
      if (id === 'TPE1') metadata.artists = text.split(/\0|\/|;|、/).map((artist) => artist.trim()).filter(Boolean);
      if (id === 'TALB') metadata.album = text;
      if (id === 'TLEN') metadata.duration = Math.round(Number(text) / 1000) || 0;
    }

    if (id === 'APIC' && frame.length > 4 && !metadata.picture) {
      const encoding = frame[0];
      const mimeEnd = frame.indexOf(0, 1);
      if (mimeEnd !== -1 && mimeEnd + 2 < frame.length) {
        const mime = frame.subarray(1, mimeEnd).toString('latin1');
        const descriptionStart = mimeEnd + 2;
        const descriptionEnd = findTerminator(frame, descriptionStart, encoding);
        const imageStart = descriptionEnd + (encoding === 1 || encoding === 2 ? 2 : 1);
        if (imageStart < frame.length) {
          metadata.picture = {
            mime,
            data: frame.subarray(imageStart),
          };
        }
      }
    }

    offset = frameEnd;
  }

  return metadata;
};

const shouldAutoFillTitle = (title, slug, audio) => {
  if (!title) return true;
  const decodedAudio = audio ? decodeURIComponent(audio).replace(/\\/g, '/') : '';
  const audioName = decodedAudio ? path.basename(decodedAudio, path.extname(decodedAudio)) : '';
  return title === slug || title === audioName;
};

const writeYaml = (filePath, data) => {
  fs.writeFileSync(filePath, dump(data, {
    lineWidth: -1,
    quotingType: '"',
    sortKeys: false,
  }), 'utf8');
};

const hydrateEntryFromAudio = (filePath, data, slug, audio, audioFile) => {
  let metadata = {};
  try {
    metadata = parseId3(audioFile);
  } catch (error) {
    console.warn(`[music] could not read ID3 metadata for ${path.relative(root, audioFile)}: ${error.message}`);
    return data;
  }

  let changed = false;
  const next = { ...data };

  if (metadata.title && shouldAutoFillTitle(next.title, slug, audio) && next.title !== metadata.title) {
    next.title = metadata.title;
    changed = true;
  }
  if (
    metadata.artists?.length
    && (!Array.isArray(next.artists) || next.artists.length === 0)
  ) {
    next.artists = metadata.artists;
    changed = true;
  }
  if (metadata.album && !next.album) {
    next.album = metadata.album;
    changed = true;
  }
  if (metadata.duration && !Number(next.duration)) {
    next.duration = metadata.duration;
    changed = true;
  }
  if (metadata.picture && !next.cover) {
    const extension = metadata.picture.mime.includes('png') ? 'png' : 'jpg';
    const coverUrl = `/images/music/${slug}-cover.${extension}`;
    const coverFile = publicUrlToFile(coverUrl);
    if (!fs.existsSync(coverFile)) {
      fs.mkdirSync(path.dirname(coverFile), { recursive: true });
      fs.writeFileSync(coverFile, metadata.picture.data);
    }
    if (next.cover !== coverUrl) {
      next.cover = coverUrl;
      changed = true;
    }
  }

  if (changed) {
    writeYaml(filePath, next);
    console.log(`[music] autofilled metadata -> ${path.relative(root, filePath)}`);
  }

  return next;
};

const readMusicEntries = () => {
  if (!fs.existsSync(musicDir)) return [];

  return fs.readdirSync(musicDir, { withFileTypes: true })
    .filter((entry) => entry.isFile() && /\.(ya?ml|json)$/i.test(entry.name))
    .map((entry) => {
      const filePath = path.join(musicDir, entry.name);
      const raw = fs.readFileSync(filePath, 'utf8');
      let data;
      try {
        data = load(raw) || {};
      } catch (error) {
        throw new Error(`[music] failed to parse ${path.relative(root, filePath)}: ${error.message}`);
      }
      const slug = path.basename(entry.name).replace(/\.(ya?ml|json)$/i, '');
      const audio = toPublicUrl(data.audio);

      if (!data.enabled) return null;
      if (!audio) {
        console.warn(`[music] skipped ${entry.name}: audio is required`);
        return null;
      }
      const audioFile = publicUrlToFile(audio);

      if (!audioFile || !fs.existsSync(audioFile)) {
        console.warn(`[music] skipped ${entry.name}: audio file does not exist at ${audio}`);
        return null;
      }

      data = hydrateEntryFromAudio(filePath, data, slug, audio, audioFile);
      if (!data.title) {
        data.title = path.basename(decodeURIComponent(audio), path.extname(audio));
      }

      const artists = Array.isArray(data.artists)
        ? data.artists.filter((artist) => typeof artist === 'string' && artist.trim())
        : [];
      const cover = toPublicUrl(data.cover);
      const coverFile = cover ? publicUrlToFile(cover) : '';

      if (cover && (!coverFile || !fs.existsSync(coverFile))) {
        console.warn(`[music] cover not found for ${entry.name}: ${cover}`);
      }

      return {
        id: stableId(slug),
        name: String(data.title),
        artists,
        album: typeof data.album === 'string' ? data.album : '',
        cover: cover && coverFile && fs.existsSync(coverFile) ? cover : '',
        duration: Number.isFinite(Number(data.duration)) ? Math.max(0, Number(data.duration)) : 0,
        url: audio,
        order: Number.isFinite(Number(data.order)) ? Number(data.order) : 0,
        slug,
      };
    })
    .filter(Boolean)
    .sort((a, b) => a.order - b.order || a.slug.localeCompare(b.slug));
};

const escapeForTypeScript = (value) => JSON.stringify(value, null, 2).replace(
  /[^\x00-\x7F]/g,
  (char) => `\\u${char.codePointAt(0).toString(16).padStart(4, '0')}`
);
const entries = readMusicEntries();

const output = `export type LocalMusicTrack = {
  id: number;
  name: string;
  artists: string[];
  album: string;
  cover: string;
  duration: number;
  url: string;
};

// Generated from src/content/music. Edit music entries in Keystatic instead.
export const LOCAL_MUSIC: LocalMusicTrack[] = ${escapeForTypeScript(
  entries.map(({ order, slug, ...track }) => track)
)};
`;

fs.writeFileSync(outputFile, output, 'utf8');
console.log(`[music] generated ${entries.length} track(s) -> ${path.relative(root, outputFile)}`);
