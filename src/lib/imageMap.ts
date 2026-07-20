import type { ImageMetadata } from 'astro';
import gallery1 from '../assets/images/gallery-1.webp';
import gallery2 from '../assets/images/gallery-2.webp';
import gallery3 from '../assets/images/gallery-3.webp';
import heroBanner from '../assets/images/hero-banner.webp';
import avatar from '../assets/images/avatar.webp';

const map: Record<string, ImageMetadata> = {
  'gallery-1.jpg': gallery1,
  'gallery-2.jpg': gallery2,
  'gallery-3.jpg': gallery3,
  'hero-banner.png': heroBanner,
  'avatar.png': avatar,
};

/** 根据文件名（如 gallery-1.jpg）获取导入的图片对象 */
export function getImageByFilename(filename: string): ImageMetadata | undefined {
  return map[filename];
}

/** 根据完整路径（如 /images/gallery-1.jpg）提取文件名并获取图片对象 */
export function getImageByPath(path: string): ImageMetadata | undefined {
  const filename = path.split('/').pop()!;
  return map[filename];
}

/**
 * 解析 heroImage：
 * - imageMap 中的图片 → 返回 ImageMetadata（ArticleCard 用 <Image> 做 responsive 适配）
 * - Keystatic 上传到 public/images/ 的封面图 → 返回 public URL 字符串
 * - 不匹配 → undefined
 */
export function resolveHeroImage(path: string | undefined | null): ImageMetadata | string | undefined {
  if (!path) return undefined;
  const imported = getImageByPath(path);
  if (imported) return imported;
  // Keystatic 后台上传的图片，直接当 public URL 用
  if (path.startsWith('/')) return path;
  return undefined;
}

export { gallery1, gallery2, gallery3, heroBanner, avatar };
