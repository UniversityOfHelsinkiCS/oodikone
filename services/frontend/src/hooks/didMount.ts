import { useEffect, useState } from 'react'

export const useDidMount = () => {
  const [didMount, setDidMount] = useState(false)
  useEffect(() => {
    setDidMount(true)
  }, [])
  return didMount
}
