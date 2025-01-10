import { debounce } from 'lodash'
import { useState, useEffect, useMemo } from 'react'

/**
 * A custom hook that returns a stateful value and a debounced setter.
 *
 * @param initialValue - The initial state value
 * @param delay - The debounce delay (in milliseconds, defaults to 500)
 */
export const useDebouncedState = <T>(initialValue: T, delay = 500) => {
  const [value, setValue] = useState<T>(initialValue)

  const debouncedSetValue = useMemo(() => {
    const debouncedFn = debounce((newValue: T | ((prevValue: T) => T)) => {
      setValue(prevValue => (typeof newValue === 'function' ? (newValue as (prevValue: T) => T)(prevValue) : newValue))
    }, delay)

    return debouncedFn
  }, [delay])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      debouncedSetValue.cancel()
    }
  }, [debouncedSetValue])

  return [value, debouncedSetValue] as const
}
