/** Distinct section names already used in the list, in order of first appearance. */
export function suggestSections(items) {
  return [...new Set(items.map((item) => item.section.trim()))].filter(Boolean)
}
