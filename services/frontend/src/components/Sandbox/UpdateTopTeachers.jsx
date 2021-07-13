import React, { useState, useEffect } from 'react'
import { Button, Progress, Message } from 'semantic-ui-react'
import { api } from '../../apiConnection'
import KeyValueTable from '../Postman/KeyValueTable'

const TASK_URL = '/tasks/topteachers'

const UpdateTopTeachers = () => {
  const [status, setStatus] = useState(null)
  const [progress, setProgress] = useState(null)
  const [computing, setComputing] = useState(false)
  const [fetching, setFetching] = useState(false)
  const [error, setError] = useState(null)

  const checkStatus = async () => {
    setFetching(true)
    try {
      const { data } = await api.get(TASK_URL)
      const { progress, computing, ...rest } = data
      setProgress(progress)
      setComputing(computing)
      setStatus(rest)
    } catch (error) {
      setError(error)
    }
    setFetching(false)
  }

  useEffect(() => {
    checkStatus()
  }, [])

  const doUpdate = async () => {
    setComputing(true)
    setProgress(0)
    await api.post(TASK_URL)
    await checkStatus()
  }

  return (
    <>
      {error && <Message error content={error} />}
      <Button.Group fluid widths="8">
        <Button content="Update Top Teachers" icon="refresh" onClick={doUpdate} disabled={computing} />
        <Button content="Check Status" icon="clock outline" onClick={checkStatus} loading={fetching} />
      </Button.Group>
      {status && <KeyValueTable data={status} />}
      {!!computing && <Progress autoSuccess active={computing} percent={progress} />}
    </>
  )
}

export default UpdateTopTeachers
