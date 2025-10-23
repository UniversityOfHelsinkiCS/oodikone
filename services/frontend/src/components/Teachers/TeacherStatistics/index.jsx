import Alert from '@mui/material/Alert'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import MenuItem from '@mui/material/MenuItem'
import Paper from '@mui/material/Paper'
import Select from '@mui/material/Select'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'

import { useState } from 'react'

import { getCurrentSemester } from '@/common'
import { useLanguage } from '@/components/LanguagePicker/useLanguage'
import { TeacherStatisticsTable } from '@/components/Teachers/TeacherStatisticsTable'
import { useGetAuthorizedUserQuery } from '@/redux/auth'
import { useGetProvidersQuery } from '@/redux/providers'
import { useGetSemestersQuery } from '@/redux/semesters'
import { useLazyGetTeacherStatisticsQuery } from '@/redux/teachers'
import { getFullStudyProgrammeRights, hasFullAccessToTeacherData } from '@/util/access'
import { createLocaleComparator } from '@/util/comparator'
import { mapToProviders } from '@oodikone/shared/util'

export const TeacherStatistics = () => {
  const { getTextIn } = useLanguage()
  const [semesterStart, setSemesterStart] = useState(null)
  const [semesterEnd, setSemesterEnd] = useState(null)
  const [providers, setProviders] = useState([])
  const { programmeRights, roles, iamGroups } = useGetAuthorizedUserQuery()
  const fullStudyProgrammeRights = getFullStudyProgrammeRights(programmeRights)
  const [getTeacherStatistics, { data: teacherData, isFetching, isLoading }] = useLazyGetTeacherStatisticsQuery()
  const { data: providersData = [] } = useGetProvidersQuery()
  const { data: semesterData } = useGetSemestersQuery()
  const { semesters: allSemesters } = semesterData ?? { semesters: {} }

  const semesters = Object.values(allSemesters)
    .reverse()
    .map(({ semestercode, name }, index) => ({
      key: index,
      value: semestercode,
      text: getTextIn(name),
    }))

  const setStartSemester = event => {
    const { value } = event.target

    setSemesterStart(value)
    if (semesterEnd <= value) {
      setSemesterEnd(value)
    }
  }

  const setEndSemester = event => {
    const { value } = event.target

    setSemesterEnd(value)
  }

  const changeProviders = event => {
    const { value } = event.target

    setProviders(value)
  }

  const teacherStats = teacherData
    ? Object.values(teacherData).map(teacher => ({
        id: teacher.id,
        name: teacher.name,
        credits: teacher.stats.credits,
        passed: teacher.stats.passed,
        failed: teacher.stats.failed,
        transferred: teacher.stats.transferred,
      }))
    : []

  const currentSemesterCode = getCurrentSemester(allSemesters)?.semestercode

  const userProviders = mapToProviders(fullStudyProgrammeRights)
  const invalidQueryParams = providers.length === 0 || !semesterStart
  const providerOptions = hasFullAccessToTeacherData(roles, iamGroups)
    ? providersData
    : providersData.filter(provider => userProviders.includes(provider.code))
  const localizedProviderOptions = providerOptions
    .map(({ name, code }) => ({
      key: code,
      value: code,
      text: getTextIn(name),
      description: code,
    }))
    .sort(createLocaleComparator('text'))

  return (
    <>
      <Alert icon={false} severity="info" variant="outlined">
        <Typography variant="h6">Teacher statistics by course providers</Typography>
        Statistics for teachers who admitted credits during or between the selected semesters for one of the specified
        course providers. This is determined by the acceptor person(s) of the attainment. While the acceptor person is
        often the responsible teacher for the course, this is not always the case. If an attainment has multiple
        acceptors, the full amount of credits is given to each acceptor (i.e., the credits are <b>not</b> divided
        between the acceptors).
      </Alert>
      <Paper sx={{ padding: 2 }}>
        <Stack gap={1}>
          <Stack flexDirection="row" gap={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Start semester</InputLabel>
              <Select onChange={setStartSemester} value={semesterStart ?? ''} variant="outlined">
                {semesters
                  .filter(semester => semester.value <= currentSemesterCode)
                  .map(({ key, value, text }) => (
                    <MenuItem key={key} value={value}>
                      {text}
                    </MenuItem>
                  ))}
              </Select>
            </FormControl>

            <FormControl fullWidth size="small">
              <InputLabel>End semester</InputLabel>
              <Select disabled={!semesterStart} onChange={setEndSemester} value={semesterEnd ?? ''} variant="outlined">
                {semesters
                  .filter(semester => semester.value <= currentSemesterCode)
                  .map(({ key, value, text }) => (
                    <MenuItem key={key} value={value}>
                      {text}
                    </MenuItem>
                  ))}
              </Select>
            </FormControl>
          </Stack>

          <FormControl fullWidth size="small">
            <InputLabel>Course providers</InputLabel>
            <Select multiple onChange={changeProviders} value={providers ?? ''} variant="outlined">
              {localizedProviderOptions.map(({ key, value, text, description }) => (
                <MenuItem key={key} value={value}>
                  {text} {description}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Button
            disabled={invalidQueryParams}
            fullWidth
            onClick={() => void getTeacherStatistics({ semesterStart, semesterEnd, providers })}
            variant="outlined"
          >
            Search
          </Button>
        </Stack>
      </Paper>
      {(isLoading || isFetching) && teacherStats.length === 0 ? <CircularProgress /> : null}
      {!isLoading && !isFetching && teacherData && teacherStats.length === 0 ? (
        <Alert icon={false} severity="info" variant="outlined">
          No teachers found
        </Alert>
      ) : null}
      {teacherStats.length > 0 && <TeacherStatisticsTable statistics={teacherStats} variant="leaderboard" />}
    </>
  )
}
