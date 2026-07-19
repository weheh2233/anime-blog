# Project Master — Anime Blog

> 全面掌握项目架构、文件职责、实现细节与已知问题。
> 用途：快速恢复上下文、定位文件、理解路由和数据流。

---

## 一、项目概览

| 项目 | 值 |
|------|-----|
| 名称 | anime-blog（代码与纸飞机） |
| 框架 | Astro 5.x (v5.18.2) |
| 样式 | Tailwind CSS v4 (v4.3.3) + PostCSS |
| CMS | Keystatic（本地 Git 存储，`/keystatic`） |
| 部署 | Vercel 静态站点 |
| 域名 | `https://anime-blog.vercel.app` |
| 包管理器 | npm |
| 语言 | TypeScript / JavaScript |

### 构建配置

- **astro.config.mjs** — 无 Tailwind Vite 插件，使用 PostCSS
- **postcss.config.mjs** — `@tailwindcss/postcss` 插件
- **Tailwind 入口** — `src/styles/global.css` 中 `@import "tailwindcss"`

---

## 二、目录结构

```
anime-blog/
├── src/
│   ├── pages/                  # 路由页面
│   │   ├── index.astro         # 首页
│   │   ├── blog/
│   │   │   ├── index.astro     # 博客列表
│   │   │   └── [...slug].astro # 文章详情
│   │   ├── tags/
│   │   │   ├── index.astro     # 标签聚合
│   │   │   └── [tag].astro     # 按标签筛选
│   │   ├── projects.astro      # 项目展示
│   │   ├── about.astro         # 关于（带头像发光光环）
│   │   └── 404.astro           # 404
│   ├── components/             # 组件
│   │   ├── SplashScreen.astro  # 开屏动画（动态创建 overlay）
│   │   ├── Header.astro        # 顶部导航
│   │   ├── Footer.astro        # 页脚
│   │   ├── Sidebar.astro       # 侧边栏
│   │   ├── HeroSection.astro   # 首页 Hero（3D 旋转卡片墙）
│   │   ├── ArticleCard.astro   # 文章卡片（3D 倾斜 + 光泽扫过）
│   │   ├── SearchModal.astro   # Pagefind 搜索弹窗
│   │   ├── ScrollReveal.astro  # 滚动入场动画
│   │   ├── ZoneFilter.astro    # 专区筛选条
│   │   ├── GiscusComments.astro# 评论区
│   │   ├── ReadingProgress.astro# 阅读进度条
│   │   ├── ThemeToggle.astro   # 主题切换（备用组件）
│   │   ├── MouseTrail.astro    # 鼠标粒子轨迹
│   │   ├── TextBounce.astro    # 文字弹跳动画
│   │   └── HeroSection.astro   # Hero（3D 旋转卡片）
│   ├── layouts/
│   │   └── BaseLayout.astro    # 全局布局（关键！）
│   ├── styles/
│   │   └── global.css          # Tailwind 入口 + 主题 CSS 变量
│   ├── content/
│   │   └── posts/              # Markdown 文章（Keystatic 写入）
│   ├── consts.ts               # 站点常量、导航、专区
│   ├── content.config.ts       # Astro Content Collections schema
│   └── lib/
│       └── utils.ts            # 工具函数（formatDate 等）
├── public/
│   └── images/                 # 图片资源
├── astro.config.mjs
├── keystatic.config.ts
├── postcss.config.mjs
└── DESIGN_CONVENTIONS.md       # 设计约定
```

---

## 三、路由

| 路由 | 文件 | 说明 |
|------|------|------|
| `/` | `pages/index.astro` | 首页：Hero + 专区筛选 + 文章卡片网格（18 篇） |
| `/blog` | `pages/blog/index.astro` | 博客列表（全部文章） |
| `/blog/[slug]` | `pages/blog/[...slug].astro` | 文章详情（Content Collection 动态路由） |
| `/tags` | `pages/tags/index.astro` | 标签聚合页 |
| `/tags/[tag]` | `pages/tags/[tag].astro` | 按标签筛选文章 |
| `/projects` | `pages/projects.astro` | 项目展示 |
| `/about` | `pages/about.astro` | 关于页（头像 + 发光环） |
| `/404` | `pages/404.astro` | 404 |
| `/keystatic` | Keystatic CMS | 开发模式可用，生产构建不包含 |

---

## 四、数据流

### 文章内容

```
Keystatic (UI 编辑器)
  → 写入 src/content/posts/*.md
    → Astro Content Collections (content.config.ts 定义 schema)
      → getCollection('posts') 获取文章列表
        → 页面渲染 (slug 路由、列表页、标签筛选)
```

### 文章 schema

```ts
interface Post {
  title: string;
  description: string;
  publishDate: Date;
  zone?: string;       // 学习/编程/生活/运动/娱乐/社交
  tags: string[];      // 默认 []
  heroImage?: string;  // 封面图路径
  draft: boolean;      // 默认 false
}
```

### 专区筛选

常量定义在 `consts.ts`：`全部`、`学习`、`编程`、`生活`、`运动`、`娱乐`、`社交`
URL 参数 `?zone=编程` 进行筛选。

---

## 五、BaseLayout.astro — 心脏文件

所有页面共用此布局。它负责：

### 5.1 模板结构

```
<head>
  - meta / title / fonts
  - __pageLoads / __isHardReload (is:inline)
</head>
<body>
  - vt-loading (加载指示器条)
  - SplashScreen (开屏动画)
  - SearchModal (搜索弹窗)
  - MouseTrail (鼠标粒子)
  - Header (导航)
  - main content slot + sidebar
  - Footer
  - busuanzi 统计 script
  - vt-flip + vt-flip-body (浮动数字)
  - flip 波浪弹跳 (is:inline)
  - 主题 script (is:inline)
  - View Transitions 事件 (module script)
  - <style> (加载指示器 + 浮动数字 CSS)
</body>
```

### 5.2 View Transitions 事件（module script）

**`astro:before-preparation`**
- 设 `window.__splashBlocked = true`
- `sessionStorage.setItem('splash_blocked', '1')`
- 显示顶部 `vt-loading` 加载条

**`astro:after-swap`**
- 隐藏 `vt-loading`

**`astro:page-load`**
- 隐藏 `vt-loading`

### 5.3 浮动数字波浪弹跳（is:inline script）

位置：`vt-flip-body` 元素后紧跟的 `<script is:inline>`。

逻辑：
1. 检查 `window.__splashBlocked` — 只有 View Transition 时才为 `true`
2. 从 `sessionStorage.getItem('flip_seq')` 读取序号，轮转 1→9
3. 清空 `vt-flip-body`，逐字符创建 `<span>`，设自定义属性 `--i` 控制波浪延迟
4. 加 `active` class 触发 CSS 波浪弹跳动画
5. 900ms 后 `setTimeout` 自动隐藏，恢复默认 `✦` 文本

**为什么不放在 module 脚本里？** 因为 module 脚本的 `astro:after-swap` 事件触发时机不稳定，改用 `is:inline` 确保每次页面渲染（含 View Transition）都执行。

### 5.4 开屏拦截机制

三层拦截，确保 View Transition 时不触发 SplashScreen：

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

---

## 六、SplashScreen.astro — 开屏动画

### 技术方案

- **不放在静态 HTML 中**：overlay 由 `is:inline` 脚本 **动态创建**，播完后 `remove()` 从 DOM 彻底删除
- 这样 View Transition 时 DOM 中无 overlay 元素，不可能闪烁
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

### 样式关键点

- `.splash-overlay { display: none; }`（无 `!important`，因为 overlay 不在静态 HTML）
- `.splash-overlay.playing { display: flex; }`
- 背景色 `#08090d`（深色）
- 中心文字 `color: #fff` + 蓝白色 text-shadow 发光

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
- 3D 旋转卡片墙：16 张卡片绕 Y 轴旋转，每张有亚克力玻璃效果（`backdrop-filter: blur(8px)`）
- 卡片图片 5 张循环使用，CSS `filter` 衍生 8 种变体
- 内外环交替：奇数卡片 `translateZ(120px)`，偶数 `translateZ(200px)`

### 7.3 ArticleCard.astro

Bilibili 式文章卡片：
- 16:9 缩略图 + 内容区
- 3D 鼠标倾斜效果（`mousemove` → `rotateX`/`rotateY`）
- 悬停：光泽扫过（`shineSweep` 动画）、Mini 3D 螺旋、accent 色 border 发光
- `astro:page-load` 重新绑定 3D 倾斜

### 7.4 SearchModal.astro

Pagefind 搜索弹窗：
- `Ctrl+K` 或点击搜索按钮打开
- 动态加载 `/pagefind/pagefind.js`（仅生产构建有索引）
- 搜索结果渲染 + 键盘导航（↑↓→Enter→Escape）
- View Transition 后自动关闭

### 7.5 ScrollReveal.astro

滚动入场动画：
- CSS transition（`opacity` + `transform`）
- IntersectionObserver 一次性触发
- 支持 4 个延迟级别（`reveal-delay-1~3`）
- View Transition 后 `astro:page-load` 重新绑定

### 7.6 ZoneFilter.astro

专区筛选条：
- 水平 flex-nowrap + mask-image 右侧渐变隐藏
- 悬停时 mask-image 移除展示全部
- 点击跳转 `/blog?zone=xxx`

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
- 配置：repo-id / category-id 需要替换
- 主题自适应 `preferred_color_scheme`

---

## 八、Tailwind CSS 特殊说明

### 历史问题

Tailwind CSS v4 + Astro 5 的集成存在兼容性问题：

| 方案 | 结果 |
|------|------|
| `@tailwindcss/vite` v4.3.3 | ❌ 不生成工具类（dev + build 均失效） |
| `@tailwindcss/postcss` v4.3.3 | ✅ 正常工作 |

**当前方案**：PostCSS 方式。`postcss.config.mjs` 配置 `@tailwindcss/postcss`，`astro.config.mjs` 中无任何 Tailwind 插件。

**已验证**：Tailwind 工具类（`flex`、`grid`、`px-4`、`text-sm` 等）在 dev 输出中正常出现。

---

## 九、主题系统

### 亮色/暗色切换

- 默认亮色，CSS 变量在 `:root` 定义
- 暗色在 `.dark` 选择器下覆盖
- 切换：`localStorage.setItem('blog-theme', 'dark'/'light')` + `<html class="dark">`
- 恢复：`<script is:inline>` 检查 `localStorage` 并在渲染前设置 class，防止 FOUC

### 主题色系

- 主色：藏蓝 `--blog-accent: #3b4a6b`
- 亮色背景：米白 `--blog-bg: #f5f2ed`
- 暗色背景：深灰蓝 `--blog-bg: #13161c`
- 暗色 accent：浅蓝灰 `--blog-accent: #5a7a9e`

---

## 十、View Transitions 详解

### 启用方式

`<meta name="astro-view-transitions-enabled" content="true" />` 在 BaseLayout head 中。

### 生命周期事件

| 事件 | 用途 | 本项目的 handler |
|------|------|-----------------|
| `astro:before-preparation` | 导航开始前，最早的事件 | 设 `__splashBlocked` / `sessionStorage` / 显示 `vt-loading` |
| `astro:after-swap` | DOM 替换完成后 | 隐藏 `vt-loading` |
| `astro:page-load` | 新页面脚本/资源加载完成 | 隐藏 `vt-loading` |

### 浮动数字动画

点击链接 → `astro:before-preparation`（模块脚本设旗帜）
→ 新页面 HTML 加载 → 新页面 `is:inline` 脚本执行
→ 检测 `__splashBlocked === true` → 构建波浪弹跳字符
→ 900ms 后自动隐藏

### 已知注意事项

- View Transition 时 **head 的 is:inline 脚本不重新执行**（head 是 merge 不是 replace）
- **body 的 is:inline 脚本重新执行**（body 被 replace）
- **module 脚本不重新执行**（只执行一次）
- 所以 `__pageLoads` 在 head 里只加一次，不能在 View Transition 中递增
- 这是 `__splashBlocked` 旗帜方案存在的理由：模块脚本监听 `astro:before-preparation` 来设置

---

## 十一、关于页 — 头像发光光环

- 使用 `conic-gradient` 渐变环 + CSS `mask: radial-gradient()` 切出中心圆孔
- `::after` 伪元素 + `filter: blur(12px)` 制造辉光（仿 `103.CSS3发光渐变加载环`）
- 旋转动画 `ringSpin 2s linear infinite`
- prefers-reduced-motion 时隐藏

---

## 十二、Keystatic CMS

- 地址：`/keystatic`（仅 dev 模式）
- 存储：`kind: 'local'`（Git 同步）
- 编辑器：内置，支持标题/描述/日期/专区/标签/封面图/草稿
- 不包含在生产构建中（`astro.config.mjs` 条件引用）

---

## 十三、依赖项

### dependencies
- `@astrojs/react` ^6.0.1
- `@keystatic/astro` ^5.2.0, `@keystatic/core` ^0.5.51
- `astro` ^5.0.0
- `react` ^19.2.7, `react-dom` ^19.2.7

### devDependencies
- `@tailwindcss/postcss` ^4.3.3
- `@tailwindcss/vite` ^4.0.0（保留未使用）
- `postcss` ^8.5.20
- `tailwindcss` ^4.0.0
- `pagefind` ^1.5.2

---

## 十四、已知问题 / TODO

### 历史遗留
- [ ] Giscus repo-id / category-id 需要替换为真实值
- [ ] RSS 尚未实现
- [ ] 相关文章推荐未实现
- [ ] 图片灯箱未实现

### 技术债务
- [ ] `DESIGN_CONVENTIONS.md` 中的目录已过时（缺少 MouseTrail 等新组件）
- [ ] `GiscusComments.astro` 的 `GISCUS_REPO_ID` 和 `GISCUS_CATEGORY_ID` 是占位值
- [ ] Footer 中的 RSS 链接指向 `/rss.xml` 但尚未生成
- [ ] SITE.repo 指向 `yourusername/anime-blog`
