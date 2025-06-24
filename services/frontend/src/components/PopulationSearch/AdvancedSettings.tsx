import Button from '@mui/material/Button'
import Checkbox from '@mui/material/Checkbox'
import FormControlLabel from '@mui/material/FormControlLabel'
import FormGroup from '@mui/material/FormGroup'
import FormLabel from '@mui/material/FormLabel'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'

import { useState } from 'react'
import { useNavigate } from 'react-router'

import { queryParamsToString } from '@/util/queryparams'
import { formatToArray } from '@oodikone/shared/util'
import { getMonths } from './common'

export const AdvancedSettings = ({ query, cleanUp }) => {
  const navigate = useNavigate()

  const [semesters, setSemesters] = useState(
    query.semesters.length ? formatToArray(query.semesters) : ['FALL', 'SPRING']
  )
  const [studentStatuses, setStudentStatuses] = useState(query.studentStatuses)
  const [months, setMonths] = useState(query.months ?? 0)

  const handleSemesterSelection = ({ target: { name } }: React.ChangeEvent<HTMLInputElement>) => {
    if (!query.tag) {
      const newSemesters = semesters.includes(name) ? semesters.filter(sem => sem !== name) : [...semesters, name]
      const newMonths = getMonths(query.year, semesters.includes('FALL') ? 'FALL' : 'SPRING')
      setSemesters(newSemesters)
      setMonths(newMonths)
    }
  }

  const handleStudentStatusSelection = ({ target: { name } }: React.ChangeEvent<HTMLInputElement>) => {
    const newStatuses = studentStatuses.includes(name)
      ? studentStatuses.filter(status => status !== name)
      : [...studentStatuses, name]
    setStudentStatuses(newStatuses)
  }

  const pushQueryToUrl = () => {
    const { studyRights, tag, year } = query

    const queryObject = {
      tag,
      year,
      months,
      studentStatuses,
      semesters,
      studyRights: JSON.stringify(studyRights),
    }
    const searchString = queryParamsToString(queryObject)
    void navigate({ search: searchString })
    cleanUp()
  }

  return (
    <Paper sx={{ padding: '1rem', mt: '1rem', mr: '30px' }} variant="outlined">
      <Stack direction="row" gap={2}>
        <FormGroup>
          <FormLabel component="legend">Include</FormLabel>
          <FormControlLabel
            control={
              <Checkbox
                checked={studentStatuses.includes('EXCHANGE')}
                name="EXCHANGE"
                onChange={handleStudentStatusSelection}
              />
            }
            label="Exchange students"
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={studentStatuses.includes('NONDEGREE')}
                name="NONDEGREE"
                onChange={handleStudentStatusSelection}
              />
            }
            label="Students with non-degree study right"
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={studentStatuses.includes('TRANSFERRED')}
                name="TRANSFERRED"
                onChange={handleStudentStatusSelection}
              />
            }
            label="Students who have transferred out of the programme"
          />
        </FormGroup>
        {!query.tag && (
          <FormGroup sx={{ width: 'fit-content' }}>
            <FormLabel component="legend">Starting semesters</FormLabel>
            <FormControlLabel
              control={
                <Checkbox
                  checked={semesters.includes('FALL')}
                  data-cy="toggle-fall"
                  name="FALL"
                  onChange={handleSemesterSelection}
                />
              }
              label="Fall"
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={semesters.includes('SPRING')}
                  data-cy="toggle-spring"
                  name="SPRING"
                  onChange={handleSemesterSelection}
                />
              }
              label="Spring"
            />
          </FormGroup>
        )}
      </Stack>
      <Button onClick={pushQueryToUrl} sx={{ mt: '15px' }} variant="contained">
        Fetch class with new settings
      </Button>
    </Paper>
  )
}
