import React, { useState, useRef, useEffect } from 'react'
import { connect } from 'react-redux'
import { Header, Segment, Form, Button, Table } from 'semantic-ui-react'
import { callApi } from '../../apiConnection'
import { cancelablePromise } from '../../common'

const Updater = () => {
  const [amount, setAmount] = useState('')
  const [statuses, setStatuses] = useState(null)

  const updateOldestStudents = amount => amount !== 0 && callApi('/updater/update/oldest', 'post', { amount })
  const updateAllStudents = () => callApi('/updater/update/all', 'post')
  const updateActiveStudents = () => callApi('/updater/update/active', 'post')
  const updateNoStudents = () => callApi('/updater/update/no_student', 'post')
  const updateAttainmentDates = () => callApi('/updater/update/attainment', 'post')
  const updateMetadata = () => callApi('/updater/update/meta', 'post')
  const createTasks = () => callApi('/updater/update/studentlist', 'post')
  const rescheduleScheduled = () => callApi('/updater/reschedule/scheduled', 'post')
  const rescheduleFetched = () => callApi('/updater/reschedule/fetched', 'post')

  const statusRef = useRef()
  useEffect(() => {
    statusRef.current = cancelablePromise(
      (async () => {
        const result = await callApi('/updater/status', 'get')
        setStatuses(result.data)
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
        </Form.Group>
      </Form>
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
