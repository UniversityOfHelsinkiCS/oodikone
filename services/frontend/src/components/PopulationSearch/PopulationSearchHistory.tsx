import Button from '@mui/material/Button'
import Checkbox from '@mui/material/Checkbox'
import FormControlLabel from '@mui/material/FormControlLabel'
import FormGroup from '@mui/material/FormGroup'
import FormLabel from '@mui/material/FormLabel'
import Stack from '@mui/material/Stack'
import Switch from '@mui/material/Switch'
import { useState } from 'react'
import { useNavigate } from 'react-router'

import { populationStatisticsToolTips } from '@/common/InfoToolTips'
import { InfoBox } from '@/components/InfoBox'
import { PopulationQueryCard } from '@/components/PopulationQueryCard'
import { queryParamsToString } from '@/util/queryparams'
import { formatToArray } from '@oodikone/shared/util'
import { getMonths } from './common'
import { FilterActiveNote } from './FilterActiveNote'
import './populationSearch.css'

export const PopulationSearchHistory = ({ query, skipQuery }) => {
  const navigate = useNavigate()

  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false)
  const [semesters, setSemesters] = useState(
    query.semesters.length ? formatToArray(query.semesters) : ['FALL', 'SPRING']
  )
  const [studentStatuses, setStudentStatuses] = useState(query.studentStatuses)
  const [months, setMonths] = useState(query.months ?? 0)

  const handleSemesterSelection = ({ target: { name } }: React.ChangeEvent<HTMLInputElement>) => {
    const newSemesters = semesters.includes(name) ? semesters.filter(sem => sem !== name) : [...semesters, name]
    if (!query.tag) {
      setSemesters(newSemesters)
      setMonths(getMonths(query.year, semesters.includes('FALL') ? 'FALL' : 'SPRING'))
    }
  }

  const handleStudentStatusSelection = ({ target: { name } }: React.ChangeEvent<HTMLInputElement>) => {
    setStudentStatuses(
      studentStatuses.includes(name) ? studentStatuses.filter(status => status !== name) : [...studentStatuses, name]
    )
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
  }

  const AdvancedSettingsSelector = () => (
    <FormGroup>
      {!query.tag && (
        <>
          <FormLabel component="legend" sx={{ mt: '15px' }}>
            Starting semesters
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
        </>
      )}
      <>
        <FormLabel component="legend" sx={{ mt: '15px' }}>
          Include
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
        <Button onClick={pushQueryToUrl} sx={{ mt: '15px' }} variant="outlined">
          Fetch class with new settings
        </Button>
      </>
    </FormGroup>
  )

  const QueryCards = () => (
    <Stack direction="row" gap={5}>
      <div>
        <PopulationQueryCard query={query} skipQuery={skipQuery} />
        <div style={{ marginLeft: '5px', marginTop: '15px' }}>
          <InfoBox content={populationStatisticsToolTips.advanced} />
        </div>
      </div>

      <Stack direction="column">
        {query.year !== 'All' && (
          <FormControlLabel
            control={
              <Switch
                checked={showAdvancedSettings}
                data-cy="advanced-toggle"
                onClick={() => setShowAdvancedSettings(!showAdvancedSettings)}
              />
            }
            label="Advanced settings"
          />
        )}
        {showAdvancedSettings && <AdvancedSettingsSelector />}
        <FilterActiveNote />
      </Stack>
    </Stack>
  )

  return <div className="historyContainer">{Object.keys(query).length && <QueryCards />}</div>
}
