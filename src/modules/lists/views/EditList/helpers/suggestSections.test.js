import { describe, expect, it } from 'vitest'
import { suggestSections } from './suggestSections'

describe('suggestSections', () => {
  it.each([
    [[], []],
    [['Libros'], ['Libros']],
    [
      ['Libros', 'Spa', 'Libros'],
      ['Libros', 'Spa'],
    ],
    [['Libros', ' Libros '], ['Libros']],
  ])('suggests %o as %o', (sections, expected) => {
    const items = sections.map((section) => ({ section }))

    expect(suggestSections(items)).toEqual(expected)
  })
})
