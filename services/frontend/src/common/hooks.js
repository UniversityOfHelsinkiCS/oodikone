import { isEqual } from 'lodash'
import { useCallback, useEffect, useRef, useState } from 'react'

import { useGetCurriculumPeriodsQuery } from '@/redux/curriculumPeriods'
import { useGetProgrammesQuery } from '@/redux/populations'
import { useGetSemestersQuery } from '@/redux/semesters'

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
