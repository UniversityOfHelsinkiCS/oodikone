/* eslint-disable no-alert */
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogContentText from '@mui/material/DialogContentText'
import DialogTitle from '@mui/material/DialogTitle'
import FormControl from '@mui/material/FormControl'
import FormControlLabel from '@mui/material/FormControlLabel'
import Grid from '@mui/material/Grid2'
import LinearProgress from '@mui/material/LinearProgress'
import Radio from '@mui/material/Radio'
import RadioGroup from '@mui/material/RadioGroup'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { useEffect, useRef, useState } from 'react'

import { callApi } from '@/apiConnection'
import { updaterToolTips } from '@/common/InfoToolTips'
import { ExternalLink } from '@/components/common/ExternalLink'
import { PageLayout } from '@/components/common/PageLayout'
import { PageTitle } from '@/components/common/PageTitle'
import { Section } from '@/components/Section'
import { useTitle } from '@/hooks/title'
import { RefreshIcon } from '@/theme'

const useTicker = () => {
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [])

  return now
}

const formatDuration = (ms: number) => {
  const totalSeconds = Math.floor(ms / 1000)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  const pad = (n: number) => String(n).padStart(2, '0')

  if (hours > 0) {
    return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`
  }
  return `${pad(minutes)}:${pad(seconds)}`
}

const JobCard = ({ job }) => {
  const now = useTicker()
  return (
    <Card variant="outlined">
      <CardContent sx={{ p: 2 }}>
        <Typography sx={{ mb: 1 }}>{job.name}</Typography>
        <Typography variant="subtitle2">{formatDuration(now - job.processedOn)}</Typography>
        <LinearProgress />
      </CardContent>
    </Card>
  )
}

type Message = {
  time: Date
  message: string
  color: string
}

type Jobs = {
  active: [{ name: string; processedOn: number /* seconds since epoch */ }]
  waiting: [{ name: string }]
}

export const Updater = () => {
  const [messages, setMessages] = useState<Message[]>([])
  const [type, setType] = useState('students')
  const [jobs, setJobs] = useState<Jobs | null>(null)
  const [syntheticError, setSyntheticError] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const customListRef = useRef<HTMLInputElement>(null!)
  const jsonDataRef = useRef('')

  useTitle('Updater')

  const apiCall = async (url: string, method?: string, data?: any[]) => {
    try {
      const response = await callApi(url, method, data)
      setMessages(oldMessages => [...oldMessages, { time: new Date(), message: response.data, color: 'green' }])
    } catch {
      setMessages(oldMessages => [...oldMessages, { time: new Date(), message: 'Updater API error', color: 'red' }])
    }
  }

  const updateSISMeta = () => void apiCall('/updater/update/meta')
  const updateSISStudents = () => void apiCall('/updater/update/students')
  const updateSISProgrammes = () => void apiCall('/updater/update/programmes')
  const updateSISCustomList = () =>
    void apiCall(`/updater/update/customlist/${type}`, 'post', customListRef.current.value.trim().split('\n'))
  const refreshTeacherLeaderboardForCurrentAndPreviousYear = () =>
    void apiCall('/updater/refresh-teacher-leaderboard', 'post')
  const abortSisUpdater = () => void apiCall('/updater/abort')
  const refreshSISRedisCache = () => void apiCall('/updater/refresh_redis_cache')
  const refreshAllTeacherLeaderboards = () => void apiCall('/teachers/top', 'post')
  const refreshFaculties = () => void apiCall('/updater/refresh_faculties_v2', 'post')
  const refreshStudyProgrammes = () => void apiCall('/updater/refresh_degree_programmes_v2', 'post')
  const refreshLanguageCenterData = () => void apiCall('/updater/refresh_language_center_data', 'post')
  const refreshCloseToGraduationData = () => void apiCall('/updater/refresh-close-to-graduation', 'post')
  const removeWaitingJobs = () => void callApi('/updater/jobs', 'delete')
  const flushRedis = () => {
    void apiCall('/updater/nuke_redis')
    setDialogOpen(false)
  }

  useEffect(() => {
    const updateJobs = async () => {
      const { data } = await callApi('/updater/jobs', 'get')
      const jsonData = JSON.stringify(data)
      if (jsonData !== jsonDataRef.current) {
        jsonDataRef.current = jsonData
        setJobs(data)
      }
    }
    void updateJobs()

    const interval = setInterval(() => void updateJobs(), 5000)

    return () => clearInterval(interval)
  }, [])

  if (syntheticError) throw new Error('Admin intentionally caused frontend crash')

  return (
    <PageLayout maxWidth="lg">
      <PageTitle title="Updater" />
      <Stack spacing={2}>
        <Grid container>
          <Grid paddingRight={1} size={6}>
            <Button color="error" fullWidth onClick={() => setSyntheticError(true)} variant="contained">
              Cause frontend crash
            </Button>
          </Grid>
          <Grid paddingLeft={1} size={6}>
            <Button color="error" fullWidth onClick={() => setDialogOpen(true)} variant="contained">
              Destroy redis
            </Button>
          </Grid>
        </Grid>
        <Dialog onClose={() => setDialogOpen(false)} open={dialogOpen}>
          <DialogTitle>Completely flush redis?</DialogTitle>
          <DialogContent>
            <DialogContentText>
              Fully clears redis. This includes all cached data in updater/backend and anything BullMQ might have
              stored. Equivalent to `redis-cli flushall` in container or `npm run flushredis` in development. 99% of
              errors will be fixed by just refreshing the data for the relevant feature, e.g. faculty/study programme.
            </DialogContentText>
            <DialogActions>
              <Button color="error" onClick={() => void flushRedis()} variant="contained">
                I know what I'm doing, flush redis
              </Button>
              <Button onClick={() => setDialogOpen(false)} variant="contained">
                Go back
              </Button>
            </DialogActions>
          </DialogContent>
        </Dialog>
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
              Refresh degree programmes
            </Button>
            <Button onClick={refreshLanguageCenterData} variant="contained">
              Refresh language center data
            </Button>
            <Button onClick={refreshCloseToGraduationData} variant="contained">
              Refresh close to graduation data
            </Button>
          </Stack>

          {jobs ? (
            <Stack alignItems="flex-start" spacing={2} sx={{ width: '100%', my: 2 }}>
              <Typography variant="h6">Jobs running: {jobs.active?.length ?? 0}</Typography>
              <Grid container spacing={2}>
                {jobs.active?.map(job => (
                  <JobCard job={job} key={`${job.name}-${job.processedOn}`} />
                ))}
              </Grid>

              <Typography variant="h6">Jobs in queue: {jobs.waiting?.length ?? 0}</Typography>
              <Grid container spacing={2}>
                {jobs.waiting?.map(job => (
                  <Card key={job.name} variant="outlined">
                    <CardContent>
                      <Typography variant="body1">{job.name}</Typography>
                    </CardContent>
                  </Card>
                ))}
              </Grid>
            </Stack>
          ) : null}
        </Section>

        <Section title="Update custom list of items (students & courses in updater, programmes & faculties computed on backend)">
          <Stack alignItems="flex-start" spacing={2}>
            <TextField inputRef={customListRef} multiline rows={7} sx={{ minWidth: '30rem' }} />
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
          <Typography my={1}>
            <ExternalLink href="https://api.docs.bullmq.io/classes/v5.Queue.html#drain" text="Drain" variant="body1" />{' '}
            the backend or updater queue, including jobs started by a cron job.
          </Typography>
          <Typography my={1}>
            Jobs waiting in the backend queue are listed above under <em>Jobs waiting</em>, but jobs in the updater
            queue are not visible on this page.
          </Typography>
          <Stack direction="row" spacing={2}>
            <Button color="error" onClick={abortSisUpdater} variant="contained">
              Clear updater queue
            </Button>
            <Button color="error" onClick={removeWaitingJobs} variant="contained">
              Clear backend queue
            </Button>
          </Stack>
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
    </PageLayout>
  )
}
