import { useCallback, useRef } from 'react'

export const useTabChangeAnalytics = () => {
  const previousTabIndex = useRef<number>(0)

  const handleTabChange = useCallback(
    (_, data) => {
      const { activeIndex } = data

      if (previousTabIndex.current !== activeIndex) {
        previousTabIndex.current = activeIndex
      }
    },
    [previousTabIndex]
  )

  return { handleTabChange } as const
}
