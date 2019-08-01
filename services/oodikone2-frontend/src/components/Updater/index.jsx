import React, { useState, useRef, useEffect } from 'react'
import { connect } from 'react-redux'
import { Header, Segment, Form, Button, Table } from 'semantic-ui-react'
import { callApi } from '../../apiConnection'
import { cancelablePromise } from '../../common'

const Updater = () => {
  const [amount, setAmount] = useState(2000)
  const [statuses, setStatuses] = useState(null)

  const updateOldestStudents = amount => amount !== 0 && callApi('/updater/update/oldest', 'post', { amount })
  const updateAllStudents = () => callApi('/updater/update/all', 'post')
  const updateActiveStudents = () => callApi('/updater/update/active', 'post')
  const updateAttainmentDates = () => callApi('/updater/update/attainment', 'post')
  const updateMetadata = () => callApi('/updater/update/meta', 'post')
  const updateStudentlist = () => callApi('/updater/update/studentlist', 'post')

  const statusRef = useRef()
  useEffect(() => {
    statusRef.current = cancelablePromise((async () => {
      const result = await callApi('/updater/status', 'get')
      setStatuses(result.data)
    })())
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
              <Button
                content="Update oldest students:"
                icon="refresh"
                onClick={() => updateOldestStudents(amount)}
              />
            }
            actionPosition="left"
          />
          <Form.Button
            content="Update active students"
            icon="refresh"
            onClick={() => updateActiveStudents()}
          />
          <Form.Button
            content="Update all students"
            icon="refresh"
            onClick={() => updateAllStudents()}
          />
          <Form.Button
            content="Update attainment dates"
            icon="refresh"
            onClick={() => updateAttainmentDates()}
          />
          <Form.Button
            content="Update metadata"
            icon="refresh"
            onClick={() => updateMetadata()}
          />
          <Form.Button
            content="Update student list"
            icon="refresh"
            onClick={() => updateStudentlist()}
          />
        </Form.Group>
      </Form>
      <Header>Status:</Header>
      <Segment loading={!statuses} basic>
        <Table>
          <Table.Body>
            {statuses && statuses.map(e => <Table.Row key={e.label}><Table.Cell>{e.label}</Table.Cell><Table.Cell>{e.value}</Table.Cell></Table.Row>)}
          </Table.Body>
        </Table>
      </Segment>
    </Segment>
  )
}

Updater.propTypes = {
}

Updater.defaultProps = {
}

export default connect(null, null)(Updater)
