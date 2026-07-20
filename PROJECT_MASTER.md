# Project Master — Anime Blog

> 全面掌握项目架构、文件职责、实现细节与已知问题。
> 用途：快速恢复上下文、定位文件、理解路由和数据流。

---

## 一、项目概览

| 项目 | 值 |
|------|-----|
| 名称 | anime-blog（代码与纸飞机） |
| 框架 | Astro 7.x (^7.1.1) |
| 样式 | Tailwind CSS v4 (v4.3.3) + PostCSS |
| 内容格式 | **Markdoc**（`.mdoc`）+ 兼容 `.md` / `.mdx` |
| CMS | Keystatic（GitHub 存储模式，`/keystatic`，线上可写） |
| 部署 | Vercel SSR（`@astrojs/vercel@11`，hybrid 模式） |
| 域名 | `https://anime-blog-zeta.vercel.app` |
| 包管理器 | npm |
| 语言 | TypeScript / JavaScript |

### 构建配置

- **astro.config.mjs** — 集成 `@astrojs/react`、`@astrojs/markdoc`、`@keystatic/astro`、`@astrojs/vercel` 适配器、`@tailwindcss/vite`；`output: 'static'` + Vite `define` 映射 KEYSTATIC 环境变量防 Rolldown 优化
- **Tailwind 入口** — `src/styles/global.css` 中 `@import "tailwindcss"`，由 `@tailwindcss/vite` 插件处理
- **构建命令** — `astro build && npx pagefind --site .vercel/output/static`

> ⚠️ 历史：曾用 `@tailwindcss/postcss`（PostCSS 方式），但 Astro 7 + Rolldown 下 PostCSS import 解析不兼容导致构建失败。当前使用 `@tailwindcss/vite` 确保正确处理 `@import "tailwindcss"`。`postcss.config.mjs` 已禁用（保留为 `.disabled`）。

### 关键依赖版本

| 包 | 版本 |
|----|------|
| `astro` | ^7.1.1 |
| `@astrojs/markdoc` | ^2.0.3 |
| `@astrojs/react` | ^6.0.1 |
| `@keystatic/core` | ^0.5.51 |
| `@keystatic/astro` | ^5.2.0 |
| `@astrojs/vercel` | ^11.0.3 |
| `tailwindcss` | ^4.0.0 |
| `@tailwindcss/postcss` | ^4.3.3 |
| `pagefind` | ^1.5.2 |
| `@types/node` | （开发依赖） |

---

## 二、目录结构

```
anime-blog/
├── src/
│   ├── pages/                      # 路由页面
│   │   ├── index.astro             # 首页
│   │   ├── blog/
│   │   │   ├── index.astro         # 博客列表（客户端筛选）
│   │   │   └── [...slug].astro     # 文章详情（Content Collection）
│   │   ├── tags/
│   │   │   ├── index.astro         # 标签聚合
│   │   │   └── [tag].astro         # 按标签筛选
│   │   ├── projects.astro          # 项目展示
│   │   ├── about.astro             # 关于（带头像发光光环）
│   │   └── 404.astro               # 404
│   ├── components/                  # 组件
│   │   ├── SplashScreen.astro      # 开屏动画（动态创建 overlay）
│   │   ├── Header.astro            # 顶部导航
│   │   ├── Footer.astro            # 页脚
│   │   ├── Sidebar.astro           # 侧边栏
│   │   ├── HeroSection.astro       # 首页 Hero（3D 旋转卡片墙）
│   │   ├── ArticleCard.astro       # 文章卡片（3D 倾斜 + 光泽扫过）
│   │   ├── SearchModal.astro       # Pagefind 搜索弹窗
│   │   ├── ScrollReveal.astro      # 滚动入场动画
│   │   ├── ZoneFilter.astro        # 专区筛选条
│   │   ├── GiscusComments.astro    # 评论区
│   │   ├── ReadingProgress.astro   # 阅读进度条
│   │   ├── ThemeToggle.astro       # 主题切换（备用组件）
│   │   ├── MouseTrail.astro        # 鼠标粒子轨迹
│   │   └── TextBounce.astro        # 文字弹跳动画
│   ├── layouts/
│   │   └── BaseLayout.astro        # 全局布局（关键！）
│   ├── styles/
│   │   └── global.css              # Tailwind 入口 + 主题 CSS 变量 + 背景图
│   ├── content/
│   │   └── posts/                  # Markdoc/Markdown 文章（Keystatic 写入）
│   ├── assets/
│   │   └── images/                 # Astro 构建时优化的图片（ESM import）
│   │       ├── gallery-1.jpg
│   │       ├── gallery-2.jpg
│   │       ├── gallery-3.jpg
│   │       ├── hero-banner.png     # 背景图（三月七）
│   │       └── avatar.png          # 头像
│   ├── lib/
│   │   ├── utils.ts                # formatDate / ArticleMeta / ZONES（旧）
│   │   └── imageMap.ts             # 图片 ESM 导入映射 + resolveHeroImage
│   ├── consts.ts                   # 站点常量、导航、专区（唯一权威源）
│   └── content.config.ts           # Astro Content Collections schema
├── public/
│   └── images/                     # Keystatic 上传的图片（public URL）
├── keystatic.config.ts
├── astro.config.mjs
├── postcss.config.mjs
└── DESIGN_CONVENTIONS.md           # 设计约定（部分过时）
```

---

## 三、路由

| 路由 | 文件 | 说明 |
|------|------|------|
| `/` | `pages/index.astro` | 首页：Hero + 专区筛选条 + 文章卡片网格（18 篇） |
| `/blog` | `pages/blog/index.astro` | 博客列表（全部文章，**客户端**专区筛选） |
| `/blog/[slug]` | `pages/blog/[...slug].astro` | 文章详情（Content Collection 动态路由） |
| `/tags` | `pages/tags/index.astro` | 标签聚合页 |
| `/tags/[tag]` | `pages/tags/[tag].astro` | 按标签筛选文章 |
| `/projects` | `pages/projects.astro` | 项目展示 |
| `/about` | `pages/about.astro` | 关于页（头像 + 发光环） |
| `/404` | `pages/404.astro` | 404 |
| `/keystatic` | Keystatic CMS | 线上可用（GitHub 存储模式，需 OAuth 登录）|

### 路由说明

- **博客列表客户端筛选**：blog/index.astro 使用 `pushState` + 客户端过滤，点击专区 pill 无刷新切换，ZoneFilter 高亮同步
- **slug 处理**：`ArticleCard` 传递 slug 时使用 `post.id.replace(/\.md$/, '')` — 注意 `.mdoc` 文件不会去后缀，需路由处理

---

## 四、数据流

### 文章内容

```
Keystatic (UI 编辑器，Markdoc 格式)
  → 写入 src/content/posts/*.mdoc（或以 .md 导入的旧文章）
    → Astro Content Collections (content.config.ts 定义 schema)
      → getCollection('posts') 获取文章列表
        → 页面渲染 (slug 路由、列表页、标签筛选)
```

### 文章 schema（content.config.ts）

```ts
interface Post {
  title: string;
  description: string;
  publishDate: Date;
  zone?: string;       // 学习/编程/生活/运动/娱乐/社交
  tags: string[];      // 默认 []
  heroImage?: string;  // 封面图路径（可能是 public URL 或 ESM import）
  draft: boolean;      // 默认 false
}
```

### 文章 slug 生成

- 非 Keystatic 文章（.md）：title → 文件路径中的 slug（如 `hello-blog`）
- Keystatic 文章（.mdoc）：title → 自动转换为 slug（中文→拼音/编码）
- `getStaticPaths` 使用 `post.id` 作为 params.slug

### 图片解析流程（lib/imageMap.ts）

```
heroImage 路径
  → 是 ESM import 图片? → 返回 ImageMetadata（可用 Astro <Image> 优化）
  → 是 public URL（/images/xxx）? → 直接当字符串 URL 用
  → undefined → 不显示封面图
```

### 内容集合加载器

支持 `**/*.{md,mdoc,mdx}` 三种格式，确保旧 `.md` 文章与新 `.mdoc` 文章共存。

---

## 五、BaseLayout.astro — 心脏文件

所有页面共用此布局。Props：`title`（必填）、`description`、`hideSidebar`。

### 5.1 模板结构

```
<head>
  - meta / title / fonts（Noto Sans SC + JetBrains Mono）
  - __pageLoads / __isHardReload (is:inline)
  - astro-view-transitions-enabled
  - theme-color / color-scheme
</head>
<body>
  - SplashScreen（开屏动画）
  - SearchModal（搜索弹窗）
  - MouseTrail（鼠标粒子）
  - Header（导航）
  - main content slot + Sidebar（可隐藏 via hideSidebar）
  - Footer
  - busuanzi 统计 script
  - View Transitions 事件 + vt-loading 指示器
  - vt-flip + vt-flip-body（浮动数字波浪弹跳）
  - 主题恢复 script (is:inline)
  - <style>（加载指示器 + 浮动数字 CSS）
</body>
```

### 5.2 View Transitions 事件

**`astro:before-preparation`**
- 设 `window.__splashBlocked = true`
- `sessionStorage.setItem('splash_blocked', '1')`
- 显示顶部 `vt-loading` 加载条

**`astro:after-swap`** — 隐藏 `vt-loading`

**`astro:page-load`** — 隐藏 `vt-loading`

### 5.3 浮动数字波浪弹跳

位置：`vt-flip-body` 元素后紧跟 `<script is:inline>`。

逻辑：
1. 检查 `window.__splashBlocked` — 只有 View Transition 时才为 `true`
2. 从 `sessionStorage.getItem('flip_seq')` 读取序号，轮转 1→9
3. 清空 `vt-flip-body`，逐字符创建 `<span>`，设自定义属性 `--i` 控制波浪延迟
4. 加 `active` class 触发 CSS 波浪弹跳动画
5. 900ms 后 `setTimeout` 自动隐藏，恢复默认 `✦` 文本

### 5.4 开屏拦截机制（三层）

| 层 | 机制 | 设置方 | 检查方 |
|----|------|--------|--------|
| 1 | `window.__splashBlocked` | module script 的 `astro:before-preparation` | SplashScreen.astro |
| 2 | `window.__splashShown` | SplashScreen.astro 首次播放时 | SplashScreen.astro |
| 3 | `sessionStorage.splash_blocked` | module script 的 `astro:before-preparation` | SplashScreen.astro |

### 5.5 Layout CSS 关键选择器

- `.vt-loading` / `.vt-loading.active` — 顶部加载条
- `.vt-flip` / `.vt-flip.active` — 浮动数字容器（opacity + transform 过渡）
- `.vt-flip-body` — flex 容器，撑开 span 字符
- `.vt-flip.active .vt-flip-body span` — 波浪弹跳动画 `flipWave`
- `@keyframes flipWave` — 0%→25%→50%→100%，每个字符依次 `translateY(-16px)` + `color: #f0e68c`

### 5.6 布局关键 CSS 变量

| 变量 | 值 | 说明 |
|------|-----|------|
| `--blog-header-h` | 56px | 固定导航高度 |
| `--blog-content-w` | 1200px | 内容区最大宽度 |
| `--blog-sidebar-w` | 280px | 侧边栏宽度 |

---

## 六、SplashScreen.astro — 开屏动画

### 技术方案

- **不放在静态 HTML 中**：overlay 由 `is:inline` 脚本**动态创建**，播完后 `remove()` 从 DOM 删除
- View Transition 时 DOM 中无 overlay 元素，不可能闪烁
- 仅在首次硬加载时播放

### 脚本执行流程

1. 检查拦截旗帜（`__splashBlocked` / `__splashShown` / `sessionStorage`）→ 命中则跳过
2. 设置 `__splashShown = true` / `__splashBlocked = true` / `sessionStorage.setItem()`
3. 动态创建 `splash-overlay` → `.playing` class 显示
4. 生成 18 块不规则碎片（8 个角扇区 × 每扇区 2~3 道径向切割）
5. 动画时间线：
   - 280ms + 38ms/块 → 碎片飞入中心展开
   - 1800ms → "千秋羽霄" + "✦ 加载中" 淡入
   - 2800ms → 碎片向外散射消失
   - 4200ms → 文字放大淡出
   - 5000ms → overlay 淡出 → `remove()` 删除
6. CSS：`!important` 在 prefers-reduced-motion 时强制隐藏

---

## 七、组件详解

### 7.1 Header.astro

固定顶部导航，毛玻璃效果（`backdrop-filter: blur(12px)`）。
- 桌面：Logo + 导航链接 + 搜索按钮 + 主题切换
- 移动端：隐藏导航 + 汉堡菜单抽屉
- 当前页高亮：`currentPath.startsWith(item.href)`
- 主题切换：`localStorage.setItem('blog-theme', 'dark'/'light')` + `<html class="dark">`
- 搜索：调用 `window.__toggleSearch()`（SearchModal 暴露）

### 7.2 HeroSection.astro

首页 Hero 区域：
- 标题 + 副标题（渐变文字 `bg-linear-to-r`）
- 3D 旋转卡片墙：16 张卡片绕 Y 轴旋转
- 卡片图片来源：`imageMap` 导出的 5 张图片（gallery1~3、avatar、heroBanner），CSS `filter` 衍生 8 种变体
- 内外环交替：奇数卡片 `translateZ(120px)`，偶数 `translateZ(200px)`
- 亚克力玻璃效果（`backdrop-filter: blur(8px)`）

### 7.3 ArticleCard.astro

Bilibili 式文章卡片：
- 16:9 缩略图 + 内容区
- 3D 鼠标倾斜效果（`mousemove` → `rotateX`/`rotateY`）
- 悬停：光泽扫过（`shineSweep` 动画）、Mini 3D 螺旋、accent 色 border 发光
- 封面图使用 `resolveHeroImage()` 函数智能解析
- Loading 策略：前 6 张 `eager`，其余 `lazy`
- `astro:page-load` 重新绑定 3D 倾斜

### 7.4 SearchModal.astro

Pagefind 搜索弹窗：
- `Ctrl+K` 或点击搜索按钮打开
- 动态加载 `/pagefind/pagefind.js`（仅生产构建有索引）
- 搜索结果渲染 + 键盘导航（↑↓→Enter→Escape）
- View Transition 后自动关闭

### 7.5 ScrollReveal.astro

滚动入场动画（Apple 风格）：
- CSS transition（`opacity` + `transform`）— cubic-bezier(0.0,0.0,0.2,1) + 18px + 1s
- IntersectionObserver 一次性触发，stagger 延迟通过 `index` prop 控制
- View Transition 后 `astro:page-load` 重新绑定

### 7.6 ZoneFilter.astro

专区筛选条：
- 水平 flex-nowrap + mask-image 右侧渐变隐藏
- 悬停时 mask-image 移除展示全部
- 点击跳转 `/blog?zone=xxx`
- blog/index.astro 拦截点击事件实现无刷新客户端筛选

### 7.7 Sidebar.astro

- Banner 大图 + 作者信息 + 图片网格 + 友链 + 最近文章 + 访客位置
- 访客位置通过 `ipapi.co` API 获取

### 7.8 ReadingProgress.astro

阅读进度条：`scroll` 事件 → `progress%` → 渐变条宽度
- 超 95% 变色（金色）

### 7.9 TextBounce.astro

逐字弹性弹跳组件 — 与本项目的波浪弹跳数字同原理
- 每个字符 `<span>`，`--char-i` 控制动画延迟
- 可配置循环/单次

### 7.10 MouseTrail.astro

Canvas 2D 粒子系统：
- 对象池（200 个粒子）
- mousemove → 发射粒子（蓝紫色系）
- 粒子自动衰减消失
- 移动端 / prefers-reduced-motion 跳过

### 7.11 ThemeToggle.astro

独立的主题切换按钮组件（备用），Header 已内置同样功能。

### 7.12 GiscusComments.astro

GitHub Discussions 评论区：
- 动态创建 `<script>` 加载 `giscus.app/client.js`
- 配置：repo-id / category-id 需要替换为真实值
- 主题自适应 `preferred_color_scheme`

---

## 八、Markdoc 内容格式

项目使用 **Markdoc**（`@astrojs/markdoc`）作为主要内容格式。

### 架构

```
Keystatic fields.markdoc()
  → 写入 .mdoc 文件
    → Astro Markdoc 渲染
      → 文章详情页显示
```

### Keystatic 编辑器中 Markdoc 支持的格式

- 内联代码 `inlineCode`
- 加粗/斜体/删除线
- 链接
- 分割线
- 表格
- 图片（上传到 `public/images/`）

### 旧文章兼容

`content.config.ts` 的 loader 配置为 `glob({ pattern: '**/*.{md,mdoc,mdx}' })`，确保迁移前写的 `.md` 文章仍然可读。

### astro.config.mjs 中 Shiki 代码高亮

```js
markdown: {
  shikiConfig: {
    theme: 'github-dark-default',
    defaultColor: false,
    wrap: true,
  },
}
```

---

## 九、Tailwind CSS 说明

### 当前方案

使用 `@tailwindcss/vite`（Vite 插件方式），在 `astro.config.mjs` 的 `vite.plugins` 中配置。
`src/styles/global.css` 中使用 `@import "tailwindcss"` 引入，由插件自动处理。

### 历史

曾尝试 `@tailwindcss/postcss`（PostCSS 方式），但 Astro 7 + Rolldown 下 PostCSS import 解析会尝试将 `@import "tailwindcss"` 解析为文件路径，导致 ENOENT 构建失败。切换为 `@tailwindcss/vite` 后修复。

---

## 十、主题系统

### 亮色/暗色切换

- 默认亮色，CSS 变量在 `:root` 定义
- 暗色在 `.dark` 选择器下覆盖
- 切换：`localStorage.setItem('blog-theme', 'dark'/'light')` + `<html class="dark">`
- 恢复：`<script is:inline>` 检查 `localStorage` 并在渲染前设置 class，防止 FOUC

### 主题色系

| 令牌 | 亮色 | 暗色 |
|------|------|------|
| `--blog-bg` | `#f5f2ed` | `#13161c` |
| `--blog-surface` | `#faf8f5` | `#1a1d27` |
| `--blog-accent` | `#3b4a6b`（藏蓝） | `#5a7a9e`（浅蓝灰）|
| `--blog-glass` | `rgba(255,255,255,0.78)` | `rgba(26,29,39,0.75)` |

### 背景图

- `body` 使用 `--blog-bg-image`（`url('../assets/images/hero-banner.png')`）作为背景
- 亮色叠加 `rgba(245,242,237,0.85)` 渐变层
- 暗色叠加 `rgba(19,22,28,0.92)` 渐变层
- `background-attachment: fixed`

---

## 十一、View Transitions 详解

### 启用方式

`<meta name="astro-view-transitions-enabled" content="true" />` 在 BaseLayout head 中。

### 生命周期事件

| 事件 | 用途 | 本项目的 handler |
|------|------|-----------------|
| `astro:before-preparation` | 导航开始前，最早的事件 | 设 `__splashBlocked` / `sessionStorage` / 显示 `vt-loading` |
| `astro:after-swap` | DOM 替换完成后 | 隐藏 `vt-loading` |
| `astro:page-load` | 新页面脚本/资源加载完成 | 隐藏 `vt-loading` + 重新绑定 ScrollReveal / 3D 倾斜 |

### 浮动数字动画流程

点击链接 → `astro:before-preparation`（模块脚本设旗帜）
→ 新页面 HTML 加载 → 新页面 `is:inline` 脚本执行
→ 检测 `__splashBlocked === true` → 构建波浪弹跳字符
→ 900ms 后自动隐藏

### 已知注意事项

- View Transition 时 **head 的 is:inline 脚本不重新执行**（head 是 merge 不是 replace）
- **body 的 is:inline 脚本重新执行**（body 被 replace）
- **module 脚本不重新执行**（只执行一次）
- 所以 `__pageLoads` 在 head 里只加一次，不能在 View Transition 中递增

---

## 十二、lib/imageMap.ts — 图片解析系统

统一管理所有 ESM 导入的图片，用于 HeroSection 的 3D 卡墙和文章封面图。

### 导出函数

| 函数 | 用途 |
|------|------|
| `getImageByFilename(name)` | 根据文件名（如 `gallery-1.jpg`）获取 ImageMetadata |
| `getImageByPath(path)` | 根据完整路径提取文件名并获取 |
| `resolveHeroImage(path)` | **智能解析**：优先返回 ImageMetadata，否则当 public URL 用 |

### 解析顺序

1. `imageMap` 中有对应 ESM import → 返回 `ImageMetadata`（可用 `<Image>` 优化渲染）
2. `path.startsWith('/')` → 直接当 public URL 用（Keystatic 上传到 `public/images/` 的图片）
3. 无 path → 返回 `undefined`（不显示封面图）

---

## 十三、独立说明

### 关于页 — 头像发光光环

- 使用 `conic-gradient` 渐变环 + CSS `mask: radial-gradient()` 切出中心圆孔
- `::after` 伪元素 + `filter: blur(12px)` 制造辉光
- 旋转动画 `ringSpin 2s linear infinite`
- prefers-reduced-motion 时隐藏

### Keystatic CMS

- 地址：`/keystatic`（线上可用，需 GitHub OAuth 登录）
- 存储：`kind: 'local'`（本地 dev）/ `kind: 'github'`（线上），通过 `NODE_ENV` 切换
- GitHub 仓库：`weheh2233/anime-blog`，使用 **GitHub App**（非 OAuth App）授权
- 编辑器：Markdoc 编辑器，支持标题/描述/日期/专区/标签/封面图/草稿/富文本
- 封面图上传到 `public/images/`，Markdoc 正文图片也上传到 `public/images/`
- 构建时始终加载（无 `isDev` 守卫）

#### Vercel 环境变量

| 变量 | 说明 |
|------|------|
| `KEYSTATIC_GITHUB_CLIENT_ID` | GitHub App 的 Client ID |
| `KEYSTATIC_GITHUB_CLIENT_SECRET` | 对应的 Client Secret |
| `KEYSTATIC_SECRET` | `crypto.randomBytes(32).toString('hex')` 生成的 64 位字符串 |

> ⚠️ Rolldown 打包时会将 `import.meta.env.KEYSTATIC_*` 优化为 `undefined`，需在 `astro.config.mjs` 的 `vite.define` 中映射到 `process.env.KEYSTATIC_*` 以在运行时读取。详见 `astro.config.mjs` 的 `vite.define` 配置。

### 博客列表客户端筛选

`src/pages/blog/index.astro` 内联 `<script>`：
- 拦截 ZoneFilter 点击事件（`e.preventDefault()`）
- `window.history.pushState` 更新 URL 但不触发导航
- `.post-item[data-zone]` 属性控制显示/隐藏
- 同步更新 `zone-pill` 高亮样式
- `popstate` 事件监听浏览器前进/后退

---

## 十四、实际文章列表（19 篇）

| 文章 | 专区 | 格式 |
|------|------|------|
| 博客搭建完成 | 编程 | .md |
| Anime 2026 Summer Mid | 娱乐 | .md |
| 2026 夏季新番推荐 | 娱乐 | .md |
| CI/CD Pipeline Guide | 编程 | .md |
| 骑行入门指南 | 运动 | .md |
| Desk Setup Makeover | 生活 | .md |
| Discord Bot 项目 | 编程 | .md |
| Git 进阶技巧 | 编程 | .md |
| Indie Games 2026 | 娱乐 | .md |
| Java Virtual Threads | 编程 | .md |
| 跑步成瘾 | 运动 | .md |
| Rust Ownership & Borrowing | 编程 | .md |
| Spring Boot 3 Features | 编程 | .md |
| Tech Trends 2026 | 编程 | .md |
| 5K 训练计划 | 运动 | .md |
| 程序员的健康管理 | 生活 | .md |
| Notion 知识库 | 学习 | .md |
| TypeScript Generics | 编程 | .md |
| test_nb（测试） | 编程 | .mdoc |
| football（测试） | 编程 | .mdoc |

---

## 十五、已知问题 / TODO

### 历史遗留
- [ ] Giscus repo-id / category-id 需要替换为真实值
- [ ] RSS 尚未实现（Footer 中链接指向 `/rss.xml` 但未生成）
- [ ] 相关文章推荐未实现
- [ ] 图片灯箱未实现
- [ ] SITE.repo 指向 `yourusername/anime-blog`

### 技术债务
- [ ] `DESIGN_CONVENTIONS.md` 中目录过时（缺少 MouseTrail、TextBounce、SplashScreen 等组件）
- [ ] `DESIGN_CONVENTIONS.md` 仍引用 Astro 5.x
- [ ] `ArticleCard` 的 slug 处理只用 `.replace(/\.md$/, '')`，不处理 `.mdoc` 后缀
- [ ] `lib/utils.ts` 中 `ZONES` 与 `consts.ts` 中 `ZONES` 重复定义
- [ ] `GiscusComments.astro` 的 `GISCUS_REPO_ID` 和 `GISCUS_CATEGORY_ID` 是占位值
- [ ] `lib/utils.ts` 中 `ArticleMeta` 接口与 `content.config.ts` 的 schema 不统一（缺少 `draft` 字段）
- [ ] `DESIGN_CONVENTIONS.md` 仍引用 Astro 5.x，目录缺失 SplashScreen / SearchModal / MouseTrail / TextBounce / GiscusComments 等组件
