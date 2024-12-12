import qs from 'query-string'
import { useState } from 'react'
import { useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { Button, Form } from 'semantic-ui-react'

import { populationStatisticsToolTips } from '@/common/InfoToolTips'
import { InfoBox } from '@/components/InfoBox'
import { PopulationQueryCard } from '@/components/PopulationQueryCard'
import { getMonths } from './common'
import { FilterActiveNote } from './FilterActiveNote'
import './populationSearch.css'

export const PopulationSearchHistory = () => {
  const navigate = useNavigate()
  const populations = useSelector(state => state.populations)
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false)
  const [semesters, setSemesters] = useState(populations.query?.semesters || ['FALL', 'SPRING'])
  const [studentStatuses, setStudentStatus] = useState(populations.query?.studentStatuses || [])
  const [months, setMonths] = useState(populations.query?.months || 0)

  const handleSemesterSelection = (_event, { value }) => {
    const newSemesters = semesters.includes(value)
      ? semesters.filter(semester => semester !== value)
      : [...semesters, value]
    if (!populations.query.tag) {
      setSemesters(newSemesters)
      setMonths(getMonths(populations.query.year, semesters.includes('FALL') ? 'FALL' : 'SPRING'))
    }
  }

  const handleStudentStatusSelection = (_event, { value }) => {
    setStudentStatus(
      studentStatuses.includes(value) ? studentStatuses.filter(status => status !== value) : [...studentStatuses, value]
    )
  }

  const pushQueryToUrl = () => {
    const { studyRights, tag, year } = populations.query

    const queryObject = {
      tag,
      year,
      months,
      studentStatuses,
      semesters,
      studyRights: JSON.stringify(studyRights),
    }
    const searchString = qs.stringify(queryObject)
    void navigate({ search: searchString })
  }

  const renderAdvancedSettingsSelector = () => {
    if (!showAdvancedSettings) {
      return null
    }

    return (
      <Form.Group style={{ flexDirection: 'column' }}>
        {!populations.query.tag ? (
          <Form.Field style={{ marginTop: '15px' }}>
            <b>Starting semesters</b>
            <Form.Checkbox
              checked={semesters.includes('FALL')}
              className="populationStatisticsRadio"
              data-cy="toggle-fall"
              key="FALL"
              label="Fall"
              name="semesterGroup"
              onChange={handleSemesterSelection}
              value="FALL"
            />
            <Form.Checkbox
              checked={semesters.includes('SPRING')}
              className="populationStatisticsRadio"
              data-cy="toggle-spring"
              key="SPRING"
              label="Spring"
              name="semesterGroup"
              onChange={handleSemesterSelection}
              value="SPRING"
            />
          </Form.Field>
        ) : null}
        <Form.Field style={{ marginTop: '15px' }}>
          <b>Include</b>
          <Form.Checkbox
            checked={studentStatuses.includes('EXCHANGE')}
            className="populationStatisticsRadio"
            key="EXCHANGE"
            label="Exchange students"
            name="studentStatusGroup"
            onChange={handleStudentStatusSelection}
            value="EXCHANGE"
          />
          <Form.Checkbox
            checked={studentStatuses.includes('NONDEGREE')}
            className="populationStatisticsRadio"
            key="NONDEGREE"
            label="Students with non-degree study right"
            name="studentStatusGroup"
            onChange={handleStudentStatusSelection}
            value="NONDEGREE"
          />
          <Form.Checkbox
            checked={studentStatuses.includes('TRANSFERRED')}
            className="populationStatisticsRadio"
            key="TRANSFERRED"
            label="Students who have transferred out of the programme"
            name="studentStatusGroup"
            onChange={handleStudentStatusSelection}
            value="TRANSFERRED"
          />
        </Form.Field>
        <Form.Field style={{ marginTop: '15px' }}>
          <Button onClick={pushQueryToUrl} type="button">
            Fetch class with new settings
          </Button>
        </Form.Field>
      </Form.Group>
    )
  }

  const renderQueryCards = () => {
    if (!populations.query || !populations.data.students) {
      return null
    }

    // I'm sorry about the awful layout fix but we are going to rework this whole area from ground up, so no point in wasting more time now.
    return (
      <div style={{ display: 'flex', flexDirection: 'row', width: '100%' }}>
        <div>
          <PopulationQueryCard population={populations.data} query={populations.query} />
          <div style={{ marginLeft: '5px', marginTop: '15px' }}>
            <InfoBox content={populationStatisticsToolTips.advanced} />
          </div>
        </div>
        <div style={{ marginLeft: '100px' }}>
          {populations.query.year !== 'All' && (
            <Form.Group>
              <Form.Field>
                <Form.Radio
                  checked={showAdvancedSettings}
                  data-cy="advanced-toggle"
                  label="Advanced settings"
                  onClick={() => setShowAdvancedSettings(!showAdvancedSettings)}
                  toggle
                />
              </Form.Field>
            </Form.Group>
          )}
          {renderAdvancedSettingsSelector()}
          <FilterActiveNote />
        </div>
      </div>
    )
  }

  return <div className="historyContainer">{renderQueryCards()}</div>
}
