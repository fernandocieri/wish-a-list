// Mirrors the items.buy_link / image_link check constraints: http(s) only, at most 2000 chars.
export const MAX_LINK_LENGTH = 2000

export function isValidLink(value) {
  if (typeof value !== 'string' || value.length > MAX_LINK_LENGTH) return false
  if (!/^https?:\/\//i.test(value)) return false
  try {
    new URL(value)
    return true
  } catch {
    return false
  }
}
