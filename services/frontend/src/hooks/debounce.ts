import { isEqual } from 'lodash'
import { useCallback, useEffect, useRef, useState } from 'react'

const TIMEOUT = 1000

export const useDebounce = <T>(value: T, onChange: (arg: T) => void) => {
  const [innerValue, setInnerValue] = useState(value)
  const [dirty, setDirty] = useState(false)

  const timeoutRef = useRef<any>(null)

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
    (value: T) => {
      setInnerValue(value)
      setDirty(true)

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
        timeoutRef.current = null
      }

      timeoutRef.current = setTimeout(() => {
        onChange(value)
        setDirty(false)
      }, TIMEOUT)
    },
    [innerValue, setInnerValue, timeoutRef, onChange]
  )

  const flush = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }

    onChange(innerValue)
    setDirty(false)
  }, [timeoutRef, onChange, innerValue])

  return [innerValue, setValue, flush, dirty] as const
}
