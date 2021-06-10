import React, { useState } from 'react'
import { Header, Segment, Form, Button, TextArea } from 'semantic-ui-react'
import { callApi } from '../../apiConnection'
import { useTitle } from '../../common/hooks'

const Updater = () => {
  const [messages, setMessages] = useState([])
  const [SISNums, setSISNums] = useState('')
  const [SISProgrammeName, setSISProgrammeName] = useState('')
  const [SISProgrammeYear, setSISProgrammeYear] = useState('')
  const [SISCourses, setSISCourses] = useState('')
  useTitle('Updater')

  const apiCall = async (url, method, data) => {
    try {
      const response = await callApi(url, method, data)
      setMessages(messages.concat(<div style={{ color: 'green' }}>{response.data.message}</div>))
    } catch {
      setMessages(messages.concat(<div style={{ color: 'red' }}>updater api error</div>))
    }
  }

  const updateSISMeta = () => apiCall('/updater/update/v2/meta', 'get')
  const updateSISStudents = () => apiCall('/updater/update/v2/students', 'get')
  const updateSISProgrammes = () => apiCall('/updater/update/v2/programmes')
  const updateSISPopulationStudents = () => apiCall('/updater/update/v2/students', 'post', SISNums.trim().split('\n'))
  const updateSISPopulationStudentsByProgramme = () =>
    apiCall('/updater/update/v2/students_by_programme', 'post', {
      programme: SISProgrammeName.trim(),
      year: Number(SISProgrammeYear.trim())
    })
  const refreshStatisticsV2 = () => apiCall('/updater/refresh_statistic_v2', 'post')
  const abortSisUpdater = () => apiCall('/updater/abort', 'get')
  const refreshSISRedisCache = () => apiCall('/updater/refresh_redis_cache', 'get')
  const updateSISCourses = () => apiCall('/updater/update/v2/courses', 'post', SISCourses.trim().split('\n'))

  return (
    <Segment>
      <Segment>
        <Header style={{ marginTop: '-.14285714em' }}>SIS STUFF WATCHOUT</Header>
        <Form>
          <Form.Group>
            <Form.Button content="Update SIS Meta" onClick={() => updateSISMeta()} />
            <Form.Button content="Update SIS Students" onClick={() => updateSISStudents()} />
            <Form.Button content="Update SIS Programmes" onClick={() => updateSISProgrammes()} />
            <Form.Button content="Refresh SIS Redis cache" onClick={() => refreshSISRedisCache()} />
            <Form.Button content="Refresh statistics V2" icon="refresh" onClick={() => refreshStatisticsV2()} />
          </Form.Group>
          <Form.Group>
            <Form.Button content="Stop Updating" negative onClick={abortSisUpdater} />
          </Form.Group>
        </Form>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <Form.Group>
            <TextArea fluid onChange={(_, { value }) => setSISNums(value)} style={{ width: '98%' }} />
            <Form.Button
              onClick={updateSISPopulationStudents}
              content="Update students by student number"
              icon="refresh"
            />
          </Form.Group>
          <Form.Group>
            <Form.Input
              placeholder="programme"
              fluid
              name="programme"
              value={SISProgrammeName}
              onChange={(_, { value }) => setSISProgrammeName(value)}
              style={{ marginBottom: 10 }}
            />
            <Form.Input
              fluid
              placeholder="year"
              name="year"
              value={SISProgrammeYear}
              onChange={(_, { value }) => setSISProgrammeYear(value)}
              style={{ marginBottom: 10 }}
            />
            <Form.Button
              onClick={updateSISPopulationStudentsByProgramme}
              content="Update all students by programme & year"
              icon="refresh"
            />
          </Form.Group>
          <Form.Group>
            <TextArea fluid onChange={(_, { value }) => setSISCourses(value)} style={{ width: '98%' }} />
            <Form.Button onClick={updateSISCourses} content="Update courses by course code" icon="refresh" />
          </Form.Group>
        </div>
      </Segment>
      <Button content="Clear messages" onClick={() => setMessages([])} />
      <Header>{messages}</Header>
    </Segment>
  )
}

export default Updater

/*
 
*/
