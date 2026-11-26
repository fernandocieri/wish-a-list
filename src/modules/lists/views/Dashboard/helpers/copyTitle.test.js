import { describe, expect, it } from 'vitest'
import { faker } from '@faker-js/faker'
import { LIST_TITLE_MAX } from '@/config'
import { copyTitle } from './copyTitle'

describe('copyTitle', () => {
  it('keeps the whole source title and makes it different', () => {
    const title = faker.lorem.words(3)

    const result = copyTitle(title)

    expect(result.startsWith(title)).toBe(true)
    expect(result).not.toBe(title)
  })

  it('ignores whitespace around the source title', () => {
    const title = faker.lorem.words(3)

    expect(copyTitle(`  ${title}  `)).toBe(copyTitle(title))
  })

  it.each([LIST_TITLE_MAX - 1, LIST_TITLE_MAX])(
    'fits a %i-character title within the limit',
    (length) => {
      const title = 'x'.repeat(length)

      const result = copyTitle(title)

      expect(result).toHaveLength(LIST_TITLE_MAX)
      expect(result.startsWith('x'.repeat(LIST_TITLE_MAX - 20))).toBe(true)
    },
  )
})
