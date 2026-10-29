export const SECTION_QUERY_PARAM = 'section'

export const toSectionSlug = (title: string): string =>
  title
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-+|-+$/g, '')

/** Returns `href` with the section query param set to `slug`, keeping all other query params */
export const buildSectionUrl = (href: string, slug: string): string => {
  const url = new URL(href)
  url.searchParams.set(SECTION_QUERY_PARAM, slug)
  url.hash = ''
  return url.toString()
}
