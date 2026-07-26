import { load as loadYaml } from 'js-yaml';
import rawSiteSettings from '../content/site/index.yaml?raw';

export type MemoryRecord = {
  title: string;
  startDate: string | Date;
  content?: string;
};

type SiteSettings = {
  backgroundImages?: unknown;
  memoryRecords?: unknown;
};

const loadedSettings = loadYaml(rawSiteSettings) as SiteSettings | null;

export const backgroundImages = Array.isArray(loadedSettings?.backgroundImages)
  ? loadedSettings.backgroundImages.filter((value): value is string => typeof value === 'string' && value.trim().length > 0)
  : [];

export const memoryRecords = Array.isArray(loadedSettings?.memoryRecords)
  ? loadedSettings.memoryRecords.filter((value): value is MemoryRecord => (
      typeof value === 'object'
      && value !== null
      && typeof (value as MemoryRecord).title === 'string'
      && Boolean((value as MemoryRecord).startDate)
    ))
  : [];
