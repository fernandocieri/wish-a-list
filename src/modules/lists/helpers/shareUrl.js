/** The link friends open: <origin>/l/<slug>. */
export function shareUrl(slug, origin = window.location.origin) {
  return `${origin}/l/${slug}`
}
