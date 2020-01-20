import React, { useCallback, useState, useEffect, useRef } from 'react'
import { chunk, isEqual } from 'lodash'
import qs from 'query-string'

import { SEARCH_HISTORY_VERSION } from '../constants'
import TSA from './tsa'

export const usePrevious = value => {
  const ref = useRef()
  useEffect(() => {
    ref.current = value
  })
  return ref.current
}

export const useTabChangeAnalytics = (category, action) => {
  const previousTabIndex = React.useRef(0)

  const handleTabChange = useCallback(
    (e, data) => {
      const { activeIndex, panes } = data

      if (previousTabIndex.current !== activeIndex) {
        TSA.Matomo.sendEvent(category, action, panes[activeIndex].menuItem)
        previousTabIndex.current = activeIndex
      }
    },
    [category, action, previousTabIndex]
  )

  return { handleTabChange }
}

export const useTabs = (id, initialTab, { location, replace }) => {
  const [tab, setTab] = useState(-1)
  const [didMount, setDidMount] = useState(false)

  const pushToUrl = newTab => {
    replace({
      pathname: location.pathname,
      search: qs.stringify({ ...qs.parse(location.search), [id]: newTab })
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
    (e, { activeIndex }) => {
      setTab(activeIndex)
    }
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

export const useInterval = (callback, delay) => {
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
    setImmediate(() => setProgress(100))
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
    onProgress
  }
}

export const useTitle = title => {
  useEffect(() => {
    document.title = title ? `${title} - Oodikone` : 'Oodikone'
  }, [title])
}

export const useChunk = (data, chunkifyBy) => {
  const [chunkedData, setChunkedData] = useState([])
  const chunkTrigger = useRef([])
  const sleepTimeout = useRef(null)

  const sleep = ms =>
    new Promise(res => {
      sleepTimeout.current = setTimeout(res, ms)
    })

  const chunkify = async () => {
    const chunks = chunk(data, 50)
    let res = []
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i]

      // Gives time to the main event loop
      await sleep(1) // eslint-disable-line
      res = res.concat(...chunk)
      setChunkedData(res)
    }
  }

  useEffect(() => {
    if (
      chunkifyBy &&
      !isEqual(
        chunkTrigger.current,
        data
          .slice()
          .sort()
          .map(d => d[chunkifyBy])
      )
    ) {
      chunkTrigger.current = data.map(d => d[chunkifyBy])
    }
  }, [data])

  useEffect(() => {
    if (chunkifyBy) {
      chunkify()
    }

    return () => clearTimeout(sleepTimeout.current)
  }, [chunkTrigger.current])

  return chunkifyBy ? chunkedData : data
}
