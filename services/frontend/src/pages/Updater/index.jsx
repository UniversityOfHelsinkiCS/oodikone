/* eslint-disable no-alert */
import { Refresh as RefreshIcon } from '@mui/icons-material'
import {
  Button,
  Container,
  FormControl,
  FormControlLabel,
  Grid2 as Grid,
  Radio,
  RadioGroup,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { useEffect, useState } from 'react'

import { callApi } from '@/apiConnection'
import { isDefaultServiceProvider } from '@/common'
import { updaterToolTips } from '@/common/InfoToolTips/updater'
import { PageTitle } from '@/components/material/PageTitle'
import { Section } from '@/components/material/Section'
import { languageCenterViewEnabled } from '@/conf'
import { useTitle } from '@/hooks/title'

export const Updater = () => {
  const [messages, setMessages] = useState([])
  const [customList, setCustomList] = useState('')
  const [type, setType] = useState('students')
  const [jobs, setJobs] = useState(null)
  const [error, setError] = useState(false)

  useTitle('Updater')

  const apiCall = async (url, method, data) => {
    try {
      const response = await callApi(url, method, data)
      setMessages(oldMessages => oldMessages.concat({ time: new Date(), message: response.data, color: 'green' }))
    } catch {
      setMessages(oldMessages => oldMessages.concat({ time: new Date(), message: 'Updater api error', color: 'red' }))
    }
  }

  const updateSISMeta = () => apiCall('/updater/update/v2/meta')
  const updateSISStudents = () => apiCall('/updater/update/v2/students')
  const updateSISProgrammes = () => apiCall('/updater/update/v2/programmes')
  const updateSISCustomList = () =>
    apiCall(`/updater/update/v2/customlist/${type}`, 'post', customList.trim().split('\n'))
  const refreshTeacherLeaderboardForCurrentAndPreviousYear = () =>
    apiCall('/updater/refresh-teacher-leaderboard', 'post')
  const abortSisUpdater = () => apiCall('/updater/abort')
  const refreshSISRedisCache = () => apiCall('/updater/refresh_redis_cache')
  const refreshAllTeacherLeaderboards = () => apiCall('/teachers/top', 'post')
  const refreshFaculties = () => apiCall('/updater/refresh_faculties_v2', 'post')
  const refreshStudyProgrammes = () => apiCall('/updater/refresh_study_programmes_v2', 'post')
  const refreshLanguageCenterData = () => apiCall('/updater/refresh_language_center_data', 'post')
  const refreshCloseToGraduationData = () => apiCall('/updater/refresh-close-to-graduation', 'post')
  const getJobs = () => callApi('/updater/jobs')
  const removeWaitingJobs = () => callApi('/updater/jobs', 'delete')

  const updateJobs = async () => {
    const jobs = await getJobs()
    setJobs(jobs?.data)
  }

  useEffect(() => {
    updateJobs()
  }, [])

  if (error) throw new Error('Admin intentionally caused frontend crash')

  return (
    <Container maxWidth="lg">
      <PageTitle title="Updater" />
      <Stack spacing={2}>
        {isDefaultServiceProvider() && (
          <Button color="error" onClick={() => setError(true)} variant="contained">
            Cause frontend crash
          </Button>
        )}
        <Section
          infoBoxContent={updaterToolTips.updaterSection}
          title="Updater (data pulled from sis-importer-db and brought to sis-db)"
        >
          <Stack direction="row" spacing={2}>
            <Button onClick={updateSISMeta} variant="contained">
              Update meta
            </Button>
            <Button onClick={updateSISStudents} variant="contained">
              Update students
            </Button>
            <Button
              onClick={() => {
                if (window.confirm('This breaks all curriculum-related features for a few minutes. Continue?')) {
                  updateSISProgrammes()
                }
              }}
              variant="contained"
            >
              Update curriculums
            </Button>
            <Button onClick={refreshSISRedisCache} variant="contained">
              Refresh updater redis
            </Button>
          </Stack>
        </Section>
        <Section
          infoBoxContent={updaterToolTips.refreshDataSection}
          title="Refresh data (calculations done by oodikone-backend and cached in redis)"
        >
          {jobs && (
            <Stack alignItems="flex-start" spacing={2}>
              <Button onClick={updateJobs} startIcon={<RefreshIcon />} variant="contained">
                Update messages
              </Button>
              <Typography variant="h6">Jobs running: {jobs.active?.length}</Typography>
              <ul
                style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', width: '100%' }}
              >
                {jobs.active.map(job => (
                  <li key={job.name}>{job.name}</li>
                ))}
              </ul>
              <Typography variant="h6">Jobs waiting: {jobs.waiting?.length}</Typography>
              <ul
                style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', width: '100%' }}
              >
                {jobs.waiting.map(job => (
                  <li key={job.name}>{job.name}</li>
                ))}
              </ul>
            </Stack>
          )}
          <Stack direction="row" spacing={2}>
            <Button
              onClick={() => {
                if (window.confirm('This is not ran in worker yet. Continue?')) refreshAllTeacherLeaderboards()
              }}
              variant="contained"
            >
              Refresh all teacher leaderboards
            </Button>
            <Button onClick={refreshTeacherLeaderboardForCurrentAndPreviousYear} variant="contained">
              Refresh teacher leaderboards of current and previous year
            </Button>
            <Button onClick={refreshFaculties} variant="contained">
              Refresh faculties
            </Button>
            <Button onClick={refreshStudyProgrammes} variant="contained">
              Refresh study programmes
            </Button>
            {languageCenterViewEnabled && (
              <Button onClick={refreshLanguageCenterData} variant="contained">
                Refresh language center data
              </Button>
            )}
            <Button onClick={refreshCloseToGraduationData} variant="contained">
              Refresh close to graduation data
            </Button>
          </Stack>
        </Section>
        <Section title="Update custom list of items (students & courses in updater, programmes & faculties computed on backend)">
          <Stack alignItems="flex-start" spacing={2}>
            <TextField
              multiline
              onChange={event => setCustomList(event.target.value)}
              rows={7}
              sx={{ minWidth: '30rem' }}
              value={customList}
            />
            <FormControl>
              <RadioGroup onChange={event => setType(event.target.value)} row value={type}>
                <FormControlLabel control={<Radio />} label="Students" value="students" />
                <FormControlLabel control={<Radio />} label="Courses" value="courses" />
                <FormControlLabel control={<Radio />} label="Faculties" value="faculties" />
                <FormControlLabel control={<Radio />} label="Programmes" value="programmes" />
              </RadioGroup>
            </FormControl>
            <Button onClick={updateSISCustomList} startIcon={<RefreshIcon />} variant="contained">
              Update custom list of items
            </Button>
          </Stack>
        </Section>
        <Section title="Stop updating">
          <Grid container spacing={1}>
            <Grid size={6}>Aborts all updating processes in the worker, also those started by a cron-job</Grid>
            <Grid size={3}>
              <Button color="error" onClick={abortSisUpdater} variant="contained">
                Stop updater-worker
              </Button>
            </Grid>
            <Grid size={6}>
              Removes all jobs <b>waiting</b> in the queue (listed above under <em>Jobs waiting</em>)
            </Grid>
            <Grid size={3}>
              <Button color="error" onClick={removeWaitingJobs} variant="contained">
                Remove waiting jobs
              </Button>
            </Grid>
          </Grid>
        </Section>
        <Section title="Status messages">
          {messages.length > 0 && (
            <Button onClick={() => setMessages([])} variant="contained">
              Clear messages
            </Button>
          )}
          <Stack spacing={1} sx={{ mt: 2 }}>
            {messages.map(message => (
              <Typography key={`${message.time.getTime()}-${message.message}`} style={{ color: message.color }}>
                {message.time.toLocaleTimeString()}: {message.message}
              </Typography>
            ))}
          </Stack>
        </Section>
      </Stack>
    </Container>
  )
}
