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
