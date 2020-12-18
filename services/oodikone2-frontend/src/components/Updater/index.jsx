import React, { useState, useRef, useEffect } from 'react'
import { connect } from 'react-redux'
import { Header, Segment, Form, Button, Table, TextArea } from 'semantic-ui-react'
import { callApi } from '../../apiConnection'
import { cancelablePromise } from '../../common'
import { useTitle } from '../../common/hooks'

const Updater = () => {
  const [amount, setAmount] = useState('')
  const [messages, setMessages] = useState([])
  const [statuses, setStatuses] = useState(null)
  const [nums, setNums] = useState('')
  const [SISNums, setSISNums] = useState('')
  useTitle('Updater')

  const apiCall = async (url, method, data) => {
    try {
      const response = await callApi(url, method, data)
      setMessages(messages.concat(<div style={{ color: 'green' }}>{response.data.message}</div>))
    } catch {
      setMessages(messages.concat(<div style={{ color: 'red' }}>updater api error</div>))
    }
  }

  const updateOldestStudents = amount => amount !== 0 && apiCall('/updater/update/oldest', 'post', { amount })
  const updateAllStudents = () => apiCall('/updater/update/all', 'post')
  const updateActiveStudents = () => apiCall('/updater/update/active', 'post')
  const updateNoStudents = () => apiCall('/updater/update/no_student', 'post')
  const updateAttainmentDates = () => apiCall('/updater/update/attainment', 'post')
  const updateMetadata = () => apiCall('/updater/update/meta', 'post')
  const updateDaily = () => apiCall('/updater/update/daily', 'post')
  const createTasks = () => apiCall('/updater/update/studentlist', 'post')
  const rescheduleScheduled = () => apiCall('/updater/reschedule/scheduled', 'post')
  const rescheduleFetched = () => apiCall('/updater/reschedule/fetched', 'post')
  const updatePopulationStudents = () => apiCall('/updatedatabase', 'post', nums.trim().split('\n'))
  const refreshStatistics = () => apiCall('/updater/refresh_statistics', 'post')
  const updateSISMeta = () => apiCall('/updater/update/v2/meta', 'get')
  const updateSISStudents = () => apiCall('/updater/update/v2/students', 'get')
  const updateSISProgrammes = () => apiCall('/updater/update/v2/programmes')
  const updateSISPopulationStudents = () => apiCall('/updater/update/v2/students', 'post', SISNums.trim().split('\n'))
  const refreshStatisticsV2 = () => apiCall('/updater/refresh_statistic_v2', 'post')
  const abortSisUpdater = () => apiCall('/v1/abort?token=dev', 'get')

  const statusRef = useRef()
  useEffect(() => {
    statusRef.current = cancelablePromise(
      (async () => {
        if (process.env.TAG !== 'staging') {
          const result = await callApi('/updater/status', 'get')
          setStatuses(result.data)
        }
      })()
    )
    return () => {
      if (statusRef.current) statusRef.current.cancel()
    }
  }, [])

  return (
    <Segment>
      <Header>Updater control panel</Header>
      <Form>
        <Form.Group>
          <Form.Input
            placeholder="amount"
            name="amount"
            value={amount}
            onChange={(_, { value }) => setAmount(value)}
            action={
              <Button content="Update oldest students:" icon="refresh" onClick={() => updateOldestStudents(amount)} />
            }
            actionPosition="left"
          />
          <Form.Button content="Update ACTIVE students" icon="refresh" onClick={() => updateActiveStudents()} />
          <Form.Button content="Update ALL students" icon="refresh" onClick={() => updateAllStudents()} />
        </Form.Group>
        <Form.Group>
          <Form.Button content="Update attainment dates" icon="refresh" onClick={() => updateAttainmentDates()} />
          <Form.Button content="Update metadata" icon="refresh" onClick={() => updateMetadata()} />
          <Form.Button content="create tasks" icon="refresh" onClick={() => createTasks()} />
          <Form.Button content="Update NO_STUDENT students" icon="refresh" onClick={() => updateNoStudents()} />
          <Form.Button content="Update all 'SCHEDULED' students" icon="refresh" onClick={() => rescheduleScheduled()} />
          <Form.Button content="Update all 'FETCHED' students" icon="refresh" onClick={() => rescheduleFetched()} />
          <Form.Button content="Daily update" icon="refresh" onClick={() => updateDaily()} />
        </Form.Group>
        <Form.Group>
          <TextArea onChange={(_, { value }) => setNums(value)} />
          <Form.Button onClick={updatePopulationStudents} content="Update students by student number" icon="refresh" />
        </Form.Group>
      </Form>
      <Form.Button content="Refresh statistics" icon="refresh" onClick={() => refreshStatistics()} />
      <Segment>
        <Header>SIS STUFF WATCHOUT</Header>
        <Form>
          <Form.Group>
            <Form.Button content="Update SIS Meta" onClick={() => updateSISMeta()} />
            <Form.Button content="Update SIS Students" onClick={() => updateSISStudents()} />
            <Form.Button content="Update SIS Programmes" onClick={() => updateSISProgrammes()} />
            <Form.Button content="Refresh statistics V2" icon="refresh" onClick={() => refreshStatisticsV2()} />
          </Form.Group>
          <Form.Group>
            <Form.Button content="Stop Updating" negative onClick={abortSisUpdater} />
          </Form.Group>
        </Form>
        <Form.Group>
          <TextArea onChange={(_, { value }) => setSISNums(value)} />
          <Form.Button
            onClick={updateSISPopulationStudents}
            content="Update students by student number"
            icon="refresh"
          />
        </Form.Group>
      </Segment>
      <Button content="Clear messages" onClick={() => setMessages([])} />
      <Header>{messages}</Header>
      <Header>Status:</Header>
      <Segment loading={!statuses} basic>
        <Table striped>
          <Table.Body>
            {statuses &&
              statuses.map(e => (
                <Table.Row key={e.label}>
                  <Table.Cell collapsing>{e.label}</Table.Cell>
                  <Table.Cell>{e.value}</Table.Cell>
                </Table.Row>
              ))}
          </Table.Body>
        </Table>
      </Segment>
    </Segment>
  )
}

Updater.propTypes = {}

Updater.defaultProps = {}

export default connect(
  null,
  null
)(Updater)
