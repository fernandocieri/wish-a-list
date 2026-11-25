/** [[section, items], ...] in order of first appearance; items keep their order. */
export function groupBySection(items) {
  const map = new Map()
  for (const item of items) {
    if (!map.has(item.section)) map.set(item.section, [])
    map.get(item.section).push(item)
  }
  return Array.from(map.entries())
}
