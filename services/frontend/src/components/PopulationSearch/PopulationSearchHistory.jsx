/* eslint-disable babel/no-invalid-this, class-methods-use-this */
import React, { Component, useEffect } from 'react'
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

class PopulationSearchHistory extends Component {
  static propTypes = {
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

  constructor() {
    super()
    this.state = {
      showAdvancedSettings: false,
      query: {
        studentStatuses: [],
        semesters: ['FALL', 'SPRING'],
        months: 0,
      },
    }
  }

  componentWillReceiveProps(nextProps) {
    const { query } = this.state
    if (nextProps.populations.query) {
      this.setState({
        query: {
          ...query,
          months: nextProps.populations.query.months,
          year: nextProps.populations.query.year,
          semesters: nextProps.populations.query.semesters,
          studentStatuses: nextProps.populations.query.studentStatuses || [],
        },
      })
    }
  }

  months = (year, term) => {
    const start = term === 'FALL' ? `${year}-08-01` : moment(`${year}-01-01`).add(1, 'years')
    return Math.ceil(moment.duration(moment().diff(moment(start))).asMonths())
  }

  handleSemesterSelection = (e, { value }) => {
    const { query } = this.state
    const semesters = query.semesters.includes(value)
      ? query.semesters.filter(s => s !== value)
      : [...query.semesters, value]
    if (!query.tag) {
      this.setState({
        query: {
          ...query,
          semesters,
          months: this.months(this.props.populations.query.year, semesters.includes('FALL') ? 'FALL' : 'SPRING'),
        },
      })
    }
  }

  handleStudentStatusSelection = (e, { value }) => {
    const { query } = this.state
    const studentStatuses = query.studentStatuses.includes(value)
      ? query.studentStatuses.filter(s => s !== value)
      : [...query.studentStatuses, value]
    this.setState({
      query: {
        ...query,
        studentStatuses,
      },
    })
  }

  pushQueryToUrl = () => {
    const { studyRights, tag, years } = this.props.populations.query
    const { studentStatuses, semesters, months, year } = this.state.query

    const queryObject = {
      tag,
      year,
      months,
      studentStatuses,
      semesters,
      studyRights: JSON.stringify(studyRights),
      years,
    }
    const searchString = qs.stringify(queryObject)

    this.props.history.push({ search: searchString })
  }

  removePopulation = uuid => this.props.removePopulation(uuid)

  renderAdvancedSettingsSelector = () => {
    if (!this.state.showAdvancedSettings) {
      return null
    }
    const { query } = this.state
    const { populations } = this.props
    const { semesters, studentStatuses } = query

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
              onChange={this.handleSemesterSelection}
              data-cy="toggle-fall"
            />
            <Form.Checkbox
              className="populationStatisticsRadio"
              key="SPRING"
              label="Spring"
              value="SPRING"
              name="semesterGroup"
              checked={semesters.includes('SPRING')}
              onChange={this.handleSemesterSelection}
              data-cy="toggle-spring"
            />
          </Form.Field>
        ) : null}
        <Form.Field style={{ marginTop: '15px' }}>
          <b>Include</b>
          {/* Hide buggy options for now */}
          {/* <Form.Checkbox
            className="populationStatisticsRadio"
            key="EXCHANGE"
            label="Exchange students"
            value="EXCHANGE"
            name="studentStatusGroup"
            checked={studentStatuses.includes('EXCHANGE')}
            onChange={this.handleStudentStatusSelection}
          />
          <Form.Checkbox
            className="populationStatisticsRadio"
            key="NONDEGREE"
            label="Students with non-degree study right"
            value="NONDEGREE"
            name="studentStatusGroup"
            checked={studentStatuses.includes('NONDEGREE')}
            onChange={this.handleStudentStatusSelection}
          /> */}
          <Form.Checkbox
            className="populationStatisticsRadio"
            key="TRANSFERRED"
            label="Students who have transferred out of the programme"
            value="TRANSFERRED"
            name="studentStatusGroup"
            checked={studentStatuses.includes('TRANSFERRED')}
            onChange={this.handleStudentStatusSelection}
          />
        </Form.Field>
        <Form.Field style={{ marginTop: '15px' }}>
          <Button type="button" onClick={this.pushQueryToUrl}>
            Fetch class with new settings
          </Button>
        </Form.Field>
      </Form.Group>
    )
  }

  renderQueryCards = () => {
    const { populations, units, tags } = this.props
    const { showAdvancedSettings } = this.state
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
            removeSampleFn={this.removePopulation}
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
                onClick={() => {
                  this.setState({ showAdvancedSettings: !showAdvancedSettings })
                }}
                label="Advanced settings"
              />
            </Form.Field>
          </Form.Group>
          <div>{this.renderAdvancedSettingsSelector()}</div>
          <div>{showAdvancedSettings ? <InfoBox content={Advanced} /> : <FilterActiveNote />}</div>
        </div>
      </div>
    )
  }

  render() {
    return <div className="historyContainer">{this.renderQueryCards()}</div>
  }
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
