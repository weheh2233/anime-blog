# 个人博客 — 完整设计约定

> **身份**：Java 后端开发者，喜欢日漫，前端 AI 辅助  
> **风格**：亮色为主 · 藏蓝系 · 二次元技术风（"二次元头像写代码最狠"）  
> **原则**：不萌不粉，偏硬朗沉稳 · 用户自放图片，框架预留位  
> **成本**：零服务器费用，全免费服务

---

## 一、总体架构

```
浏览器打开 /keystatic → 写文章 → git commit
    │
    ▼
GitHub 仓库 (存 Markdown + 图片)
    │ webhook
    ▼
Vercel 免费托管（Astro 构建 → 静态 HTML + CDN）
    │
    ▼
第三方免费服务:
  ├── 评论: Giscus（GitHub Discussions，需 GitHub 登录）
  ├── 搜索: Pagefind（构建时静态索引）
  ├── 访问量: 不蒜子（一行 script，PV/UV 计数）
  └── GitHub API: 自动拉取项目展示
```

---

## 二、技术栈

| 层级 | 选型 |
|------|------|
| 框架 | Astro 5.x |
| 样式 | Tailwind CSS v4 |
| CMS | Keystatic（网页编辑器，Git 存储） |
| 动画 | CSS 3D transforms + Intersection Observer（零依赖）|
| 评论 | Giscus |
| 搜索 | Pagefind |
| 代码高亮 | Shiki（Astro 内置） |
| 访问统计 | 不蒜子 |
| 部署 | Vercel |

---

## 三、配色系统

### 亮色模式（默认）

| 令牌 | 色值 | 用途 |
|------|------|------|
| `--blog-bg` | `#f8f9fa` | 页面背景（用户可放图） |
| `--blog-surface` | `#ffffff` | 卡片/面板表面 |
| `--blog-text-primary` | `#11181c` | 主文字 |
| `--blog-text-secondary` | `#6b7280` | 次要文字 |
| `--blog-text-tertiary` | `#9ca3af` | 占位/禁用文字 |
| `--blog-accent` | `#3b4a6b` | **主色（藏蓝）** |
| `--blog-accent-hover` | `#4a5d82` | 主色悬停 |
| `--blog-accent-light` | `#e8ecf3` | 主色浅底 |
| `--blog-accent-lighter` | `#f0f3f7` | 主色更浅底 |
| `--blog-border` | `#e5e7eb` | 边框 |
| `--blog-border-light` | `#f0f1f3` | 浅边框 |
| `--blog-glass` | `rgba(255,255,255,0.75)` | 毛玻璃背景 |
| `--blog-shadow` | `0 1px 3px rgba(0,0,0,0.04)` | 卡片阴影 |
| `--blog-shadow-hover` | `0 8px 24px rgba(0,0,0,0.08)` | 卡片悬停阴影 |
| `--blog-radius-sm` | `6px` | 小圆角 |
| `--blog-radius-md` | `10px` | 中圆角 |
| `--blog-radius-lg` | `12px` | 大圆角 |
| `--blog-radius-xl` | `16px` | 特大圆角（B 站式卡片） |
| `--blog-radius-full` | `9999px` | 全圆角（pills） |

### 暗色模式（切换）

| 令牌 | 色值 |
|------|------|
| `--blog-bg` | `#13161c` |
| `--blog-surface` | `#1a1d27` |
| `--blog-text-primary` | `#e1e4e8` |
| `--blog-text-secondary` | `#8b95a5` |
| `--blog-text-tertiary` | `#636e7e` |
| `--blog-accent` | `#5a7a9e` |
| `--blog-accent-light` | `#1e2533` |
| `--blog-border` | `#2a2d3a` |
| `--blog-glass` | `rgba(26,29,39,0.75)` |

> 所有颜色通过 `:root` / `.dark` 切换 CSS 变量，禁止硬编码。

---

## 四、排版

| 属性 | 取值 |
|------|------|
| 中文字体 | `Noto Sans SC`, `PingFang SC`, system-ui |
| 等宽字体 | `JetBrains Mono`, `Fira Code`, monospace |
| CSS 变量 | `--blog-font-sans` / `--blog-font-mono` |

---

## 五、间距（4px 基准）

```
4 / 8 / 12 / 16 / 20 / 24 / 32 / 48 / 64 px
```

---

## 六、页面结构

```
├── 首页 (/)
│   ├── Hero（标题 + 3D 螺旋装饰 + 用户图片位）
│   ├── 最新文章（4–5 篇 Bilibili 式卡片）
│   └── 侧边栏：友链 / 最近文章 / 访客位置
├── 博客列表 (/blog)
│   ├── 全部文章（专区筛选条 + 分页）
│   └── 侧边栏（同上）
├── 文章详情 (/blog/[slug])
│   ├── 阅读进度条
│   ├── Hero 大图 / 内容 / 代码高亮
│   └── Giscus 评论区（底部）
├── 项目展示 (/projects)
│   ├── GitHub 仓库卡片（API 自动拉取）
│   └── 手动添加项目条目
├── 友链 (/links)
├── 留言板 (/guestbook)  ← 同一套 Giscus
├── 关于 (/about)
│   ├── 头像 + 介绍
│   ├── 技能标签
│   └── 喜欢的作品（图位）
├── 标签页 (/tags)
│   ├── 所有标签聚合 (/tags)
│   └── 按标签筛选 (/tags/[tag])
├── 404 页
```

### 布局骨架

```
┌── 固定顶部导航 (h-14) ─────────────────┐
│  LOGO  首页  博客  项目  关于  ☀/🌙  🔍 │
├── 专区筛选横向滚动条 ────────────────────┤
│  [全部][学习][编程][生活][运动][娱乐][社交] │
├── 主区 ────────────────┬── 侧边栏 ─────┤
│                        │  友链          │
│  页面核心内容           │  最近文章       │
│                        │  访客位置       │
└────────────────────────┴───────────────┘
┌── Footer ──────────────────────────────┐
│  © 2026 · RSS · GitHub · 🌍 访客位置   │
└────────────────────────────────────────┘
```

- **侧边栏**：首页 & 博客列表显示，文章详情隐藏
- **专区筛选**：独立一行，非导航下拉，始终可见
- **移动端**：侧边栏移至主区下方，导航折叠为汉堡菜单

---

## 七、导航栏

- 固定顶部，毛玻璃效果（`backdrop-filter: blur(12px)`）
- 左：Logo / 站点名
- 中：首页 · 博客 · 项目 · 关于
- 右：暗色/亮色切换 · 搜索按钮（Ctrl+K）
- 激活项高亮使用 `--blog-accent`

---

## 八、专区筛选条（ZoneFilter）

- 独立一行位于导航下方，水平 flex-nowrap 容器
- 每个专区为圆角 pill（`--blog-radius-full`）
- 选中态：`--blog-accent` 底色 + 白色文字
- 非选中态：`--blog-accent-light` 底色
- 交互：
  - 默认显示部分 pills，渐隐遮罩（`mask-image`）裁切右侧
  - 悬停时遮罩移除，展示全部，横向可滚动
  - 点击后跳转 `/blog?zone=xxx` 筛选

---

## 九、文章卡片（Bilibili 式）

```
┌─────────────────────┐
│  ┌─────────────────┐│
│  │   16:9 缩略图    ││  ← 用户放图 / 占位符
│  └─────────────────┘│
│  [专区] 日期          │
│  标题（line-clamp 2） │
│  描述（line-clamp 2） │
└─────────────────────┘
```

- `--blog-radius-xl`（16px）圆角
- `--blog-surface` 白底 + `--blog-shadow`
- 悬停：`translateY(-4px)` + `--blog-shadow-hover`
- 缩略图悬停：`scale(1.05)` 微放大

---

## 十、功能清单

### Core（本轮）

| # | 功能 | 说明 |
|---|------|------|
| 1 | 写文章 / 展示 | Keystatic CMS → Markdown，含 heroImage |
| 2 | 标签系统 | 多标签、标签页聚合、按标签筛选 |
| 3 | 暗色/亮色模式 | 系统偏好 + 手动切换 |
| 4 | 页面过渡动画 | Astro View Transitions |
| 5 | 代码高亮 | Shiki，暗/亮双主题 |
| 6 | 阅读进度条 | 文章顶部进度指示 |
| 7 | 评论系统 | Giscus（GitHub Discussions） |
| 8 | 站内搜索 | Pagefind（Ctrl+K 唤起） |
| 9 | 访问统计 | 不蒜子（PV/UV） |
| 10 | 项目展示 | GitHub API 自动拉取 + 手动 |
| 11 | 友链 | 放首页侧边栏 |
| 12 | 3D 螺旋 Hero 装饰 | CSS 3D，零 JS |

### 以后再加

| # | 功能 |
|---|------|
| — | RSS 订阅 |
| — | 相关文章推荐 |
| — | 图片灯箱 |
| — | 键盘快捷键 |
| — | 访客地图 |

---

## 十一、文章 Frontmatter

```yaml
---
title: "文章标题"
description: "一句话描述"
publishDate: 2026-07-19
zone: "编程"                     # 专区：学习/编程/生活/运动/娱乐/社交
tags: ["Spring Boot", "数据库"]
heroImage: "./images/xxx.jpg"    # 可选，文章封面图
draft: false                     # 草稿不发布
---
```

---

## 十二、项目目录结构

```
anime-blog/
├── src/
│   ├── pages/
│   │   ├── index.astro
│   │   ├── blog/
│   │   │   ├── index.astro
│   │   │   └── [...slug].astro
│   │   ├── tags/
│   │   │   ├── index.astro
│   │   │   └── [tag].astro
│   │   ├── projects.astro
│   │   ├── about.astro
│   │   └── 404.astro
│   ├── components/
│   │   ├── Header.astro
│   │   ├── Footer.astro
│   │   ├── Sidebar.astro
│   │   ├── ZoneFilter.astro
│   │   ├── ArticleCard.astro
│   │   ├── HeroSection.astro
│   │   ├── ScrollReveal.astro
│   │   └── ThemeToggle.astro
│   ├── layouts/
│   │   └── BaseLayout.astro
│   ├── styles/
│   │   └── global.css
│   ├── lib/
│   │   └── utils.ts
│   ├── content/
│   │   └── posts/           ← Keystatic 写入
│   └── consts.ts            ← 专区、站点配置
├── public/
│   └── images/              ← 用户图片
├── astro.config.mjs
├── keystatic.config.ts
├── DESIGN_CONVENTIONS.md    ← 本文件
└── package.json
```

---

## 十三、动画系统

### 类型与开销分级

| 级别 | 技术 | 场景 |
|------|------|------|
| 零开销 | CSS transitions / keyframes | 悬停、简单过渡 |
| 极低 | CSS 3D transforms | 螺旋、翻转装饰 |
| 低 | Intersection Observer + CSS | 滚动入场（首选方案） |
| 低 | Canvas 2D + 对象池 | 粒子效果（备用） |
| 中 | GSAP + ScrollTrigger | 复杂滚动序列（备用） |

### 动画时长

| 类型 | 时长 |
|------|------|
| 微交互（按钮、切换） | 100–150ms |
| 悬停反馈 | 200ms |
| 页面过渡 | 300–400ms |
| ScrollReveal 入场 | 600–800ms |
| 3D 螺旋旋转一周 | 8–12s |

### ScrollReveal

- 初始：`opacity: 0; transform: translateY(40px) scale(0.95)`
- 可见：`opacity: 1; transform: translateY(0) scale(1)`
- 错开延迟：`0.1s / 0.2s / 0.3s`
- 阈值：`threshold: 0.1, rootMargin: '0 0 -50px 0'`
- 一次性触发（`observer.unobserve()`）

### 3D 螺旋

- 纯 CSS 3D，12–20 条，`perspective: 700px`
- `pointer-events: none`, 透明度 0.1–0.15

### 页面过渡

- Astro View Transitions，预设 `slide` / `fade`
- 在 `astro:page-load` 中重新绑定滚动动画

### 性能原则

- 动画只用 `transform` 和 `opacity`
- 粒子必须对象池 + DPR ≤ 1.5
- 装饰层 `pointer-events: none`
- 始终提供 `prefers-reduced-motion` 降级

---

## 十四、专区划分

| 专区 | key | 内容 |
|------|-----|------|
| 学习 | study | 学习笔记、教程 |
| 编程 | coding | 技术博客、项目心得 |
| 生活 | life | 日常分享 |
| 运动 | sports | 运动相关 |
| 娱乐 | entertainment | 动漫 / 音乐 / 游戏 |
| 社交 | social | 友链页、留言板 |

URL：`/blog?zone=编程` 或 `/blog/zone/编程`

---

## 十五、实施路线

### Phase 1：骨架
1. Astro + Tailwind 项目初始化 ✓（已完成）
2. 基础 Layout（Header / Footer / 暗色模式 / 侧边栏）
3. 专区筛选条
4. 首页 Hero（3D 螺旋 + 用户图位 + 最新文章 + 侧边栏）
5. 博客列表 + 文章详情（Bilibili 式卡片 + 代码高亮）
6. 标签系统

### Phase 2：交互
7. Giscus 评论
8. Pagefind 搜索
9. 阅读进度条
10. 不蒜子统计

### Phase 3：扩展
11. 项目展示页（GitHub API + 手动条目）
12. 关于页
13. 友链 / 留言板
14. 404 页

### Phase 4：部署
15. GitHub 仓库初始化
16. Vercel 连接 + 自动部署

---

## 十六、验证清单

- [ ] `astro dev` 本地预览正常
- [ ] `/keystatic` 后台创建测试文章
- [ ] `astro build` 构建成功
- [ ] Giscus 评论区正常加载
- [ ] Pagefind 搜索可用
- [ ] 暗色/亮色切换正常
- [ ] 专区筛选交互正常
- [ ] ScrollReveal 动画正常
- [ ] 3D 螺旋正常旋转
- [ ] Vercel 部署成功

---

## 十七、图片位提醒

以下位置需要用户自放图片，代码中预留占位符或提示：

- [ ] 首页 Hero 装饰图
- [ ] 文章卡片 hero 缩略图（每篇）
- [ ] 文章详情 hero 大图（每篇）
- [ ] 关于页头像
- [ ] 关于页"喜欢的作品"（3 格）
- [ ] 项目截图

---

## 十八、参考

- [Astro View Transitions](https://docs.astro.build/en/guides/view-transitions/)
- [GSAP](https://gsap.com/)
- [motion.dev](https://motion.dev/)
- [Pagefind](https://pagefind.app/)
- [Giscus](https://giscus.app/)
- [Tailwind CSS](https://tailwindcss.com/)
