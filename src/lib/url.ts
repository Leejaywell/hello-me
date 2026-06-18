/**
 * Prefix an absolute site path with Astro's configured base (e.g. '/hello-me').
 * Leaves external links (http..., mailto:) and relative paths untouched.
 * Content authors keep writing plain '/projects/x' — this fixes it at render time.
 */
export function withBase(path: string): string {
  if (!path.startsWith('/')) return path
  const base = import.meta.env.BASE_URL.replace(/\/$/, '')
  return base + path
}
