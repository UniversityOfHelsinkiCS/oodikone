import { isEqual } from 'lodash'
import qs from 'query-string'
import { useCallback, useEffect, useRef, useState } from 'react'

import { useGetCurriculumPeriodsQuery } from '@/redux/curriculumPeriods'
import { useGetProgrammesQuery } from '@/redux/populations'
import { useGetSemestersQuery } from '@/redux/semesters'

export const useTabChangeAnalytics = () => {
  const previousTabIndex = useRef(0)

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

// Use @/hooks/tabs for MUI components instead
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

  const onProgress = progress => {
    if (progress > 0) {
      setProgress(50 + Math.floor(progress / 2))
    }
  }

  return {
    progress,
    onProgress,
  }
}

export const useLocalStorage = (key, initialValue) => {
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key)
      return item ? JSON.parse(item) : initialValue
    } catch (error) {
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

/**
 * This hook is similar to useMemo, but it does a deep comparison of the dependencies (using `isEqual` from Lodash).
 */
export const useDeepMemo = (factory, dependencies) => {
  const ref = useRef()

  if (!ref.current || !isEqual(dependencies, ref.current.deps)) {
    ref.current = { deps: dependencies, result: factory() }
  }

  return ref.current.result
}

export const useCurrentSemester = () => {
  const { data: semesterData } = useGetSemestersQuery()
  if (!semesterData) return null
  return Object.values(semesterData.semesters).find(
    semester => new Date(semester.startdate) <= new Date() && new Date(semester.enddate) >= new Date()
  )
}

export const useCurrentCurriculumPeriod = () => {
  const { data: curriculumPeriods = [] } = useGetCurriculumPeriodsQuery()
  return curriculumPeriods.find(
    curriculumPeriod =>
      new Date(curriculumPeriod.startDate) <= new Date() && new Date(curriculumPeriod.endDate) >= new Date()
  )
}

export const useDegreeProgrammeTypes = programmeCodes => {
  const { data: degreeProgrammes } = useGetProgrammesQuery()
  if (!degreeProgrammes) return {}
  return programmeCodes.reduce((acc, programmeCode) => {
    acc[programmeCode] = degreeProgrammes[programmeCode]?.degreeProgrammeType ?? null
    return acc
  }, {})
}
