import Progress from '@mui/material/LinearProgress'
import { number } from 'prop-types'
import { useEffect, useRef, useState } from 'react'

import { useDidMount } from '@/hooks/didMount'
import './progressBar.css'

export const ProgressBar = ({ progress, fixed = false }) => {
  const timeoutId = useRef()
  const [hidden, setHidden] = useState(true)
  const [visible, setVisible] = useState(true)
  const didMount = useDidMount()

  useEffect(() => {
    if (progress !== 100) {
      setHidden(false)
    }

    return () => {
      if (timeoutId.current) clearTimeout(timeoutId.current)
    }
  }, [didMount])

  useEffect(() => {
    if (!didMount) return
    if (progress === 100) {
      setVisible(false)
      timeoutId.current = setTimeout(() => {
        setHidden(true)
      }, 2000)
    } else if (hidden || visible) {
      setVisible(true)
      setHidden(false)
    }
  }, [progress])

  const classNames = []
  classNames.push(visible ? 'progressBar' : 'progressBarHidden')
  if (fixed) classNames.push('fixed')

  return hidden ? null : (
    <Progress
      className={classNames.join(' ')}
      color="info"
      sx={{ height: '2em', borderRadius: '0.375em' }}
      value={progress}
      variant="determinate"
    />
  )
}

ProgressBar.propTypes = {
  progress: number.isRequired,
}
