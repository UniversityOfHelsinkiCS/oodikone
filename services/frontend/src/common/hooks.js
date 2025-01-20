import { isEqual } from 'lodash'
import qs from 'query-string'
import { useCallback, useEffect, useRef, useState } from 'react'

import { useGetCurriculumPeriodsQuery } from '@/redux/curriculumPeriods'
import { useGetProgrammesQuery } from '@/redux/populations'
import { useGetSemestersQuery } from '@/redux/semesters'

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
