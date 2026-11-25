import { describe, expect, it } from 'vitest'

// Business rule: owners never receive reservation data. Reservation code lives only in
// views/PublicList/ (docs/structure.md rule 5), so no other file in this module may mention it.
const sources = import.meta.glob('./**/*.{js,jsx}', {
  query: '?raw',
  import: 'default',
  eager: true,
})

const ownerFiles = Object.entries(sources).filter(
  ([path]) =>
    !path.startsWith('./views/PublicList/') &&
    !/\.test\.jsx?$/.test(path) &&
    path !== './index.js',
)

describe('owner code', () => {
  it('is found by the scan', () => {
    expect(ownerFiles.length).toBeGreaterThan(0)
  })

  it.each(ownerFiles.map(([path, source]) => [path, source]))(
    '%s never touches reservations or get_list',
    (_path, source) => {
      // Comments may explain the rule; only code counts.
      const code = source.replace(/\/\*[\s\S]*?\*\/|\/\/.*$/gm, '')
      expect(code).not.toMatch(/reservation|get_list|public-list|PublicList/)
    },
  )
})
