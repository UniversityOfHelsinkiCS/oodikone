import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router'
import { parseQueryParams, queryParamsToString } from '@/util/queryparams'

export const useTabs = (totalTabs: number, prefix?: string) => {
  const navigate = useNavigate()
  const location = useLocation()

  const id = prefix ? `${prefix}-tab` : 'tab'
  const initialTab = 0

  const normalizeTab = (tab: unknown) => {
    const tabIndex = parseInt(tab as string, 10)
    return Number.isNaN(tabIndex) || tabIndex < 0 || tabIndex >= totalTabs ? initialTab : tabIndex
  }

  const [tab, setTab] = useState<number>(() => {
    const params = parseQueryParams(location.search)
    return normalizeTab(params[id])
  })

  const pushToUrl = (newTab: number) => {
    const search = queryParamsToString({
      ...parseQueryParams(location.search),
      [id]: newTab,
    })
    void navigate({ pathname: location.pathname, search }, { replace: true })
  }

  useEffect(() => {
    const params = parseQueryParams(location.search)
    const queryTab = normalizeTab(params[id])
    if (queryTab !== tab) {
      setTab(queryTab)
    }
  }, [location.search])

  useEffect(() => {
    pushToUrl(tab)
  }, [tab])

  const switchToTab = (newTab: number) => {
    setTab(newTab)
  }

  return [tab, switchToTab] as const
}
