/* eslint-disable no-alert */
import { useEffect, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import { Button, Form, Header, Message, Radio, Segment, Table, TextArea } from 'semantic-ui-react'

import { callApi } from '@/apiConnection'
import { isDefaultServiceProvider } from '@/common'
import { useTitle } from '@/common/hooks'
import { languageCenterViewEnabled } from '@/conf'

export const Updater = () => {
  const [messages, setMessages] = useState([])
  const [customList, setCustomList] = useState('')
  const [type, setType] = useState('students')
  const [jobs, setJobs] = useState(null)
  const [error, setError] = useState(false)

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
  const updateSISCustomList = () =>
    apiCall('custom list', `/updater/update/v2/customlist/${type}`, 'post', customList.trim().split('\n'))
  const refreshStatisticsV2 = () => apiCall('statistics', '/updater/refresh_statistic_v2', 'post')
  const abortSisUpdater = () => apiCall(null, '/updater/abort', 'get')
  const refreshSISRedisCache = () => apiCall('Updater redis', '/updater/refresh_redis_cache', 'get')
  const refreshAllTeacherLeaderboards = () => apiCall('teacher leaderboards', '/teachers/top', 'post')
  const refreshFaculties = () => apiCall('faculties', '/updater/refresh_faculties_v2', 'post')
  const refreshStudyProgrammes = () => apiCall('study programmes', '/updater/refresh_study_programmes_v2', 'post')
  const refreshLanguageCenterData = () =>
    apiCall('language center data', '/updater/refresh_language_center_data', 'post')
  const refreshCloseToGraduationData = () =>
    apiCall('close to graduation data', '/updater/refresh-close-to-graduation', 'post')
  const getJobs = () => callApi('/updater/jobs', 'get')
  const removeWaitingJobs = () => callApi('/updater/jobs', 'delete')

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
      <Message style={{ fontSize: '1.1rem' }}>
        <Button icon="refresh" onClick={updateJobs} size="big" />
        <p>Jobs running: {jobs.active?.length}</p>
        <ul style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))' }}>
          {jobs.active.map(job => (
            <li key={job.name}>{job.name}</li>
          ))}
        </ul>
        <p>Jobs waiting: {jobs.waiting?.length}</p>
        <ul style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))' }}>
          {jobs.waiting.map(job => (
            <li key={job.name}>{job.name}</li>
          ))}
        </ul>
      </Message>
    )
  }

  if (error) throw new Error('Admin intentionally caused frontend crash')

  return (
    <Segment>
      <Message style={{ fontSize: '16px' }}>
        <Message.Header>Update data</Message.Header>
        <ReactMarkdown>
          {`**Updater sis-db - Update meta** Updates organisations, study modules, course units, study levels, education types, credit types  
          **Updater sis-db - Update students** Updates 1000 students at one click in development and all in production environment. Takes about 5 hours in production.  
          **Updater sis-db - Update curriculums** Updates all study programmes and their curriculums. This takes a few minutes, and breaks the curriculum features for that time, so do not run in production unnecessarily.  
          **Updater redis - Update redis** Updates updater redis.  
          **Oodikone redis - Refresh all teacher leaderboards** Refresh all leaderboard statistics from 1963 until today. Might take some time.  
          **Oodikone redis - Refresh oodikone statistics** Refresh studyright associations and the last two years of teacher leaderboard.  
          **Oodikone redis - Refresh faculties** Refresh data for all faculties for all tabs (time consuming).  
          **Oodikone redis - Refresh study programmes** Refresh data for new study programmes for basic and studytrack tabs (time consuming).  
          **Oodikone redis - Refresh language center data** Refresh data for language center view.  
          **Oodikone redis - Refresh close to graduation data** Refresh data for close to graduation view.`}
        </ReactMarkdown>
        {isDefaultServiceProvider() && (
          <Button color="red" onClick={() => setError(true)}>
            Cause frontend crash
          </Button>
        )}
      </Message>
      <Form>
        <Header>Updater (data pulled from importer db and brought to oodikone db)</Header>
        <Form.Group>
          <Form.Button content="Update meta" onClick={updateSISMeta} />
          <Form.Button content="Update students" onClick={updateSISStudents} />
          <Form.Button
            content="Update curriculums"
            onClick={() => {
              if (window.confirm('This breaks all curriculum-related features for a few minutes. Continue?')) {
                updateSISProgrammes()
              }
            }}
          />
        </Form.Group>
        <Header>Refresh data (calculations done by oodikone-backend and cached in redis)</Header>
        {displayJobStatus()}
        <Form.Group style={{ maxWidth: '10em' }}>
          <Form.Button content="Refresh updater redis cache" onClick={refreshSISRedisCache} />
          <Form.Button
            content="Refresh all teacher leaderboards"
            onClick={() => {
              if (window.confirm('This is not ran in worker yet. Continue?')) refreshAllTeacherLeaderboards()
            }}
          />
          <Form.Button content="Refresh oodikone statistics" onClick={refreshStatisticsV2} />
          <Form.Button content="Refresh faculties" onClick={refreshFaculties} />
          <Form.Button content="Refresh study programmes" onClick={refreshStudyProgrammes} />
          {languageCenterViewEnabled && (
            <Form.Button content="Refresh language center data" onClick={refreshLanguageCenterData} />
          )}
          <Form.Button content="Refresh close to graduation data" onClick={refreshCloseToGraduationData} />
        </Form.Group>
      </Form>
      <Form.Group>
        <Header>
          Update custom list of items (students & courses in updater, programmes & faculties computed on backend)
        </Header>
        <TextArea onChange={(_, { value }) => setCustomList(value)} style={{ width: '25%' }} />
        <div style={{ display: 'flex', flexDirection: 'row', gap: '2em', marginTop: '2em' }}>
          {['students', 'courses', 'faculties', 'programmes'].map(thisType => (
            <Radio
              checked={type === thisType}
              data-cy={`${thisType}-button`}
              key={thisType}
              label={thisType}
              name="modeRadioGroup"
              onChange={() => setType(thisType)}
              style={{ fontSize: '24px', paddingTop: '10px' }}
              value={thisType}
            />
          ))}
          <Form.Button content="Update custom list of items" icon="refresh" onClick={updateSISCustomList} />
        </div>
      </Form.Group>
      <Segment>
        <Header>Stop updating</Header>
        <Table collapsing>
          <Table.Body>
            <Table.Row>
              <Table.Cell>
                <ReactMarkdown>
                  Aborts all updating processes in the worker, also those started by a cron-job
                </ReactMarkdown>
              </Table.Cell>
              <Table.Cell>
                <Form.Button content="Stop updater-worker" negative onClick={abortSisUpdater} />
              </Table.Cell>
            </Table.Row>
            <Table.Row>
              <Table.Cell>
                <ReactMarkdown>
                  Removes all jobs **waiting** in the queue (listed above under *Jobs waiting*)
                </ReactMarkdown>
              </Table.Cell>
              <Table.Cell>
                <Form.Button content="Remove waiting jobs" negative onClick={removeWaitingJobs} />
              </Table.Cell>
            </Table.Row>
          </Table.Body>
        </Table>
      </Segment>
      <Segment>
        <Header>Status messages</Header>
        <Button content="Clear messages" onClick={() => setMessages([])} />
        {messages.map(message => (
          <Header key={`${message.time.getTime()}-${message.message}`} style={{ color: message.color }}>
            {message.time.toLocaleTimeString()}: {message.message}
          </Header>
        ))}
      </Segment>
    </Segment>
  )
}
