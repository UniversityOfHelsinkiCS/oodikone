import moment from 'moment'
import { func, shape, object, bool, arrayOf } from 'prop-types'
import qs from 'query-string'
import React, { useState } from 'react'
import { connect } from 'react-redux'
import { useHistory } from 'react-router-dom'
import { Form, Button } from 'semantic-ui-react'

import { populationStatisticsToolTips } from '@/common/InfoToolTips'
import { removePopulation } from '@/redux/populations'
import { InfoBox } from '../Info/InfoBox'
import { PopulationQueryCard } from '../PopulationQueryCard'
import { FilterActiveNote } from './FilterActiveNote'
import './populationSearch.css'

const getMonths = (year, term) => {
  const start = term === 'FALL' ? `${year}-08-01` : moment(`${year}-01-01`).add(1, 'years')
  return Math.ceil(moment.duration(moment().diff(moment(start))).asMonths())
}

const PopulationSearchHistory = ({ populations, units, tags, removePopulation }) => {
  const history = useHistory()
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false)
  const [semesters, setSemesters] = useState(
    populations.query?.semesters ? populations.query?.semesters : ['FALL', 'SPRING']
  )
  const [studentStatuses, setStudentStatus] = useState(
    populations.query?.studentStatuses ? populations.query?.studentStatuses : []
  )
  const [months, setMonths] = useState(populations.query?.months ? populations.query?.months : 0)

  const handleSemesterSelection = (e, { value }) => {
    const newSemesters = semesters.includes(value) ? semesters.filter(s => s !== value) : [...semesters, value]
    if (!populations.query.tag) {
      setSemesters(newSemesters)
      setMonths(getMonths(populations.query.year, semesters.includes('FALL') ? 'FALL' : 'SPRING'))
    }
  }

  const handleStudentStatusSelection = (e, { value }) => {
    setStudentStatus(
      studentStatuses.includes(value) ? studentStatuses.filter(s => s !== value) : [...studentStatuses, value]
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
    history.push({ search: searchString })
  }

  const removeThisPopulation = uuid => removePopulation(uuid)

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
              className="populationStatisticsRadio"
              key="FALL"
              label="Fall"
              value="FALL"
              name="semesterGroup"
              checked={semesters.includes('FALL')}
              onChange={handleSemesterSelection}
              data-cy="toggle-fall"
            />
            <Form.Checkbox
              className="populationStatisticsRadio"
              key="SPRING"
              label="Spring"
              value="SPRING"
              name="semesterGroup"
              checked={semesters.includes('SPRING')}
              onChange={handleSemesterSelection}
              data-cy="toggle-spring"
            />
          </Form.Field>
        ) : null}
        <Form.Field style={{ marginTop: '15px' }}>
          <b>Include</b>
          {/* Investigate why not working 
            <Form.Checkbox
            className="populationStatisticsRadio"
            key="EXCHANGE"
            label="Exchange students"
            value="EXCHANGE"
            name="studentStatusGroup"
            checked={studentStatuses.includes('EXCHANGE')}
            onChange={handleStudentStatusSelection}
          />
          <Form.Checkbox
            className="populationStatisticsRadio"
            key="NONDEGREE"
            label="Students with non-degree study right"
            value="NONDEGREE"
            name="studentStatusGroup"
            checked={studentStatuses.includes('NONDEGREE')}
            onChange={handleStudentStatusSelection}
          /> */}
          <Form.Checkbox
            className="populationStatisticsRadio"
            key="TRANSFERRED"
            label="Students who have transferred out of the programme"
            value="TRANSFERRED"
            name="studentStatusGroup"
            checked={studentStatuses.includes('TRANSFERRED')}
            onChange={handleStudentStatusSelection}
          />
        </Form.Field>
        <Form.Field style={{ marginTop: '15px' }}>
          <Button type="button" onClick={pushQueryToUrl}>
            Fetch class with new settings
          </Button>
        </Form.Field>
      </Form.Group>
    )
  }

  const renderQueryCards = () => {
    if (!units.data.programmes || !populations.query || !populations.data.students) {
      return null
    }
    const { programme: programmeCode, studyTrack: studyTrackCode } = populations.query.studyRights

    // I'm sorry about the awful layout fix but we are going to rework this whole area from ground up, so no point in wasting more time now.
    return (
      <div style={{ display: 'flex', flexDirection: 'row', width: '100%' }}>
        <div>
          <PopulationQueryCard
            key={`population-${populations.query.uuid}`}
            population={populations.data}
            query={populations.query}
            queryId={0}
            units={[units.data.programmes[programmeCode], units.data.studyTracks[studyTrackCode]].filter(Boolean)}
            removeSampleFn={removeThisPopulation}
            updating={populations.updating}
            tags={tags}
          />
          <div style={{ marginLeft: '5px', marginTop: '15px' }}>
            <InfoBox content={populationStatisticsToolTips.QueryCard} />
          </div>
        </div>
        <div style={{ marginLeft: '100px' }}>
          {populations.query.year !== 'All' && (
            <Form.Group>
              <Form.Field>
                <Form.Radio
                  data-cy="advanced-toggle"
                  toggle
                  checked={showAdvancedSettings}
                  onClick={() => setShowAdvancedSettings(!showAdvancedSettings)}
                  label="Advanced settings"
                />
              </Form.Field>
            </Form.Group>
          )}
          <div>{renderAdvancedSettingsSelector()}</div>
          <div>
            {showAdvancedSettings ? <InfoBox content={populationStatisticsToolTips.Advanced} /> : <FilterActiveNote />}
          </div>
        </div>
      </div>
    )
  }

  return <div className="historyContainer">{renderQueryCards()}</div>
}

PopulationSearchHistory.propTypes = {
  removePopulation: func.isRequired,
  populations: shape({
    pending: bool,
    error: bool,
    data: shape({}),
    query: object,
  }).isRequired,
  units: object, // eslint-disable-line
  tags: arrayOf(shape({})).isRequired,
}

const mapStateToProps = ({ populations, populationProgrammes, tags }) => ({
  populations,
  units: populationProgrammes,
  tags: tags.data,
})

const mapDispatchToProps = dispatch => ({
  removePopulation: uuid => {
    dispatch(removePopulation(uuid))
  },
})

export const ConnectedPopulationSearchHistory = connect(mapStateToProps, mapDispatchToProps)(PopulationSearchHistory)
