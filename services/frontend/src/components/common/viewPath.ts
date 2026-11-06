import { createContext } from 'react'

import { buildUrlWithParam } from '@/components/Section/sectionLink'

/** @example ?view=credit-statistics.distribution-development links to a tab inside a PanelView panel */
export const VIEW_QUERY_PARAM = 'view'
export const VIEW_SEPARATOR = '.'

export const parseViewPath = (value: string | undefined): string[] =>
  (value ?? '').split(VIEW_SEPARATOR).filter(segment => segment !== '')

export const buildViewUrl = (href: string, path: string[]): string =>
  buildUrlWithParam(href, VIEW_QUERY_PARAM, path.join(VIEW_SEPARATOR))

export type ViewScope = {
  panel: string
  /** Empty when the link points to another panel */
  linkedPath: string[]
  setCurrentTab: (panel: string, segment: string | undefined) => void
  dropLink: () => void
}

export const ViewScopeContext = createContext<ViewScope | undefined>(undefined)
