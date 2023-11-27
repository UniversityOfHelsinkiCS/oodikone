/* eslint-disable no-alert */
import React, { useEffect, useState } from 'react'
import { Segment, Form, Button, TextArea, Header, Message } from 'semantic-ui-react'
import { callApi } from '../../apiConnection'
import { useTitle } from '../../common/hooks'

export const Updater = () => {
  const [messages, setMessages] = useState([])
  const [SISNums, setSISNums] = useState('')
  const [SISCourses, setSISCourses] = useState('')
  const [jobs, setJobs] = useState(null)

  useTitle('Updater')

  const apiCall = async (name, url, method, data) => {
    try {
      const response = await callApi(url, method, data)
      setMessages(oldMessages => oldMessages.concat({ time: new Date(), message: response.data, color: 'green' }))
    } catch {
      setMessages(oldMessages => oldMessages.concat({ time: new Date(), message: 'Updater api error', color: 'red' }))
    }
  }

  const updateSISMeta = () => apiCall('meta', '/updater/update/v2/meta', 'get')
  const updateSISStudents = () => apiCall('students', '/updater/update/v2/students', 'get')
  const updateSISProgrammes = () => apiCall('curriculums', '/updater/update/v2/programmes')
  const updateSISPopulationStudents = () =>
    apiCall('custom student list', '/updater/update/v2/students', 'post', SISNums.trim().split('\n'))
  const refreshStatisticsV2 = () => apiCall('statistics', '/updater/refresh_statistic_v2', 'post')
  const abortSisUpdater = () => apiCall(null, '/updater/abort', 'get')
  const refreshSISRedisCache = () => apiCall('Updater redis', '/updater/refresh_redis_cache', 'get')
  const updateSISCourses = () =>
    apiCall('custom course list', '/updater/update/v2/courses', 'post', SISCourses.trim().split('\n'))
  const refreshAllTeacherLeaderboards = () => apiCall('teacher leaderboards', '/teachers/top', 'post')
  const refreshTrends = () => apiCall('trends', '/updater/refresh_trends', 'post')
  const refreshFaculties = () => apiCall('faculties', '/updater/refresh_faculties_v2', 'post')
  const refreshStudyProgrammes = () => apiCall('study programmes', '/updater/refresh_study_programmes_v2', 'post')
  const refreshLanguageCenterData = () =>
    apiCall('language center data', '/updater/refresh_language_center_data', 'post')
  const getJobs = () => callApi('/updater/jobs', 'get')

  const updateJobs = async () => {
    const jobs = await getJobs()
    setJobs(jobs?.data)
  }

  useEffect(() => {
    updateJobs()
  }, [])

  const displayJobStatus = () => {
    if (!jobs) return <Message>Loading job statuses...</Message>
    return (
      <Message style={{ fontSize: '20px' }}>
        <Button icon="refresh" size="big" onClick={updateJobs} />
        <p>Jobs running: {jobs.active?.length}</p>
        <p>
          <ul>
            {jobs.active.map(j => (
              <li>{j.name}</li>
            ))}{' '}
          </ul>
        </p>
        <p>Jobs waiting: {jobs.waiting?.length}</p>
        <p>
          <ul>
            {jobs.waiting.map(j => (
              <li>{j.name}</li>
            ))}{' '}
          </ul>
        </p>
      </Message>
    )
  }

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
          <br />
          <b>Oodikone redis - Refresh language center data</b> Refresh data for language center view.
        </p>
      </Message>
      <Form>
        <Header>Updater (data pulled from importer db and brought to oodikone db)</Header>
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
        </Form.Group>
        <Header>Refresh data (calculations done by oodikone-backend and cached in redis)</Header>
        {displayJobStatus()}
        <Form.Group style={{ maxWidth: '10em' }}>
          <Form.Button content="Refresh updater redis cache" onClick={() => refreshSISRedisCache()} />
          <Form.Button
            content="Refresh all teacher leaderboards"
            onClick={() => {
              // eslint-disable-next-line no-restricted-globals
              if (confirm('This is not ran in worker yet. Continue?')) refreshAllTeacherLeaderboards()
            }}
          />
          <Form.Button content="Refresh trends" onClick={() => refreshTrends()} />
          <Form.Button content="Refresh oodikone statistics" onClick={() => refreshStatisticsV2()} />
          <Form.Button content="Refresh faculties" onClick={() => refreshFaculties()} />
          <Form.Button content="Refresh study programmes" onClick={() => refreshStudyProgrammes()} />
          <Form.Button content="Refresh language center data" onClick={() => refreshLanguageCenterData()} />
        </Form.Group>
      </Form>
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        <Form.Group>
          <Header>Update custom list of students</Header>
          <TextArea onChange={(_, { value }) => setSISNums(value)} style={{ width: '25%' }} />
          <Form.Button
            onClick={updateSISPopulationStudents}
            content="Update students by student number"
            icon="refresh"
          />
        </Form.Group>
        <Form.Group>
          <Header style={{ marginTop: '1em' }}>Update custom list of courses</Header>
          <TextArea onChange={(_, { value }) => setSISCourses(value)} style={{ width: '25%' }} />
          <Form.Button onClick={updateSISCourses} content="Update courses by course code" icon="refresh" />
        </Form.Group>
      </div>
      <Header>Stop updater (aborts all updating processes in the worker, also those started by a cron-job)</Header>
      <Form.Group>
        <Form.Button content="Stop Updating" negative onClick={abortSisUpdater} />
      </Form.Group>
      <Segment>
        <Header>Status messages</Header>
        <Button content="Clear messages" onClick={() => setMessages([])} />
        {messages.map(message => {
          return (
            <Header key={`${message.time.getTime()}-${message.message}`} style={{ color: message.color }}>
              {message.time.toLocaleTimeString()}: {message.message}
            </Header>
          )
        })}
      </Segment>
    </Segment>
  )
}
