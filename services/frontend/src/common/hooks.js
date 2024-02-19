import React, { useCallback, useState, useEffect, useRef } from 'react'
import { isEqual } from 'lodash-es'
import qs from 'query-string'
import { SEARCH_HISTORY_VERSION } from '../constants'

export const useTabChangeAnalytics = () => {
  const previousTabIndex = React.useRef(0)

  const handleTabChange = useCallback(
    (_, data) => {
      const { activeIndex } = data

      if (previousTabIndex.current !== activeIndex) {
        previousTabIndex.current = activeIndex
      }
    },
    [previousTabIndex]
  )

  return { handleTabChange }
}

export const useTabs = (id, initialTab, { location, replace }) => {
  const [tab, setTab] = useState(-1)
  const [didMount, setDidMount] = useState(false)

  const pushToUrl = newTab => {
    replace({
      pathname: location.pathname,
      search: qs.stringify({ ...qs.parse(location.search), [id]: newTab }),
    })
  }

  useEffect(() => {
    const params = qs.parse(location.search)
    const queryTab = params[id]
    setTab(queryTab === undefined ? initialTab : JSON.parse(queryTab))
    setDidMount(true)
  }, [])

  useEffect(() => {
    if (tab !== undefined && didMount) pushToUrl(tab)
  }, [tab])

  return [
    tab,
    (_, { activeIndex }) => {
      setTab(activeIndex)
    },
  ]
}

export const useSearchHistory = (id, capacity = 5) => {
  const [searchHistory, setSearchHistory] = useState([])
  const [didMount, setDidMount] = useState(false)

  const getSearchHistoryStore = () => JSON.parse(localStorage.getItem('searchHistoryStore')) || {}

  const saveSearchHistoryStore = newStore => localStorage.setItem('searchHistoryStore', JSON.stringify(newStore))

  const saveSearchHistory = () => {
    const searchHistoryStore = getSearchHistoryStore()
    searchHistoryStore[id] = searchHistory
    saveSearchHistoryStore(searchHistoryStore)
  }

  useEffect(() => {
    if (localStorage.getItem('searchHistoryVersion') !== SEARCH_HISTORY_VERSION) {
      saveSearchHistoryStore({})
      localStorage.setItem('searchHistoryVersion', SEARCH_HISTORY_VERSION)
    }

    setSearchHistory(getSearchHistoryStore()[id] || [])
    setDidMount(true)
  }, [])

  useEffect(() => {
    if (didMount) {
      saveSearchHistory()
    }
  }, [searchHistory])

  const addItem = item => {
    const filteredSearchHistory = searchHistory.filter(sh => sh.text !== item.text)
    setSearchHistory(
      filteredSearchHistory.concat({ ...item, timestamp: new Date(), id: new Date().getTime() }).slice(-capacity)
    )
  }

  const updateItem = item => {
    const updatedSearchHistory = [{ ...item, timestamp: new Date() }].concat(
      searchHistory.filter(s => s.id !== item.id)
    )
    setSearchHistory(updatedSearchHistory)
  }

  return [searchHistory, addItem, updateItem]
}

const useInterval = (callback, delay) => {
  const savedCallback = useRef()
  const savedId = useRef()

  const clear = () => {
    if (savedId.current) {
      clearInterval(savedId.current)
    }
  }

  useEffect(() => {
    savedCallback.current = callback
  }, [callback])

  useEffect(() => {
    const tick = () => savedCallback.current()
    clear()
    if (delay !== null) {
      savedId.current = setInterval(tick, delay)
    }
    return clear
  }, [delay])
}

export const useDidMount = () => {
  const [didMount, setDidMount] = useState(false)
  useEffect(() => {
    setDidMount(true)
  }, [])
  return didMount
}

export const useProgress = loading => {
  const didMount = useDidMount()
  const [progress, setProgress] = useState(100)
  const [delay, setDelay] = useState(null)
  const amountToProgress = delay ? Math.ceil(Math.random() * 4) : 0

  useInterval(() => {
    setProgress(progress + amountToProgress > 50 ? 50 : progress + amountToProgress)
  }, delay)

  useEffect(() => {
    if (delay && progress >= 50) {
      setDelay(null)
    }
  }, [progress])

  const restartProgress = () => {
    setProgress(0)
    setDelay(500)
  }

  const finishProgress = () => {
    setDelay(null)
    setTimeout(() => setProgress(100), 0)
  }

  useEffect(() => {
    if (loading) restartProgress()
    else if (didMount) finishProgress()
  }, [loading])

  const onProgress = p => {
    if (p > 0) {
      setProgress(50 + Math.floor(p / 2))
    }
  }

  return {
    progress,
    onProgress,
  }
}

export const useTitle = title => {
  useEffect(() => {
    document.title = title ? `${title} - Oodikone` : 'Oodikone'
  }, [title])
}

export const useLocalStorage = (key, initialValue) => {
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key)
      return item ? JSON.parse(item) : initialValue
    } catch (error) {
      console.log(error) // eslint-disable-line no-console
      return initialValue
    }
  })

  const setValue = useCallback(
    value => {
      try {
        const valueToStore = value instanceof Function ? value(storedValue) : value
        setStoredValue(valueToStore)
        window.localStorage.setItem(key, JSON.stringify(valueToStore))
      } catch (error) {
        console.log(error) // eslint-disable-line no-console
      }
    },
    [key]
  )

  return [storedValue, setValue]
}

export const useDebounce = (value, timeout, onChange) => {
  const [innerValue, setInnerValue] = useState(value)
  const [dirty, setDirty] = useState(false)

  const timeoutRef = useRef(null)

  useEffect(() => {
    if (!isEqual(value, innerValue)) {
      setInnerValue(value)
      setDirty(false)

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
        timeoutRef.current = null
      }
    }
  }, [value])

  const setValue = useCallback(
    value => {
      setInnerValue(value)
      setDirty(true)

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
        timeoutRef.current = null
      }

      timeoutRef.current = setTimeout(() => {
        onChange(value)
        setDirty(false)
      }, timeout)
    },
    [innerValue, setInnerValue, timeoutRef, onChange, timeout]
  )

  const flush = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }

    onChange(innerValue)
    setDirty(false)
  }, [timeoutRef, onChange, innerValue])

  return [innerValue, setValue, flush, dirty]
}

// From: https://www.joshwcomeau.com/snippets/react-hooks/use-toggle/
export const useToggle = (initialValue = false) => {
  const [value, setValue] = useState(initialValue)
  const toggle = useCallback(() => {
    setValue(v => !v)
  }, [])
  return [value, toggle]
}
