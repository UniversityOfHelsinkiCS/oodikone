import React, { useState } from 'react'
import { Segment, Form, Button, TextArea, Header } from 'semantic-ui-react'
import { callApi } from '../../apiConnection'
import { useTitle } from '../../common/hooks'

const Updater = () => {
  const [messages, setMessages] = useState([])
  const [SISNums, setSISNums] = useState('')
  const [SISCourses, setSISCourses] = useState('')
  useTitle('Updater')

  const apiCall = async (url, method, data) => {
    try {
      const response = await callApi(url, method, data)
      setMessages(messages.concat({ message: response.data, color: 'green' }))
    } catch {
      setMessages(messages.concat({ message: 'Updater api error', color: 'red' }))
    }
  }

  const updateSISMeta = () => apiCall('/updater/update/v2/meta', 'get')
  const updateSISStudents = () => apiCall('/updater/update/v2/students', 'get')
  const updateSISProgrammes = () => apiCall('/updater/update/v2/programmes')
  const updateSISPopulationStudents = () => apiCall('/updater/update/v2/students', 'post', SISNums.trim().split('\n'))
  const refreshStatisticsV2 = () => apiCall('/updater/refresh_statistic_v2', 'post')
  const abortSisUpdater = () => apiCall('/updater/abort', 'get')
  const refreshSISRedisCache = () => apiCall('/updater/refresh_redis_cache', 'get')
  const updateSISCourses = () => apiCall('/updater/update/v2/courses', 'post', SISCourses.trim().split('\n'))
  const refreshAllTeacherLeaderboards = () => apiCall('/teachers/top', 'post')
  const refreshTrends = () => apiCall('/updater/refresh_trends', 'post')
  return (
    <Segment>
      <Form>
        <Form.Group>
          <Form.Button content="Update meta" onClick={() => updateSISMeta()} />
          <Form.Button content="Update students" onClick={() => updateSISStudents()} />
          <Form.Button content="Update programmes" onClick={() => updateSISProgrammes()} />
          <Form.Button content="Refresh updater redis cache" onClick={() => refreshSISRedisCache()} />
          <Form.Button content="Refresh oodikone statistics" onClick={() => refreshStatisticsV2()} />
          <Form.Button content="Refresh all teacher leaderboards" onClick={() => refreshAllTeacherLeaderboards()} />
          <Form.Button content="Refresh trends" onClick={() => refreshTrends()} />
        </Form.Group>
        <Form.Group>
          <Form.Button content="Stop Updating" negative onClick={abortSisUpdater} />
        </Form.Group>
      </Form>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <Form.Group>
          <TextArea onChange={(_, { value }) => setSISNums(value)} style={{ width: '98%' }} />
          <Form.Button
            onClick={updateSISPopulationStudents}
            content="Update students by student number"
            icon="refresh"
          />
        </Form.Group>
        <Form.Group>
          <TextArea onChange={(_, { value }) => setSISCourses(value)} style={{ width: '98%' }} />
          <Form.Button onClick={updateSISCourses} content="Update courses by course code" icon="refresh" />
        </Form.Group>
      </div>
      <Segment>
        <Button content="Clear messages" onClick={() => setMessages([])} />
        {messages.map((message, i) => {
          return (
            // eslint-disable-next-line react/no-array-index-key
            <Header key={i} style={{ color: message.color }}>
              {message.message}
            </Header>
          )
        })}
      </Segment>
    </Segment>
  )
}

export default Updater
