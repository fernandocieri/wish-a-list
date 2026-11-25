import { describe, expect, it } from 'vitest'
import { formatPrice } from './formatPrice'

describe('formatPrice', () => {
  it.each([
    [12.5, null, '12,50€'],
    [0, null, '0,00€'],
    ['7.9', null, '7,90€'],
    [12.5, 'Desde 10€', 'Desde 10€'],
    [null, 'Gratis', 'Gratis'],
    [null, null, null],
    [undefined, undefined, null],
  ])('formats price %o with label %o as %o', (price, label, expected) => {
    expect(formatPrice(price, label)).toBe(expected)
  })
})
