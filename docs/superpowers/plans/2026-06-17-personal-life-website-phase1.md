# 个人网站「记录我的一生」· 第一阶段 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 搭建一个纯静态 Astro 个人站第一阶段:共享内容数据层 + 双主题换肤 + 首页枢纽 + 关于/时间轴/博客/项目四个核心模块,可上线。

**Architecture:** Astro 6 静态站。内容用 Markdown(content collections + schema 校验)。外观靠 CSS 变量主题(`data-theme`,localStorage 持久化)。`src/config/site.ts` 用开关控制模块启用。纯函数(时间轴排序/筛选、主题元数据)用 Vitest TDD;页面用 `astro check` + `astro build` + 浏览器冒烟验证。

**Tech Stack:** Astro 6、TypeScript、Vitest、(部署)Netlify。无后台、无数据库。

参考设计文档:`docs/superpowers/specs/2026-06-17-personal-life-website-design.md`

---

## 文件结构(本阶段创建/修改)

```
package.json                      依赖与脚本
astro.config.mjs                  Astro 配置(site、集成)
tsconfig.json                     TS 配置(strict)
vitest.config.ts                  Vitest 配置
src/
  config/site.ts                  站点配置:名称、tagline、导航、默认主题、模块开关
  content.config.ts               内容集合定义 + frontmatter schema(about/timeline/blog/projects)
  content/
    about/me.md                   关于我(单条)
    timeline/2019-college.md …    人生时间轴事件(多条)
    blog/hello.md …               博客文章
    projects/sample.md …          项目
  lib/
    timeline.ts                   纯函数:sortEventsByDate / filterEventsByType / TIMELINE_TYPES
    themes.ts                     纯数据:THEMES、DEFAULT_THEME、isTheme
  styles/
    themes.css                    [data-theme="cozy"|"editorial"] 变量
    global.css                    基础样式(消费变量)
  layouts/
    Base.astro                    HTML 骨架:head、防闪烁主题脚本、TopNav、footer、<slot/>
  components/
    TopNav.astro                  顶部导航(读 site 配置)
    ThemeSwitcher.astro           主题切换器(客户端脚本:切 data-theme + 存 localStorage)
    Hero.astro                    首页 hero(头像 + 一句话)
    ModuleCard.astro              首页/网格卡片(支持 disabled 灰显)
    EventList.astro               时间轴渲染 + 类型筛选(含客户端筛选脚本)
    ProjectCard.astro             项目卡片
  pages/
    index.astro                   首页枢纽
    about.astro                   关于我
    timeline.astro                人生时间轴
    blog/index.astro              博客列表
    blog/[...slug].astro          博客详情
    projects/index.astro          项目列表
    projects/[...slug].astro      项目详情
tests/
    timeline.test.ts              lib/timeline 单测
    themes.test.ts                lib/themes 单测
public/
    favicon.svg                   占位站点图标
    img/avatar.svg                占位头像
netlify.toml                      部署配置
```

---

## Task 1: 脚手架 — 初始化 Astro 项目

**Files:**
- Create: `package.json`, `astro.config.mjs`, `tsconfig.json`, `src/pages/index.astro`, `public/favicon.svg`

- [ ] **Step 1: 写 package.json**

```json
{
  "name": "hello-me",
  "type": "module",
  "version": "0.1.0",
  "scripts": {
    "dev": "astro dev",
    "build": "astro build",
    "preview": "astro preview",
    "check": "astro check",
    "test": "vitest run"
  },
  "dependencies": {
    "astro": "^6.4.7"
  },
  "devDependencies": {
    "@astrojs/check": "^0.9.9",
    "typescript": "^5.6.3",
    "vitest": "^2.1.8"
  }
}
```

- [ ] **Step 2: 写 astro.config.mjs**

```js
import { defineConfig } from 'astro/config'

export default defineConfig({
  site: 'https://example.com', // 部署后改成真实域名
})
```

- [ ] **Step 3: 写 tsconfig.json**

```json
{
  "extends": "astro/tsconfigs/strict",
  "include": [".astro/types.d.ts", "**/*"],
  "exclude": ["dist"]
}
```

- [ ] **Step 4: 写占位首页 `src/pages/index.astro`**

```astro
---
---
<html lang="zh-CN">
  <head><meta charset="utf-8" /><title>Hello</title></head>
  <body><h1>Hello Island</h1></body>
</html>
```

- [ ] **Step 5: 写 `public/favicon.svg`**

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><text y="26" font-size="26">🏝</text></svg>
```

- [ ] **Step 6: 安装依赖**

Run: `npm install`
Expected: 安装成功,生成 `node_modules` 与 `package-lock.json`,无 error。

- [ ] **Step 7: 验证构建**

Run: `npm run build`
Expected: `astro build` 成功,生成 `dist/`,无 error。

- [ ] **Step 8: Commit**

```bash
git add package.json astro.config.mjs tsconfig.json src/pages/index.astro public/favicon.svg package-lock.json
git commit -m "chore: scaffold Astro project"
```

---

## Task 2: 纯函数 — 时间轴排序/筛选(TDD)

**Files:**
- Create: `vitest.config.ts`, `tests/timeline.test.ts`, `src/lib/timeline.ts`

- [ ] **Step 1: 写 vitest 配置**

```ts
// vitest.config.ts
import { defineConfig } from 'vitest/config'
export default defineConfig({ test: { environment: 'node', include: ['tests/**/*.test.ts'] } })
```

- [ ] **Step 2: 写失败测试 `tests/timeline.test.ts`**

```ts
import { describe, it, expect } from 'vitest'
import { sortEventsByDate, filterEventsByType, TIMELINE_TYPES } from '../src/lib/timeline'

type E = { date: Date; type: string; title: string }
const evs: E[] = [
  { date: new Date('2022-03-01'), type: 'project', title: 'b' },
  { date: new Date('2019-09-01'), type: 'life', title: 'a' },
  { date: new Date('2023-07-01'), type: 'place', title: 'c' },
]

describe('timeline', () => {
  it('sorts newest first', () => {
    const r = sortEventsByDate(evs)
    expect(r.map((e) => e.title)).toEqual(['c', 'b', 'a'])
  })
  it('does not mutate input', () => {
    const copy = [...evs]
    sortEventsByDate(evs)
    expect(evs).toEqual(copy)
  })
  it('filters by type, "all" returns everything', () => {
    expect(filterEventsByType(evs, 'project').map((e) => e.title)).toEqual(['b'])
    expect(filterEventsByType(evs, 'all')).toHaveLength(3)
  })
  it('exposes the known types incl. all', () => {
    expect(TIMELINE_TYPES[0]).toBe('all')
    expect(TIMELINE_TYPES).toContain('life')
  })
})
```

- [ ] **Step 3: 运行测试,确认失败**

Run: `npx vitest run tests/timeline.test.ts`
Expected: FAIL（找不到 `../src/lib/timeline`)

- [ ] **Step 4: 实现 `src/lib/timeline.ts`**

```ts
export const TIMELINE_TYPES = ['all', 'life', 'project', 'place', 'music', 'milestone'] as const
export type TimelineType = (typeof TIMELINE_TYPES)[number]

export function sortEventsByDate<T extends { date: Date }>(events: T[]): T[] {
  return [...events].sort((a, b) => b.date.getTime() - a.date.getTime())
}

export function filterEventsByType<T extends { type: string }>(events: T[], type: string): T[] {
  return type === 'all' ? events : events.filter((e) => e.type === type)
}
```

- [ ] **Step 5: 运行测试,确认通过**

Run: `npx vitest run tests/timeline.test.ts`
Expected: PASS（4 个用例)

- [ ] **Step 6: Commit**

```bash
git add vitest.config.ts tests/timeline.test.ts src/lib/timeline.ts
git commit -m "feat: timeline sort/filter utils (TDD)"
```

---

## Task 3: 纯数据 — 主题元数据(TDD)

**Files:**
- Create: `tests/themes.test.ts`, `src/lib/themes.ts`

- [ ] **Step 1: 写失败测试 `tests/themes.test.ts`**

```ts
import { describe, it, expect } from 'vitest'
import { THEMES, DEFAULT_THEME, isTheme } from '../src/lib/themes'

describe('themes', () => {
  it('phase 1 ships cozy + editorial', () => {
    expect(THEMES.map((t) => t.id)).toEqual(['cozy', 'editorial'])
  })
  it('default is cozy', () => {
    expect(DEFAULT_THEME).toBe('cozy')
  })
  it('isTheme guards unknown values', () => {
    expect(isTheme('cozy')).toBe(true)
    expect(isTheme('nope')).toBe(false)
  })
})
```

- [ ] **Step 2: 运行,确认失败**

Run: `npx vitest run tests/themes.test.ts`
Expected: FAIL（找不到模块)

- [ ] **Step 3: 实现 `src/lib/themes.ts`**

```ts
export interface ThemeMeta {
  id: string
  label: string
  swatch: string // 切换器上展示的代表色
}

export const THEMES: ThemeMeta[] = [
  { id: 'cozy', label: '粉彩', swatch: '#19c8b9' },
  { id: 'editorial', label: '杂志', swatch: '#1a1a1a' },
]

export const DEFAULT_THEME = 'cozy'

export function isTheme(value: unknown): boolean {
  return typeof value === 'string' && THEMES.some((t) => t.id === value)
}
```

- [ ] **Step 4: 运行,确认通过**

Run: `npx vitest run tests/themes.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add tests/themes.test.ts src/lib/themes.ts
git commit -m "feat: theme metadata (TDD)"
```

---

## Task 4: 主题样式 — themes.css + global.css

**Files:**
- Create: `src/styles/themes.css`, `src/styles/global.css`

- [ ] **Step 1: 写 `src/styles/themes.css`**

```css
/* 每个主题 = 一组 CSS 变量。换肤 = 切 <html data-theme> */
:root,
[data-theme='cozy'] {
  --bg: #fdf3df;
  --surface: #fff8e7;
  --ink: #794f27;
  --muted: #9f927d;
  --accent: #19c8b9;
  --accent-ink: #ffffff;
  --radius: 18px;
  --shadow: 0 4px 12px rgba(61, 52, 40, 0.1);
  --font: 'Nunito', 'Noto Sans SC', system-ui, sans-serif;
  --maxw: 880px;
}
[data-theme='editorial'] {
  --bg: #faf8f4;
  --surface: #ffffff;
  --ink: #1a1a1a;
  --muted: #6b6b6b;
  --accent: #1a1a1a;
  --accent-ink: #ffffff;
  --radius: 2px;
  --shadow: none;
  --font: Georgia, 'Noto Serif SC', serif;
  --maxw: 760px;
}
```

- [ ] **Step 2: 写 `src/styles/global.css`**

```css
@import './themes.css';

* { box-sizing: border-box; margin: 0; padding: 0; }
html { background: var(--bg); }
body {
  font-family: var(--font);
  color: var(--ink);
  background: var(--bg);
  line-height: 1.6;
  -webkit-font-smoothing: antialiased;
  transition: background 0.25s, color 0.25s;
}
a { color: inherit; }
.container { max-width: var(--maxw); margin: 0 auto; padding: 0 20px; }
.card {
  background: var(--surface);
  border-radius: var(--radius);
  box-shadow: var(--shadow);
  border: 1px solid color-mix(in srgb, var(--ink) 8%, transparent);
}
.btn {
  display: inline-flex; align-items: center; gap: 6px;
  background: var(--accent); color: var(--accent-ink);
  border: none; border-radius: 999px; padding: 8px 16px;
  font-weight: 700; cursor: pointer; text-decoration: none; font-family: var(--font);
}
.muted { color: var(--muted); }
img { max-width: 100%; display: block; }
```

- [ ] **Step 3: Commit**

```bash
git add src/styles/themes.css src/styles/global.css
git commit -m "feat: theme tokens (cozy, editorial) + base styles"
```

---

## Task 5: 站点配置 — src/config/site.ts

**Files:**
- Create: `src/config/site.ts`

- [ ] **Step 1: 写 `src/config/site.ts`**

```ts
export interface ModuleItem {
  key: string
  label: string
  icon: string
  href: string
  enabled: boolean // false = 首页灰显「敬请期待」、不在导航出现
  primary?: boolean // true = 顶部主导航显示
}

export const site = {
  name: '我的名字',
  tagline: '一句话介绍 · 我在记录我的一生',
  avatar: '/img/avatar.svg',
  socials: [
    { name: 'GitHub', url: 'https://github.com/', icon: '🐙' },
    { name: '邮箱', url: 'mailto:you@example.com', icon: '✉️' },
  ],
  modules: [
    { key: 'about', label: '关于我', icon: '🙋', href: '/about', enabled: true, primary: true },
    { key: 'timeline', label: '人生时间轴', icon: '🧭', href: '/timeline', enabled: true, primary: true },
    { key: 'blog', label: '博客', icon: '✍️', href: '/blog', enabled: true, primary: true },
    { key: 'projects', label: '项目', icon: '🧩', href: '/projects', enabled: true, primary: true },
    { key: 'music', label: '音乐', icon: '🎵', href: '/music', enabled: false },
    { key: 'places', label: '足迹', icon: '🗺', href: '/places', enabled: false },
  ] as ModuleItem[],
}

export const enabledModules = () => site.modules.filter((m) => m.enabled)
export const primaryNav = () => site.modules.filter((m) => m.enabled && m.primary)
```

- [ ] **Step 2: 类型检查**

Run: `npx tsc --noEmit -p tsconfig.json`
Expected: 无 error(如报缺类型,确认 Step 已正确)。

- [ ] **Step 3: Commit**

```bash
git add src/config/site.ts
git commit -m "feat: site config with module enable switches"
```

---

## Task 6: 内容集合 + 种子内容

**Files:**
- Create: `src/content.config.ts`, `src/content/about/me.md`, `src/content/timeline/{2019-college,2022-project,2023-trip,2025-site}.md`, `src/content/blog/hello.md`, `src/content/projects/sample.md`

- [ ] **Step 1: 写 `src/content.config.ts`**

```ts
import { defineCollection, z } from 'astro:content'
import { glob } from 'astro/loaders'
import { TIMELINE_TYPES } from './lib/timeline'

const about = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/about' }),
  schema: z.object({
    name: z.string(),
    role: z.string(),
    avatar: z.string().optional(),
    socials: z.array(z.object({ name: z.string(), url: z.string(), icon: z.string() })).default([]),
  }),
})

const timeline = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/timeline' }),
  schema: z.object({
    date: z.coerce.date(),
    title: z.string(),
    type: z.enum(TIMELINE_TYPES.filter((t) => t !== 'all') as [string, ...string[]]),
    icon: z.string().default('•'),
    link: z.string().optional(),
  }),
})

const blog = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/blog' }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    tags: z.array(z.string()).default([]),
    cover: z.string().optional(),
    draft: z.boolean().default(false),
  }),
})

const projects = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/projects' }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    role: z.string().optional(),
    tags: z.array(z.string()).default([]),
    url: z.string().optional(),
    cover: z.string().optional(),
    description: z.string(),
  }),
})

export const collections = { about, timeline, blog, projects }
```

- [ ] **Step 2: 写 `src/content/about/me.md`**

```markdown
---
name: 我的名字
role: 一句话介绍 · 我在记录我的一生
avatar: /img/avatar.svg
socials:
  - { name: GitHub, url: 'https://github.com/', icon: '🐙' }
  - { name: 邮箱, url: 'mailto:you@example.com', icon: '✉️' }
---

在这里写一段关于你自己的话。支持 **Markdown**。
```

- [ ] **Step 3: 写 4 条时间轴事件**

`src/content/timeline/2019-college.md`
```markdown
---
date: 2019-09-01
title: 大学入学
type: life
icon: 🎓
---
那年秋天,我第一次离开家。
```
`src/content/timeline/2022-project.md`
```markdown
---
date: 2022-03-15
title: 第一个上线的项目
type: project
icon: 🧩
link: /projects/sample
---
和朋友熬夜做出来的小工具。
```
`src/content/timeline/2023-trip.md`
```markdown
---
date: 2023-07-20
title: 第一次一个人旅行
type: place
icon: ✈️
---
去了海边的小城。
```
`src/content/timeline/2025-site.md`
```markdown
---
date: 2025-06-17
title: 开始建这个网站
type: milestone
icon: 🌱
---
想把这一生好好记下来。
```

- [ ] **Step 4: 写 `src/content/blog/hello.md`**

```markdown
---
title: 我为什么开始记录人生
date: 2025-06-17
tags: [随笔, 元]
draft: false
---
第一篇。正文支持 Markdown。
```

- [ ] **Step 5: 写 `src/content/projects/sample.md`**

```markdown
---
title: 示例项目
date: 2022-03-15
role: 开发 · 设计
tags: [React, TypeScript]
url: 'https://example.com'
description: 一个让人眼前一亮的小工具。
---
项目详情正文。
```

- [ ] **Step 6: 同步内容类型并校验**

Run: `npm run check`
Expected: `astro check` 通过(0 errors)。若报 schema 错误,核对 frontmatter 字段。

- [ ] **Step 7: Commit**

```bash
git add src/content.config.ts src/content
git commit -m "feat: content collections + seed content"
```

---

## Task 7: 主题切换器 + 顶部导航组件

**Files:**
- Create: `src/components/ThemeSwitcher.astro`, `src/components/TopNav.astro`

- [ ] **Step 1: 写 `src/components/ThemeSwitcher.astro`**

```astro
---
import { THEMES } from '../lib/themes'
---
<div class="theme-switcher" role="group" aria-label="主题切换">
  {THEMES.map((t) => (
    <button class="theme-dot" data-theme-id={t.id} title={t.label}
      style={`--dot:${t.swatch}`} aria-label={t.label}></button>
  ))}
</div>

<style>
  .theme-switcher { display: inline-flex; gap: 6px; }
  .theme-dot {
    width: 22px; height: 22px; border-radius: 50%;
    background: var(--dot); border: 2px solid var(--surface);
    box-shadow: 0 0 0 1px color-mix(in srgb, var(--ink) 20%, transparent);
    cursor: pointer; padding: 0;
  }
  .theme-dot[aria-current='true'] { outline: 2px solid var(--accent); outline-offset: 2px; }
</style>

<script>
  import { DEFAULT_THEME, isTheme } from '../lib/themes'
  const KEY = 'site-theme'
  const apply = (id: string) => {
    document.documentElement.setAttribute('data-theme', id)
    document.querySelectorAll<HTMLButtonElement>('.theme-dot').forEach((b) =>
      b.setAttribute('aria-current', String(b.dataset.themeId === id)),
    )
  }
  const saved = localStorage.getItem(KEY)
  apply(saved && isTheme(saved) ? saved : DEFAULT_THEME)
  document.querySelectorAll<HTMLButtonElement>('.theme-dot').forEach((b) =>
    b.addEventListener('click', () => {
      const id = b.dataset.themeId!
      localStorage.setItem(KEY, id)
      apply(id)
    }),
  )
</script>
```

- [ ] **Step 2: 写 `src/components/TopNav.astro`**

```astro
---
import { site, primaryNav } from '../config/site'
import ThemeSwitcher from './ThemeSwitcher.astro'
const nav = primaryNav()
---
<header class="topnav">
  <div class="container row">
    <a class="brand" href="/">🏝 {site.name}</a>
    <nav class="links">
      {nav.map((m) => <a href={m.href}>{m.label}</a>)}
    </nav>
    <ThemeSwitcher />
  </div>
</header>

<style>
  .topnav { background: var(--surface); border-bottom: 1px solid color-mix(in srgb, var(--ink) 10%, transparent); }
  .row { display: flex; align-items: center; gap: 16px; padding: 10px 20px; }
  .brand { font-weight: 800; text-decoration: none; }
  .links { display: flex; gap: 14px; margin-left: 6px; }
  .links a { text-decoration: none; font-weight: 600; }
  .links a:hover { color: var(--accent); }
  .theme-switcher { margin-left: auto; }
  @media (max-width: 560px) { .links { display: none; } .theme-switcher { margin-left: auto; } }
</style>
```

- [ ] **Step 3: 校验**

Run: `npm run check`
Expected: 通过。

- [ ] **Step 4: Commit**

```bash
git add src/components/ThemeSwitcher.astro src/components/TopNav.astro
git commit -m "feat: theme switcher + top nav"
```

---

## Task 8: Base 布局(含防闪烁主题脚本)

**Files:**
- Create: `src/layouts/Base.astro`

- [ ] **Step 1: 写 `src/layouts/Base.astro`**

```astro
---
import '../styles/global.css'
import TopNav from '../components/TopNav.astro'
import { site } from '../config/site'
import { DEFAULT_THEME } from '../lib/themes'
interface Props { title?: string; description?: string }
const { title, description = site.tagline } = Astro.props
const pageTitle = title ? `${title} · ${site.name}` : site.name
---
<!doctype html>
<html lang="zh-CN" data-theme={DEFAULT_THEME}>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>{pageTitle}</title>
    <meta name="description" content={description} />
    <link rel="icon" href="/favicon.svg" />
    {/* 防闪烁:渲染前就把主题设上 */}
    <script is:inline>
      (function () {
        try {
          var t = localStorage.getItem('site-theme')
          if (t === 'cozy' || t === 'editorial') document.documentElement.setAttribute('data-theme', t)
        } catch (e) {}
      })()
    </script>
  </head>
  <body>
    <TopNav />
    <main class="container" style="padding-top:28px;padding-bottom:48px">
      <slot />
    </main>
    <footer class="container muted" style="padding:24px 20px;font-size:13px">
      © {new Date().getFullYear()} {site.name} · 用 Astro 记录
    </footer>
  </body>
</html>
```

- [ ] **Step 2: 校验**

Run: `npm run check`
Expected: 通过。

- [ ] **Step 3: Commit**

```bash
git add src/layouts/Base.astro
git commit -m "feat: base layout with no-flash theme init"
```

---

## Task 9: 首页枢纽

**Files:**
- Create: `src/components/Hero.astro`, `src/components/ModuleCard.astro`, `public/img/avatar.svg`; Replace: `src/pages/index.astro`

- [ ] **Step 1: 写占位头像 `public/img/avatar.svg`**

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f8a6b2"/><stop offset="1" stop-color="#f7cd67"/></linearGradient></defs><circle cx="50" cy="50" r="50" fill="url(#g)"/></svg>
```

- [ ] **Step 2: 写 `src/components/Hero.astro`**

```astro
---
import { site } from '../config/site'
---
<section class="hero">
  <img class="avatar" src={site.avatar} alt={site.name} width="84" height="84" />
  <div>
    <h1>你好,我是 {site.name}</h1>
    <p class="muted">{site.tagline}</p>
  </div>
</section>
<style>
  .hero { display: flex; align-items: center; gap: 18px; margin: 18px 0 28px; }
  .avatar { width: 84px; height: 84px; border-radius: 50%; box-shadow: var(--shadow); }
  h1 { font-size: 1.8rem; }
  @media (max-width: 480px) { .hero { flex-direction: column; text-align: center; } }
</style>
```

- [ ] **Step 3: 写 `src/components/ModuleCard.astro`**

```astro
---
interface Props { icon: string; label: string; href: string; disabled?: boolean }
const { icon, label, href, disabled = false } = Astro.props
const Tag = disabled ? 'div' : 'a'
---
<Tag class:list={['mod card', { disabled }]} {...disabled ? {} : { href }}>
  <span class="ic">{icon}</span>
  <span class="lb">{label}{disabled && <small class="muted"> · 敬请期待</small>}</span>
</Tag>
<style>
  .mod { display: flex; align-items: center; gap: 10px; padding: 16px; text-decoration: none; transition: transform 0.15s; }
  .mod:not(.disabled):hover { transform: translateY(-3px); }
  .mod.disabled { opacity: 0.5; }
  .ic { font-size: 1.5rem; }
  .lb { font-weight: 700; }
</style>
```

- [ ] **Step 4: 写首页 `src/pages/index.astro`**

```astro
---
import Base from '../layouts/Base.astro'
import Hero from '../components/Hero.astro'
import ModuleCard from '../components/ModuleCard.astro'
import { site } from '../config/site'
---
<Base>
  <Hero />
  <section class="grid">
    {site.modules.map((m) => (
      <ModuleCard icon={m.icon} label={m.label} href={m.href} disabled={!m.enabled} />
    ))}
  </section>
</Base>
<style>
  .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; }
  @media (max-width: 640px) { .grid { grid-template-columns: repeat(2, 1fr); } }
</style>
```

- [ ] **Step 5: 浏览器冒烟验证**

Run: `npm run dev`(另开终端),浏览器打开 `http://localhost:4321`
Expected: 看到 hero + 6 卡片;关于/时间轴/博客/项目可点,音乐/足迹灰显「敬请期待」;点主题圆点能换肤并刷新保持。验证后 Ctrl+C 停 dev。

- [ ] **Step 6: Commit**

```bash
git add src/components/Hero.astro src/components/ModuleCard.astro src/pages/index.astro public/img/avatar.svg
git commit -m "feat: homepage hub (hero + module grid)"
```

---

## Task 10: 关于我页

**Files:**
- Create: `src/pages/about.astro`

- [ ] **Step 1: 写 `src/pages/about.astro`**

```astro
---
import Base from '../layouts/Base.astro'
import { getCollection, render } from 'astro:content'
const [me] = await getCollection('about')
const { Content } = await render(me)
---
<Base title="关于我">
  <article class="card" style="padding:24px">
    <header style="display:flex;align-items:center;gap:16px;margin-bottom:16px">
      {me.data.avatar && <img src={me.data.avatar} alt={me.data.name} width="72" height="72" style="border-radius:50%" />}
      <div>
        <h1>{me.data.name}</h1>
        <p class="muted">{me.data.role}</p>
      </div>
    </header>
    <div class="prose"><Content /></div>
    <nav style="margin-top:18px;display:flex;gap:12px">
      {me.data.socials.map((s) => <a class="btn" href={s.url} target="_blank" rel="noreferrer">{s.icon} {s.name}</a>)}
    </nav>
  </article>
</Base>
```

- [ ] **Step 2: 校验 + 冒烟**

Run: `npm run check` 然后 `npm run dev`,访问 `/about`
Expected: check 通过;页面显示姓名/简介/社交按钮,主题切换正常。

- [ ] **Step 3: Commit**

```bash
git add src/pages/about.astro
git commit -m "feat: about page"
```

---

## Task 11: 人生时间轴页(含类型筛选)

**Files:**
- Create: `src/components/EventList.astro`, `src/pages/timeline.astro`

- [ ] **Step 1: 写 `src/components/EventList.astro`**

```astro
---
import { TIMELINE_TYPES } from '../lib/timeline'
interface EventItem { date: Date; title: string; type: string; icon: string; link?: string; body: string }
interface Props { events: EventItem[] }
const { events } = Astro.props
const labels: Record<string, string> = { all: '全部', life: '人生', project: '项目', place: '足迹', music: '音乐', milestone: '里程碑' }
const fmt = (d: Date) => `${d.getFullYear()} · ${String(d.getMonth() + 1).padStart(2, '0')}`
---
<div class="filters" role="group">
  {TIMELINE_TYPES.map((t) => (
    <button class="chip" data-filter={t} aria-current={t === 'all'}>{labels[t]}</button>
  ))}
</div>
<ol class="timeline">
  {events.map((e) => (
    <li class="event" data-type={e.type}>
      <span class="dot">{e.icon}</span>
      <div class="body">
        <div class="date muted">{fmt(e.date)}</div>
        <h3>{e.title}{e.link && <a class="more" href={e.link}> → 查看</a>}</h3>
        <p class="muted">{e.body}</p>
      </div>
    </li>
  ))}
</ol>

<style>
  .filters { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 20px; }
  .chip { border: 1px solid color-mix(in srgb, var(--ink) 20%, transparent); background: var(--surface); color: var(--ink); border-radius: 999px; padding: 4px 14px; cursor: pointer; font-family: var(--font); }
  .chip[aria-current='true'] { background: var(--accent); color: var(--accent-ink); border-color: var(--accent); }
  .timeline { list-style: none; border-left: 3px solid color-mix(in srgb, var(--ink) 15%, transparent); margin-left: 12px; }
  .event { position: relative; padding: 0 0 24px 28px; }
  .event[hidden] { display: none; }
  .dot { position: absolute; left: -16px; top: 0; width: 30px; height: 30px; border-radius: 50%; background: var(--accent); color: var(--accent-ink); display: grid; place-items: center; }
  .more { font-size: 0.8rem; color: var(--accent); text-decoration: none; }
</style>

<script>
  const chips = document.querySelectorAll<HTMLButtonElement>('.chip')
  const events = document.querySelectorAll<HTMLLIElement>('.event')
  chips.forEach((c) =>
    c.addEventListener('click', () => {
      const f = c.dataset.filter!
      chips.forEach((x) => x.setAttribute('aria-current', String(x === c)))
      events.forEach((e) => {
        const show = f === 'all' || e.dataset.type === f
        e.hidden = !show
      })
    }),
  )
</script>
```

- [ ] **Step 2: 写 `src/pages/timeline.astro`**

```astro
---
import Base from '../layouts/Base.astro'
import EventList from '../components/EventList.astro'
import { getCollection } from 'astro:content'
import { sortEventsByDate } from '../lib/timeline'
const raw = await getCollection('timeline')
const events = sortEventsByDate(
  raw.map((e) => ({ ...e.data, body: e.body ?? '' })),
)
---
<Base title="人生时间轴">
  <h1 style="margin-bottom:18px">人生时间轴</h1>
  <EventList events={events} />
</Base>
```

- [ ] **Step 3: 校验 + 冒烟**

Run: `npm run check` 然后 `npm run dev`,访问 `/timeline`
Expected: 事件按时间倒序;点筛选 chip 只显示对应类型;`2022 项目` 有「→ 查看」链接到 `/projects/sample`。

- [ ] **Step 4: Commit**

```bash
git add src/components/EventList.astro src/pages/timeline.astro
git commit -m "feat: life timeline page with type filter"
```

---

## Task 12: 博客列表 + 详情

**Files:**
- Create: `src/pages/blog/index.astro`, `src/pages/blog/[...slug].astro`

- [ ] **Step 1: 写 `src/pages/blog/index.astro`**

```astro
---
import Base from '../../layouts/Base.astro'
import { getCollection } from 'astro:content'
const posts = (await getCollection('blog'))
  .filter((p) => !p.data.draft)
  .sort((a, b) => b.data.date.getTime() - a.data.date.getTime())
const fmt = (d: Date) => d.toLocaleDateString('zh-CN')
---
<Base title="博客">
  <h1 style="margin-bottom:18px">博客</h1>
  <ul style="list-style:none;display:grid;gap:12px">
    {posts.map((p) => (
      <li class="card" style="padding:16px">
        <a href={`/blog/${p.id}`} style="text-decoration:none">
          <h3>{p.data.title}</h3>
          <p class="muted" style="font-size:0.85rem">{fmt(p.data.date)} · {p.data.tags.join(' / ')}</p>
        </a>
      </li>
    ))}
  </ul>
</Base>
```

- [ ] **Step 2: 写 `src/pages/blog/[...slug].astro`**

```astro
---
import Base from '../../layouts/Base.astro'
import { getCollection, render } from 'astro:content'
export async function getStaticPaths() {
  const posts = (await getCollection('blog')).filter((p) => !p.data.draft)
  return posts.map((p) => ({ params: { slug: p.id }, props: { post: p } }))
}
const { post } = Astro.props
const { Content } = await render(post)
const fmt = (d: Date) => d.toLocaleDateString('zh-CN')
---
<Base title={post.data.title}>
  <article class="card" style="padding:24px">
    <h1>{post.data.title}</h1>
    <p class="muted" style="font-size:0.85rem;margin-bottom:16px">{fmt(post.data.date)} · {post.data.tags.join(' / ')}</p>
    <div class="prose"><Content /></div>
  </article>
</Base>
```

- [ ] **Step 3: 校验 + 冒烟**

Run: `npm run check` 然后 `npm run dev`,访问 `/blog` 与点进 `/blog/hello`
Expected: 列表显示非草稿文章;详情渲染 markdown 正文。

- [ ] **Step 4: Commit**

```bash
git add src/pages/blog/index.astro src/pages/blog/[...slug].astro
git commit -m "feat: blog list + detail"
```

---

## Task 13: 项目列表 + 详情

**Files:**
- Create: `src/components/ProjectCard.astro`, `src/pages/projects/index.astro`, `src/pages/projects/[...slug].astro`

- [ ] **Step 1: 写 `src/components/ProjectCard.astro`**

```astro
---
interface Props { title: string; description: string; tags: string[]; href: string }
const { title, description, tags, href } = Astro.props
---
<a class="card" href={href} style="padding:16px;text-decoration:none;display:block">
  <h3>{title}</h3>
  <p class="muted" style="margin:6px 0">{description}</p>
  <div style="display:flex;flex-wrap:wrap;gap:6px">
    {tags.map((t) => <span style="font-size:0.75rem;border:1px solid color-mix(in srgb,var(--ink) 20%,transparent);border-radius:999px;padding:2px 10px">{t}</span>)}
  </div>
</a>
```

- [ ] **Step 2: 写 `src/pages/projects/index.astro`**

```astro
---
import Base from '../../layouts/Base.astro'
import ProjectCard from '../../components/ProjectCard.astro'
import { getCollection } from 'astro:content'
const projects = (await getCollection('projects')).sort((a, b) => b.data.date.getTime() - a.data.date.getTime())
---
<Base title="项目">
  <h1 style="margin-bottom:18px">项目</h1>
  <section style="display:grid;grid-template-columns:repeat(2,1fr);gap:14px">
    {projects.map((p) => (
      <ProjectCard title={p.data.title} description={p.data.description} tags={p.data.tags} href={`/projects/${p.id}`} />
    ))}
  </section>
</Base>
<style>
  @media (max-width: 560px) { section { grid-template-columns: 1fr !important; } }
</style>
```

- [ ] **Step 3: 写 `src/pages/projects/[...slug].astro`**

```astro
---
import Base from '../../layouts/Base.astro'
import { getCollection, render } from 'astro:content'
export async function getStaticPaths() {
  const projects = await getCollection('projects')
  return projects.map((p) => ({ params: { slug: p.id }, props: { project: p } }))
}
const { project } = Astro.props
const { Content } = await render(project)
---
<Base title={project.data.title}>
  <article class="card" style="padding:24px">
    <h1>{project.data.title}</h1>
    <p class="muted">{project.data.role}</p>
    <p style="margin:12px 0">{project.data.description}</p>
    {project.data.url && <a class="btn" href={project.data.url} target="_blank" rel="noreferrer">打开项目 ↗</a>}
    <div class="prose" style="margin-top:18px"><Content /></div>
  </article>
</Base>
```

- [ ] **Step 4: 校验 + 冒烟**

Run: `npm run check` 然后 `npm run dev`,访问 `/projects` 与 `/projects/sample`
Expected: 列表卡片网格;详情显示描述/链接/正文。从 `/timeline` 的「→ 查看」能跳到此项目。

- [ ] **Step 5: Commit**

```bash
git add src/components/ProjectCard.astro src/pages/projects/index.astro src/pages/projects/[...slug].astro
git commit -m "feat: projects list + detail"
```

---

## Task 14: 全量校验、测试、构建

**Files:** 无新增

- [ ] **Step 1: 跑单元测试**

Run: `npm test`
Expected: timeline + themes 全部 PASS。

- [ ] **Step 2: 类型/内容校验**

Run: `npm run check`
Expected: 0 errors, 0 warnings(hint 可接受)。

- [ ] **Step 3: 生产构建**

Run: `npm run build`
Expected: 构建成功;`dist/` 含 `index.html`、`about/index.html`、`timeline/index.html`、`blog/index.html`、`blog/hello/index.html`、`projects/index.html`、`projects/sample/index.html`。

- [ ] **Step 4: 预览构建产物冒烟**

Run: `npm run preview`,逐页访问首页/about/timeline/blog/projects + 详情;切换主题(cozy⇄editorial)并刷新确认保持。
Expected: 全部正常,移动端窄屏布局不破。

- [ ] **Step 5: Commit(若有微调)**

```bash
git add -A
git commit -m "chore: phase 1 verification pass" || echo "nothing to commit"
```

---

## Task 15: 部署到免费静态托管(Netlify)

**Files:**
- Create: `netlify.toml`

- [ ] **Step 1: 写 `netlify.toml`**

```toml
[build]
  command = "npm run build"
  publish = "dist"

[build.environment]
  NODE_VERSION = "20"
```

- [ ] **Step 2: Commit**

```bash
git add netlify.toml
git commit -m "chore: netlify deploy config"
```

- [ ] **Step 3: 部署(二选一)**

- 方式 A(拖拽,最简单,无需账号绑定 git):`npm run build` 后,把 `dist/` 拖到 https://app.netlify.com/drop。
- 方式 B(连 Git 自动部署):把仓库推到 GitHub,在 Netlify "Add new site → Import",选该仓库,Netlify 读取 `netlify.toml` 自动构建。

Expected: 得到一个公开 URL,各页面可访问。

- [ ] **Step 4: 部署后更新站点 URL**

将 `astro.config.mjs` 的 `site` 改为真实域名,重新提交并触发部署。

```bash
git add astro.config.mjs
git commit -m "chore: set production site url"
```

---

## Self-Review(已执行)

- **Spec 覆盖**:数据层(Task 6)、双主题+切换器(Task 3/4/7/8)、site 配置开关(Task 5)、顶部导航+布局(Task 7/8)、首页枢纽含灰显(Task 9)、关于(10)、时间轴+筛选(11)、博客列表/详情(12)、项目列表/详情(13)、响应式(各组件 media query + Task 14 Step 4)、build/check green(Task 14)、部署(Task 15)。✅ 全覆盖。
- **占位符**:无 TBD/TODO;每个代码步骤含完整代码。✅
- **类型一致**:`TIMELINE_TYPES`/`sortEventsByDate`/`filterEventsByType`(Task 2)在 content.config(6)、timeline 页(11)一致引用;`THEMES`/`DEFAULT_THEME`/`isTheme`(Task 3)在 ThemeSwitcher(7)、Base(8)一致;`site.modules`/`primaryNav`/`enabledModules`(Task 5)在 TopNav(7)、首页(9)一致;集合 `id` 用于 blog/projects 路由(12/13)。✅
- **范围**:仅第一阶段;3D 世界、播放器、小游戏、其余模块、手帐/暗色主题均未排入,符合 spec 路线图。✅

## 延后(不在本计划)

3D 世界模式、音乐/影视播放器岛、小游戏岛、其余 ~15 模块、scrapbook/dark 两套主题 —— 见 spec 第二~四阶段。
