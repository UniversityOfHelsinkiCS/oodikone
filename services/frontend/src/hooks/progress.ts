import { useEffect, useRef, useState } from 'react'

import { useDidMount } from './didMount'

const useInterval = (callback: any, delay: number | null) => {
  const savedCallback = useRef<any>()
  const savedId = useRef<any>()

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

export const useProgress = (loading: boolean) => {
  const didMount = useDidMount()
  const [progress, setProgress] = useState<number>(100)
  const [delay, setDelay] = useState<number | null>(null)
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
    if (loading) {
      restartProgress()
    } else if (didMount) {
      finishProgress()
    }
  }, [loading])

  const onProgress = (progress: number) => {
    if (progress > 0) {
      setProgress(50 + Math.floor(progress / 2))
    }
  }

  return {
    progress,
    onProgress,
  } as const
}
