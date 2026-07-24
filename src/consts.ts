export const SITE = {
  title: '代码与纸飞机',
  description: '一个喜欢动漫的开发者博客',
  url: 'https://anime-blog.vercel.app',
  author: 'Kira',
  since: 2026,
  repo: 'https://github.com/yourusername/anime-blog',
  rss: '/rss.xml',
};

export const ZONES = [
  { key: '全部', label: '全部' },
  { key: '学习', label: '学习' },
  { key: '编程', label: '编程' },
  { key: '生活', label: '生活' },
  { key: '运动', label: '运动' },
  { key: '娱乐', label: '娱乐' },
  { key: '社交', label: '社交' },
] as const;

export type ZoneKey = (typeof ZONES)[number]['key'];

export const NAV_ITEMS = [
  { label: '首页', href: '/' },
  { label: '博客', href: '/blog' },
  { label: '项目', href: '/projects' },
  { label: '番茄钟', href: '/pomodoro' },
  { label: '标签', href: '/tags' },
  { label: '关于', href: '/about' },
] as const;
