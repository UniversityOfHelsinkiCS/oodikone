export const SECTION_QUERY_PARAM = 'section'

export const toSectionSlug = (title: string): string =>
  title
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-+|-+$/g, '')

export const buildUrlWithParam = (href: string, param: string, value: string): string => {
  const url = new URL(href)
  url.searchParams.set(param, value)
  url.hash = ''
  return url.toString()
}

/** Returns `href` with the section query param set to `slug`, keeping all other query params */
export const buildSectionUrl = (href: string, slug: string): string =>
  buildUrlWithParam(href, SECTION_QUERY_PARAM, slug)
