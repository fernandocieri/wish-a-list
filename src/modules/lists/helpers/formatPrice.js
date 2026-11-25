/** "12,50€", the custom label when there is one, or null when the item has no price. */
export function formatPrice(price, priceLabel) {
  if (priceLabel) return priceLabel
  if (price === null || price === undefined || price === '') return null
  return `${Number(price).toFixed(2).replace('.', ',')}€`
}
