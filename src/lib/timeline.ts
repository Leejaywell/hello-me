export const TIMELINE_TYPES = ['all', 'life', 'project', 'place', 'music', 'milestone'] as const
export type TimelineType = (typeof TIMELINE_TYPES)[number]

export function sortEventsByDate<T extends { date: Date }>(events: T[]): T[] {
  return [...events].sort((a, b) => b.date.getTime() - a.date.getTime())
}

export function filterEventsByType<T extends { type: string }>(events: T[], type: string): T[] {
  return type === 'all' ? events : events.filter((e) => e.type === type)
}
