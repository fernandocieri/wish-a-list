import { describe, expect, it } from 'vitest'
import { groupBySection } from './groupBySection'

describe('groupBySection', () => {
  it('groups items by section in order of first appearance', () => {
    const a1 = { id: 1, section: 'Libros' }
    const b1 = { id: 2, section: 'Spa' }
    const a2 = { id: 3, section: 'Libros' }

    expect(groupBySection([a1, b1, a2])).toEqual([
      ['Libros', [a1, a2]],
      ['Spa', [b1]],
    ])
  })

  it('returns no groups for no items', () => {
    expect(groupBySection([])).toEqual([])
  })
})
