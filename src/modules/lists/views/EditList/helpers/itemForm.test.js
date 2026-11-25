import { describe, expect, it } from 'vitest'
import { faker } from '@faker-js/faker'
import { makeItem, makeItemFields } from '@/test/factories'
import {
  DEFAULT_SECTION,
  emptyItemValues,
  toFormValues,
  toItemFields,
  validateItem,
} from './itemForm'

const validValues = (overrides = {}) => ({
  ...emptyItemValues,
  title: faker.commerce.productName(),
  buy_link: faker.internet.url(),
  ...overrides,
})

describe('validateItem', () => {
  it('accepts a title and a buy link', () => {
    expect(validateItem(validValues())).toEqual({})
  })

  it.each([
    [{ title: '   ' }, 'title', 'required'],
    [{ buy_link: '' }, 'buy_link', 'invalid-link'],
    [{ buy_link: 'javascript:alert(1)' }, 'buy_link', 'invalid-link'],
    [
      { image_link: 'data:image/png;base64,AAAA' },
      'image_link',
      'invalid-link',
    ],
    [{ price: 'abc' }, 'price', 'invalid-price'],
    [{ price: '-1' }, 'price', 'invalid-price'],
    [{ price: '100000000' }, 'price', 'invalid-price'],
  ])('rejects %o', (overrides, field, code) => {
    expect(validateItem(validValues(overrides))).toEqual({ [field]: code })
  })

  it.each(['12,50', '12.50', '0'])('accepts the price %s', (price) => {
    expect(validateItem(validValues({ price }))).toEqual({})
  })
})

describe('toItemFields', () => {
  it('trims values, parses the price and nulls empty optionals', () => {
    const title = faker.commerce.productName()
    const link = faker.internet.url()

    expect(
      toItemFields(
        validValues({
          title: ` ${title} `,
          buy_link: ` ${link} `,
          price: '12,50',
        }),
      ),
    ).toEqual({
      title,
      subtitle: null,
      section: DEFAULT_SECTION,
      price: 12.5,
      price_label: null,
      buy_link: link,
      image_link: null,
    })
  })

  it('keeps a chosen section', () => {
    expect(toItemFields(validValues({ section: ' Spa ' })).section).toBe('Spa')
  })
})

describe('toFormValues', () => {
  it('round-trips an item through the form', () => {
    const fields = makeItemFields({
      subtitle: faker.lorem.words(3),
      price: 7.9,
      image_link: faker.internet.url(),
    })

    expect(toItemFields(toFormValues(fields))).toEqual(fields)
  })

  it('shows a missing price as empty', () => {
    expect(toFormValues(makeItem({ price: null })).price).toBe('')
  })
})
