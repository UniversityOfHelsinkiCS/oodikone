import React, { useState, useEffect } from 'react'
import { Progress } from 'semantic-ui-react'
import { number, bool } from 'prop-types'

const Progressbar = ({ time, pending }) => {
  const [percentage, setPercentage] = useState(0)
  const [complete, setComplete] = useState(false)
  const [timerId, setTimerId] = useState(null)

  const startTimer = () => {
    let amount = 0
    const id = setInterval(() => {
      amount += 1
      setPercentage(amount)
    }, time)
    setTimerId(id)
  }

  useEffect(() => {
    if (pending) startTimer()
  }, [])

  if (percentage === 96) clearInterval(timerId)

  if (!pending && !complete) {
    setPercentage(100)
    clearInterval(timerId)
    setTimeout(setComplete(true), 1000)
  }

  if (pending && complete) {
    setPercentage(0)
    setComplete(false)
    startTimer()
  }

  return (
    <Progress
      percent={percentage}
      disabled={complete}
      progress
      color="blue"
    />
  )
}

Progressbar.propTypes = {
  time: number.isRequired,
  pending: bool.isRequired
}

export default Progressbar
