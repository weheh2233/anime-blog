import type { ImageMetadata } from 'astro';
import gallery1 from '../assets/images/gallery-1.jpg';
import gallery2 from '../assets/images/gallery-2.jpg';
import gallery3 from '../assets/images/gallery-3.jpg';
import heroBanner from '../assets/images/hero-banner.png';
import avatar from '../assets/images/avatar.png';

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

export { gallery1, gallery2, gallery3, heroBanner, avatar };
