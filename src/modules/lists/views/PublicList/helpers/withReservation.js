/** A copy of the cached list with one item's reservation replaced; undefined stays undefined. */
export function withReservation(list, itemId, reservation) {
  if (!list) return list
  return {
    ...list,
    items: list.items.map((item) =>
      item.id === itemId ? { ...item, reservation } : item,
    ),
  }
}
