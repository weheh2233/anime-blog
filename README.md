# 代码与纸飞机 🎌

> 一个喜欢动漫的开发者博客 — 记录技术、分享生活、聊聊喜欢的作品。

基于 [Astro](https://astro.build) 构建，集成 [Keystatic CMS](https://keystatic.com) 管理内容，部署在 [Vercel](https://vercel.com)。

## ✨ 特性

- **📝 博客系统** — Markdoc 驱动，支持专区分类（学习/编程/生活/运动/娱乐/社交）、标签、封面图
- **🎵 本地音乐播放器** — 通过 Keystatic 后台管理音乐资源，全站播放
- **🍅 番茄钟** — 专注计时模块，搭配 Pomodoro 侧边栏小组件
- **🏷️ 标签体系** — 按标签聚合文章
- **🔍 全文搜索** — 集成 Pagefind，支持站内搜索
- **📱 响应式设计** — Tailwind CSS v4，适配移动端与桌面端
- **🌗 主题切换** — 亮色/暗色主题
- **💬 评论系统** — Giscus（GitHub Discussions 驱动）
- **🖼️ Apple 风格动画** — 滚动浮现、文字弹跳、鼠标拖尾效果
- **🎯 相遇记录** — 首页小卡片展示重要事件/相遇记录，自动计算天数
- **🎨 动漫风格 UI** — 自定义配色系统、渐变、动效

## 🛠️ 技术栈

| 工具 | 用途 |
|------|------|
| [Astro](https://astro.build) | 框架/SSR |
| [Keystatic CMS](https://keystatic.com) | 内容管理后台 |
| [Tailwind CSS v4](https://tailwindcss.com) | 样式 |
| [React](https://react.dev) | UI 交互组件 |
| [Markdoc](https://markdoc.dev) | 文章编写格式 |
| [Pagefind](https://pagefind.app) | 站内搜索 |
| [Giscus](https://giscus.app) | 评论系统 |
| [Vercel](https://vercel.com) | 部署平台 |
| [js-yaml](https://github.com/nodeca/js-yaml) | YAML 解析 |

## 📁 项目结构

```
src/
├── assets/images/       # 构建时优化的图片资源
├── components/          # UI 组件
│   ├── ArticleCard.astro
│   ├── Header.astro
│   ├── HeroSection.astro
│   ├── Sidebar.astro
│   ├── Footer.astro
│   ├── LocalMusicRuntime.astro   # 本地音乐播放器
│   ├── MemoryRecordCard.astro    # 相遇记录卡片
│   ├── SearchModal.astro         # 搜索弹窗
│   ├── ScrollReveal.astro        # 滚动动画
│   ├── ThemeToggle.astro         # 主题切换
│   ├── PomodoroSidebarWidget.astro
│   └── ...
├── content/
│   ├── music/           # 音乐元数据（YAML）
│   ├── posts/           # 文章（Markdoc）
│   └── site/            # 站点设置
├── layouts/             # 页面布局
├── lib/                 # 工具函数
│   ├── imageMap.ts      # 图片管理与映射
│   ├── localMusic.ts    # 音乐播放逻辑
│   ├── postImport.ts    # 文章导入工具
│   └── ...
├── pages/               # 路由页面
│   ├── index.astro      # 首页
│   ├── blog/            # 博客列表/详情
│   ├── pomodoro.astro   # 番茄钟
│   ├── keystatic-import.astro  # CMS 导入页
│   └── ...
public/
├── images/              # 公开图片资源
│   └── music/           # 音乐封面
├── music/               # 音乐文件
scripts/
├── dev.mjs              # 开发服务器
└── sync-local-music.mjs # 同步本地音乐到 CMS
```

## 🚀 开始使用

### 前置要求

- Node.js >= 20
- npm

### 安装

```bash
git clone <repo-url>
cd anime-blog
npm install
```

### 开发

```bash
npm run dev
```

Keystatic 后台访问路径：`/keystatic`

### 构建

```bash
npm run build
```

构建流程会自动同步音乐资源并生成 Pagefind 搜索索引。

### 同步本地音乐

```bash
npm run sync:music
```

将 `public/music/` 下的音频文件扫描并生成对应的 Keystatic 内容条目。

## ⚙️ 环境变量

用于 Keystatic GitHub 认证（生产环境）：

| 变量 | 说明 |
|------|------|
| `KEYSTATIC_GITHUB_CLIENT_ID` | GitHub OAuth App Client ID |
| `KEYSTATIC_GITHUB_CLIENT_SECRET` | GitHub OAuth App Client Secret |
| `KEYSTATIC_SECRET` | Keystatic 会话密钥 |

## 🌐 部署

项目已配置 Vercel 适配器，连接 GitHub 仓库后：

1. 在 Vercel 添加上述环境变量
2. 部署命令自动使用 `npm run build`
3. Keystatic 生产环境使用 GitHub 存储模式

## 📄 许可证

MIT
