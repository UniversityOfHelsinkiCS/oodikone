import { isEqual } from 'lodash'
import { useCallback, useEffect, useRef, useState } from 'react'

export const useDebounce = (value: any, timeout: number, onChange) => {
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

  return [innerValue, setValue, flush, dirty] as const
}
