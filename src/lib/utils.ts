export function formatDate(date: Date): string {
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export interface ArticleMeta {
  title: string;
  description: string;
  publishDate: Date;
  zone: string;
  tags: string[];
  heroImage?: string;
  slug: string;
  draft?: boolean;
}

export const ZONES = [
  '全部',
  '学习',
  '编程',
  '生活',
  '运动',
  '娱乐',
  '社交',
] as const;

export type Zone = (typeof ZONES)[number];
