import Button from '@mui/material/Button'
import Checkbox from '@mui/material/Checkbox'
import FormControlLabel from '@mui/material/FormControlLabel'
import FormGroup from '@mui/material/FormGroup'
import FormLabel from '@mui/material/FormLabel'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'

import { useState } from 'react'
import { useNavigate } from 'react-router'

import { populationStatisticsToolTips } from '@/common/InfoToolTips'
import { PopulationQuery } from '@/types/populationSearch'
import { queryParamsToString } from '@/util/queryparams'
import { formatToArray } from '@oodikone/shared/util'
import { InfoBox } from '../material/InfoBox'

type AdvancedSettingsProps = {
  query: PopulationQuery
  cleanUp: () => void
}

export const AdvancedSettings = ({ query, cleanUp }: AdvancedSettingsProps) => {
  const { studentStatuses: queryStudentStatuses, semesters: querySemesters, tag, ...rest } = query
  const navigate = useNavigate()

  const [semesters, setSemesters] = useState<string[]>(
    querySemesters ? formatToArray(querySemesters) : ['FALL', 'SPRING']
  )
  const [studentStatuses, setStudentStatuses] = useState<string[]>(queryStudentStatuses ?? [])

  const handleSemesterSelection = ({ target: { name } }: React.ChangeEvent<HTMLInputElement>) => {
    if (!tag) {
      const newSemesters = semesters.includes(name) ? semesters.filter(sem => sem !== name) : [...semesters, name]
      setSemesters(newSemesters)
    }
  }

  const handleStudentStatusSelection = ({ target: { name } }: React.ChangeEvent<HTMLInputElement>) => {
    const newStatuses = studentStatuses.includes(name)
      ? studentStatuses.filter(status => status !== name)
      : [...studentStatuses, name]
    setStudentStatuses(newStatuses)
  }

  const pushQueryToUrl = () => {
    const queryObject = {
      ...rest,
      studentStatuses,
      semesters,
      tag,
    }
    const searchString = queryParamsToString(queryObject)
    void navigate({ search: searchString })
    cleanUp()
  }

  return (
    <Paper sx={{ p: '1em', m: '0.5em', textAlign: 'left' }} variant="outlined">
      <Stack direction="row" gap={2}>
        <FormGroup>
          <FormLabel component="legend">
            Include <InfoBox content={populationStatisticsToolTips.advanced.include} mini />
          </FormLabel>
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
        {!tag && (
          <FormGroup sx={{ width: 'fit-content' }}>
            <FormLabel component="legend">
              Starting semesters <InfoBox content={populationStatisticsToolTips.advanced.semesters} mini />
            </FormLabel>
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
