/* eslint-disable no-alert */
import React, { useState } from 'react'
import { Segment, Form, Button, TextArea, Header, Message } from 'semantic-ui-react'
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
  const refreshFaculties = () => apiCall('/updater/refresh_faculties_v2', 'post')
  const refreshStudyProgrammes = () => apiCall('/updater/refresh_study_programmes_v2', 'post')
  const refreshLanguageCenterData = () => apiCall('/updater/refresh_language_center_data', 'post')

  return (
    <Segment>
      <Message style={{ fontSize: '16px' }}>
        <Message.Header>Update data</Message.Header>
        <p>
          <b>Updater sis-db - Update meta</b> Updates organisations, study modules, course units, study levels,
          education types, credit types <br />
          <b>Updater sis-db - Update students</b> Updates 1000 students at one click in development and all in
          production environment.
          <br />
          <b>Updater sis-db - Update curriculums</b> Updates all study programmes and their curriculums. This takes a
          few minutes, and breaks the curriculum features for that time, so do not run in production unnecessarily.
          <br />
          <b>Updater redis - Update redis</b> Updates updater redis. <br />
          <b>Oodikone redis - Refresh oodikone statistics</b> Refresh studyright associations and the last two years of
          teacher leaderboard.
          <br />
          <b>Oodikone redis - Refresh all teacher leaderboards</b> Refresh all leaderboard statistics from 1963 until
          today. Might take some time.
          <br />
          <b>Oodikone redis - Refresh trends</b> Refresh uber data from 2017-until now, status and graduated.
          <br />
          <b>Oodikone redis - Refresh faculties</b> Refresh data for all faculties for all tabs (time consuming).
          <br />
          <b>Oodikone redis - Refresh study programmes</b> Refresh data for new study programmes for basic and
          studytrack tabs (time consuming).
        </p>
      </Message>
      <Form>
        <Form.Group>
          <Form.Button content="Update meta" onClick={() => updateSISMeta()} />
          <Form.Button content="Update students" onClick={() => updateSISStudents()} />
          <Form.Button
            content="Update curriculums"
            onClick={() => {
              // eslint-disable-next-line no-restricted-globals
              if (confirm('This breaks all curriculum-related features for a few minutes. Continue?')) {
                updateSISProgrammes()
              }
            }}
          />
          <Form.Button content="Refresh updater redis cache" onClick={() => refreshSISRedisCache()} />
          <Form.Button content="Refresh oodikone statistics" onClick={() => refreshStatisticsV2()} />
          <Form.Button content="Refresh all teacher leaderboards" onClick={() => refreshAllTeacherLeaderboards()} />
          <Form.Button content="Refresh trends" onClick={() => refreshTrends()} />
          <Form.Button content="Refresh faculties" onClick={() => refreshFaculties()} />
          <Form.Button content="Refresh study programmes" onClick={() => refreshStudyProgrammes()} />
          <Form.Button content="Refresh language center data" onClick={() => refreshLanguageCenterData()} />
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
