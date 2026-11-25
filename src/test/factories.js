import { faker } from '@faker-js/faker'

/** An owner's list as the lists table returns it. */
export const makeList = (overrides = {}) => ({
  id: faker.string.uuid(),
  title: faker.lorem.words(3),
  share_slug: `${faker.lorem.slug(2)}-${faker.string.alphanumeric(16)}`,
  ...overrides,
})

/** The editable fields of an item: what the owner sends on create or update. */
export const makeItemFields = (overrides = {}) => ({
  title: faker.commerce.productName(),
  subtitle: null,
  section: faker.commerce.department(),
  price: faker.number.float({ min: 1, max: 100, fractionDigits: 2 }),
  price_label: null,
  buy_link: faker.internet.url(),
  image_link: null,
  ...overrides,
})

/** An item as the items table returns it (owner side: no reservation data). */
export const makeItem = (overrides = {}) => ({
  id: faker.string.uuid(),
  ...makeItemFields(),
  ...overrides,
})

/** An item as get_list() returns it to a friend: free unless a reservation is given. */
export const makePublicItem = (overrides = {}) => ({
  ...makeItem(),
  reservation: null,
  ...overrides,
})

/** get_list()'s result. */
export const makePublicList = (overrides = {}) => ({
  id: faker.string.uuid(),
  title: faker.lorem.words(3),
  is_owner: false,
  items: [],
  ...overrides,
})
