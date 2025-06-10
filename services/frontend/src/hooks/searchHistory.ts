import { useEffect, useState } from 'react'

import { SEARCH_HISTORY_VERSION } from '@/constants'
import { SearchHistoryItem } from '@/types/searchHistory'

export const useSearchHistory = (id: string, capacity = 5) => {
  const [searchHistory, setSearchHistory] = useState<SearchHistoryItem[]>([])
  const [didMount, setDidMount] = useState(false)

  const getSearchHistoryStore = () => {
    const store = localStorage.getItem('searchHistoryStore')
    return store ? JSON.parse(store) : {}
  }

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

    setSearchHistory(getSearchHistoryStore()[id] ?? [])
    setDidMount(true)
  }, [])

  useEffect(() => {
    if (didMount) {
      saveSearchHistory()
    }
  }, [searchHistory])

  const addItem = (item: SearchHistoryItem) => {
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

  return [searchHistory, addItem, updateItem] as const
}
