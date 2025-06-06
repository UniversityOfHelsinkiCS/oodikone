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

// ! To be deprecated, use useTabs for MUI components
export const useSemanticTabs = (id: string, initialTab: number, { location, replace }) => {
  const [tab, setTab] = useState(-1)
  const [didMount, setDidMount] = useState(false)

  const pushToUrl = newTab => {
    replace({
      pathname: location.pathname,
      search: queryParamsToString({ ...parseQueryParams(location.search), [id]: newTab }),
    })
  }

  useEffect(() => {
    const params = parseQueryParams(location.search)
    const queryTab = params[id]
    setTab(queryTab === undefined ? initialTab : JSON.parse(queryTab as string))
    setDidMount(true)
  }, [])

  useEffect(() => {
    if (tab !== undefined && didMount) {
      pushToUrl(tab)
    }
  }, [tab])

  return [
    tab,
    (_, { activeIndex }) => {
      setTab(activeIndex)
    },
  ]
}
