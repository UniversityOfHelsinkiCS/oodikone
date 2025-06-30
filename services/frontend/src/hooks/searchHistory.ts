import { useEffect } from 'react'
import { SEARCH_HISTORY_VERSION } from '@/constants'
import { useLocalStorage } from '@/hooks/localStorage'

import { SearchHistoryItem } from '@/types/searchHistory'

export const useSearchHistory = (id: string, capacity = 5) => {
  const [searchHistory, setSearchHistory] = useLocalStorage<SearchHistoryItem[]>(`searchHistoryStore_${id}`, [])

  useEffect(() => {
    if (localStorage.getItem('searchHistoryVersion') !== SEARCH_HISTORY_VERSION) {
      setSearchHistory([])
      localStorage.setItem('searchHistoryVersion', SEARCH_HISTORY_VERSION)
    }
  }, [])

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
