import { useMemo } from 'react'
import { useLocation, useNavigate } from 'react-router'
import { parseQueryParams, queryParamsToString } from '@/util/queryparams'

export const useTabs = (totalTabs: number, prefix?: string) => {
  'use memo'
  const navigate = useNavigate()
  const location = useLocation()

  const id = prefix ? `${prefix}-tab` : 'tab'

  const initialTab = 0

  const normalizeTab = (tab: unknown) => {
    const tabIndex = parseInt(tab as string, 10)
    return Number.isNaN(tabIndex) || tabIndex < 0 || tabIndex >= totalTabs ? initialTab : tabIndex
  }

  const tab = useMemo(() => {
    return normalizeTab(parseQueryParams(location.search)[id])
  }, [location.search, id, normalizeTab])

  const switchToTab = (newTab: number) => {
    const nextTab = normalizeTab(newTab)

    const params = parseQueryParams(location.search)
    const currentTab = normalizeTab(params[id])

    if (currentTab === nextTab) return

    const search = queryParamsToString({
      ...params,
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
