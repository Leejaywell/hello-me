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
