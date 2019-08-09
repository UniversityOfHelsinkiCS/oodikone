import React, { useState, useEffect, useRef } from 'react'
import { Progress } from 'semantic-ui-react'
import { number } from 'prop-types'
import { useDidMount } from '../../common'
import './progressBar.css'

const ProgressBar = ({ progress }) => {
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
  return (
    hidden ?
      null :
      <Progress
        percent={progress}
        disabled={progress === 100}
        progress
        color="blue"
        className={visible ? 'progressBar' : 'progressBarHidden'}
      />
  )
}

ProgressBar.propTypes = {
  progress: number.isRequired
}

export default ProgressBar
