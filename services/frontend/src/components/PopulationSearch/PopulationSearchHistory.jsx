/* eslint-disable babel/no-invalid-this, class-methods-use-this */
import React, { useEffect, useState } from 'react'
import { connect } from 'react-redux'
import { func, shape, object, bool, arrayOf } from 'prop-types'
import { Form, Button } from 'semantic-ui-react'
import moment from 'moment'
import qs from 'query-string'
import { get as lodashGet } from 'lodash'
import PopulationQueryCard from '../PopulationQueryCard'
import { removePopulation } from '../../redux/populations'
import TSA from '../../common/tsa'
import './populationSearch.css'
import infotooltips from '../../common/InfoToolTips'
import { getTextIn } from '../../common'
import InfoBox from '../Info/InfoBox'
import FilterActiveNote from './FilterActiveNote'

const PopulationsQueryTSA = ({ programmeCode, unitData }) => {
  // hack: I wanna use useEffect because it's handy but PopulationSearchHistory is not a function component
  // so here's a component that renders nothing that we can just plug in
  useEffect(() => {
    if (!programmeCode) {
      return
    }

    const programmeNameData = lodashGet(unitData, ['programmes', programmeCode, 'name'])
    const programme = programmeNameData && getTextIn(unitData.programmes[programmeCode].name, 'fi')

    if (!programme) {
      return
    }

    TSA.Matomo.sendEvent('Programme Usage', 'populations query', programme)
    TSA.Influx.sendEvent({
      group: 'Programme Usage',
      name: 'populations query',
      label: programme,
      value: 1,
    })
  }, [programmeCode])
  return null
}

const getMonths = (year, term) => {
  const start = term === 'FALL' ? `${year}-08-01` : moment(`${year}-01-01`).add(1, 'years')
  return Math.ceil(moment.duration(moment().diff(moment(start))).asMonths())
}

const PopulationSearchHistory = props => {
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false)
  const [semesters, setSemesters] = useState(
    props.populations.query?.semesters ? props.populations.query?.semesters : ['FALL', 'SPRING']
  )
  const [studentStatuses, setStudentStatus] = useState(
    props.populations.query?.studentStatuses ? props.populations.query?.studentStatuses : []
  )
  const [months, setMonths] = useState(props.populations.query?.months ? props.populations.query?.months : 0)

  const handleSemesterSelection = (e, { value }) => {
    e.preventDefault()
    const newSemesters = semesters.includes(value) ? semesters.filter(s => s !== value) : [...semesters, value]
    if (props.tags.length < 1) {
      setSemesters(newSemesters)
      setMonths(getMonths(props.populations.query.year, semesters.includes('FALL') ? 'FALL' : 'SPRING'))
    }
  }

  const handleStudentStatusSelection = (e, { value }) => {
    e.preventDefault()
    setStudentStatus(
      studentStatuses.includes(value) ? studentStatuses.filter(s => s !== value) : [...studentStatuses, value]
    )
  }

  const pushQueryToUrl = () => {
    const { studyRights, tags, year } = props.populations.query

    const queryObject = {
      tags,
      year,
      months,
      studentStatuses,
      semesters,
      studyRights: JSON.stringify(studyRights),
    }
    const searchString = qs.stringify(queryObject)
    props.history.push({ search: searchString })
  }

  const removeThisPopulation = uuid => props.removePopulation(uuid)

  const renderAdvancedSettingsSelector = () => {
    if (!showAdvancedSettings) {
      return null
    }
    const { populations } = props

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
    const { populations, units, tags } = props
    const { Advanced, QueryCard } = infotooltips.PopulationStatistics

    if (!units.data.programmes || !populations.query || !populations.data.students) {
      return null
    }
    const { programme: programmeCode, studyTrack: studyTrackCode } = populations.query.studyRights

    // I'm sorry about the awful layout fix but we are going to rework this whole area from ground up, so no point in wasting more time now.
    return (
      <div style={{ display: 'flex', flexDirection: 'row', width: '100%' }}>
        <div>
          <PopulationsQueryTSA programmeCode={programmeCode} unitData={units.data} />
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
            <InfoBox content={QueryCard} />
          </div>
        </div>
        <div style={{ marginLeft: '100px' }}>
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
          <div>{renderAdvancedSettingsSelector()}</div>
          <div>{showAdvancedSettings ? <InfoBox content={Advanced} /> : <FilterActiveNote />}</div>
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
  history: shape({}).isRequired,
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

export default connect(mapStateToProps, mapDispatchToProps)(PopulationSearchHistory)
