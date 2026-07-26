import { load as loadYaml } from 'js-yaml';
import rawSiteSettings from '../content/site/index.yaml?raw';

const rawBackgroundEntries = import.meta.glob<string>('../content/site-backgrounds/*.yaml', {
  eager: true,
  import: 'default',
  query: '?raw',
});

export type MemoryRecord = {
  title: string;
  startDate: string | Date;
  content?: string;
};

type SiteSettings = {
  memoryRecords?: unknown;
};

type SiteBackground = {
  image?: unknown;
  order?: unknown;
  enabled?: unknown;
};

const loadedSettings = loadYaml(rawSiteSettings) as SiteSettings | null;

export const backgroundImages = Object.values(rawBackgroundEntries)
  .map((rawEntry) => loadYaml(rawEntry) as SiteBackground | null)
  .filter((entry): entry is SiteBackground => entry?.enabled !== false)
  .sort((a, b) => Number(a.order || 0) - Number(b.order || 0))
  .map((entry) => entry.image)
  .filter((value): value is string => typeof value === 'string' && value.trim().length > 0);

export const memoryRecords = Array.isArray(loadedSettings?.memoryRecords)
  ? loadedSettings.memoryRecords.filter((value): value is MemoryRecord => (
      typeof value === 'object'
      && value !== null
      && typeof (value as MemoryRecord).title === 'string'
      && Boolean((value as MemoryRecord).startDate)
    ))
  : [];
