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
