import { useCallback, useState } from 'react'

export const useToggle = (initialValue = false) => {
  const [value, setValue] = useState(initialValue)
  const toggle = useCallback(() => {
    setValue(value => !value)
  }, [])
  return [value, toggle] as const
}
