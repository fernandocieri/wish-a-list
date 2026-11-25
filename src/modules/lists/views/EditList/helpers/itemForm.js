import { isValidLink } from './validateLink'

// Same default as items.section in the migration.
export const DEFAULT_SECTION = 'Regalos'
// numeric(10, 2)
const MAX_PRICE = 99_999_999.99

export const emptyItemValues = {
  title: '',
  subtitle: '',
  section: '',
  price: '',
  price_label: '',
  buy_link: '',
  image_link: '',
}

/** Form values (all strings) for an existing item. */
export function toFormValues(item) {
  return {
    title: item.title,
    subtitle: item.subtitle ?? '',
    section: item.section,
    price: item.price === null ? '' : String(item.price).replace('.', ','),
    price_label: item.price_label ?? '',
    buy_link: item.buy_link,
    image_link: item.image_link ?? '',
  }
}

// Accepts the Spanish decimal comma: "12,50".
function parsePrice(value) {
  return Number(value.replace(',', '.'))
}

/** { field: errorCode } for each invalid field; empty when the values can be saved. */
export function validateItem(values) {
  const errors = {}
  if (!values.title.trim()) errors.title = 'required'
  if (!isValidLink(values.buy_link.trim())) errors.buy_link = 'invalid-link'
  const imageLink = values.image_link.trim()
  if (imageLink && !isValidLink(imageLink)) errors.image_link = 'invalid-link'
  const price = values.price.trim()
  if (price) {
    const parsed = parsePrice(price)
    if (!(parsed >= 0 && parsed <= MAX_PRICE)) errors.price = 'invalid-price'
  }
  return errors
}

/** The row to send to the items table: trimmed, empty optionals as null. */
export function toItemFields(values) {
  const price = values.price.trim()
  return {
    title: values.title.trim(),
    subtitle: values.subtitle.trim() || null,
    section: values.section.trim() || DEFAULT_SECTION,
    price: price ? parsePrice(price) : null,
    price_label: values.price_label.trim() || null,
    buy_link: values.buy_link.trim(),
    image_link: values.image_link.trim() || null,
  }
}
