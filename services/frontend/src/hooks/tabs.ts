import { useLocation, useNavigate } from 'react-router'
import { SECTION_QUERY_PARAM } from '@/components/Section/sectionLink'
import { useParseQueryParams, queryParamsToString } from '@/util/queryparams'

export const useTabs = (totalTabs: number, prefix?: string) => {
  'use memo'
  const navigate = useNavigate()
  const location = useLocation()
  const params = useParseQueryParams()

  const id = prefix ? `${prefix}-tab` : 'tab'

  const initialTab = 0

  const normalizeTab = (tab: unknown) => {
    const tabIndex = parseInt(tab as string, 10)
    return Number.isNaN(tabIndex) || tabIndex < 0 || tabIndex >= totalTabs ? initialTab : tabIndex
  }

  const tab = normalizeTab(params[id])

  const switchToTab = (newTab: number) => {
    const nextTab = normalizeTab(newTab)

    const currentTab = normalizeTab(params[id])

    if (currentTab === nextTab) return

    // Section links point to a section on the current tab, so drop them when switching tabs
    const search = queryParamsToString({
      ...params,
      [SECTION_QUERY_PARAM]: undefined,
      [id]: nextTab,
    })

    void navigate(
      {
        pathname: location.pathname,
        search,
      },
      {
        replace: true,
      }
    )
  }

  return [tab, switchToTab] as const
}
