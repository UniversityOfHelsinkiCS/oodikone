import { useCallback, useRef, useState } from 'react'

export const useTabChangeAnalytics = () => {
  const previousTabIndex = useRef<number>(0)
  const [showSubstitutionToggle, setShowSubstitutionToggle] = useState(false)

  const handleTabChange = useCallback(
    (_, data) => {
      const { activeIndex, panes } = data

      const isCoursesTab = activeIndex === panes.findIndex(pane => pane.menuItem == 'Courses')
      setShowSubstitutionToggle(isCoursesTab)

      if (previousTabIndex.current !== activeIndex) {
        previousTabIndex.current = activeIndex
      }
    },
    [previousTabIndex]
  )

  return { handleTabChange, showSubstitutionToggle } as const
}
