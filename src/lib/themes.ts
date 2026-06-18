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
