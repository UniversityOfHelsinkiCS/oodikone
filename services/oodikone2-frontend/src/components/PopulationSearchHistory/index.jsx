import React, { Component, useEffect } from 'react'
import { connect } from 'react-redux'
import { func, shape, object, bool, arrayOf } from 'prop-types'
import { getTranslate } from 'react-localize-redux'
import { Form, Button } from 'semantic-ui-react'
import moment from 'moment'
import qs from 'query-string'
import Datetime from 'react-datetime'
import { get as lodashGet } from 'lodash'

import PopulationQueryCard from '../PopulationQueryCard'
import { removePopulation, updatePopulationStudents } from '../../redux/populations'
import { clearPopulationFilters } from '../../redux/populationFilters'
import TSA from '../../common/tsa'

import './populationSearchHistory.css'
import infotooltips from '../../common/InfoToolTips'
import { getTextIn } from '../../common'
import InfoBox from '../InfoBox'

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
      value: 1
    })
  }, [programmeCode])
  return null
}

class PopulationSearchHistory extends Component {
  static propTypes = {
    translate: func.isRequired,
    removePopulation: func.isRequired,
    populations: shape({
      pending: bool,
      error: bool,
      data: shape({}),
      query: object
    }).isRequired,
    units: object, // eslint-disable-line
    updatePopulationStudents: func.isRequired,
    tags: arrayOf(shape({})).isRequired,
    history: shape({}).isRequired
  }

  constructor() {
    super()
    this.state = {
      showAdvancedSettings: false,
      query: {
        studentStatuses: [],
        semesters: ['FALL', 'SPRING'],
        months: 0
      }
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
          studentStatuses: nextProps.populations.query.studentStatuses || []
        }
      })
    }
  }

  months = (year, term) => {
    const start = term === 'FALL' ? `${year}-08-01` : moment(`${year}-01-01`).add(1, 'years')
    return Math.ceil(moment.duration(moment().diff(moment(start))).asMonths())
  }

  getMonths = (year, end, term) => {
    if (moment.isMoment(end)) {
      const lastDayOfMonth = moment(end).endOf('month')
      const start = term === 'FALL' ? `${year}-08-01` : `${year}-01-01`
      return Math.round(moment.duration(moment(lastDayOfMonth).diff(moment(start))).asMonths())
    }
    return -1
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
          months: this.months(this.props.populations.query.year, semesters.includes('FALL') ? 'FALL' : 'SPRING')
        }
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
        studentStatuses
      }
    })
  }

  handleMonthsChange = value => {
    const { query } = this.state
    const months = this.getMonths(query.year, value, query.semesters.includes('FALL') ? 'FALL' : 'SPRING')
    this.setState({
      query: {
        ...query,
        months
      }
    })
  }

  getMonthValue = (year, months) => {
    const start = `${year}-08-01`
    return moment(start)
      .add(months - 1, 'months')
      .format('MMMM YYYY')
  }

  pushQueryToUrl = () => {
    const { studyRights, tag } = this.props.populations.query
    const { studentStatuses, semesters, months, year } = this.state.query
    const queryObject = {
      tag,
      year,
      months,
      studentStatuses,
      semesters,
      studyRights: JSON.stringify(studyRights)
    }
    const searchString = qs.stringify(queryObject)

    this.props.history.push({ search: searchString })
  }

  getMinSelection = (year, semester) => (semester === 'FALL' ? `${year}-08-01` : `${year}-01-01`)

  removePopulation = uuid => this.props.removePopulation(uuid)

  renderAdvancedSettingsSelector = () => {
    if (!this.state.showAdvancedSettings) {
      return null
    }
    const { query } = this.state
    const { translate, populations } = this.props
    const { semesters, studentStatuses } = query

    return (
      <Form.Group>
        <Form.Field error={query.months < 0}>
          <b>Statistics until</b>
          <Datetime
            dateFormat="MMMM YYYY"
            closeOnSelect
            defaultValue={this.getMonthValue(query.year, query.months)}
            onChange={value => this.handleMonthsChange(value)}
            isValidDate={current =>
              current.isBefore(moment()) &&
              current.isAfter(this.getMinSelection(query.year, query.semesters[1] || query.semesters[0]))
            }
          />
        </Form.Field>

        {!populations.query.tag ? (
          <Form.Field>
            <b>Semesters</b>
            <Form.Checkbox
              className="populationStatisticsRadio"
              key="FALL"
              label={translate(`populationStatistics.${'FALL'}`)}
              value="FALL"
              name="semesterGroup"
              checked={semesters.includes('FALL')}
              onChange={this.handleSemesterSelection}
            />
            <Form.Checkbox
              className="populationStatisticsRadio"
              key="SPRING"
              label={translate(`populationStatistics.${'SPRING'}`)}
              value="SPRING"
              name="semesterGroup"
              checked={semesters.includes('SPRING')}
              onChange={this.handleSemesterSelection}
            />
          </Form.Field>
        ) : null}
        <Form.Field>
          <b>Include</b>
          <Form.Checkbox
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
            key="CANCELLED"
            label="Students who haven't enrolled present nor absent"
            value="CANCELLED"
            name="studentStatusGroup"
            checked={studentStatuses.includes('CANCELLED')}
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
          />
        </Form.Field>
        <Button onClick={this.pushQueryToUrl}>Fetch population with new settings</Button>
      </Form.Group>
    )
  }

  renderQueryCards = () => {
    const { populations, translate, units, tags } = this.props
    const { showAdvancedSettings } = this.state
    const { QueryCard, Advanced } = infotooltips.PopulationStatistics
    if (!units.data.programmes || !populations.query || !populations.data.students) {
      return null
    }
    const studentNumberList = populations.data.students.map(s => s.studentNumber)
    const { programme: programmeCode, degree: degreeCode, studyTrack: studyTrackCode } = populations.query.studyRights

    return (
      <React.Fragment>
        <PopulationsQueryTSA programmeCode={programmeCode} unitData={units.data} />
        <Form.Group inline style={{ marginRight: '100px' }}>
          <InfoBox content={QueryCard} style={{ margin: 'auto' }} />
          <PopulationQueryCard
            key={`population-${populations.query.uuid}`}
            translate={translate}
            population={populations.data}
            query={populations.query}
            queryId={0}
            unit={units.data.programmes[programmeCode]} // Possibly deprecated
            units={[
              units.data.programmes[programmeCode],
              units.data.degrees[degreeCode],
              units.data.studyTracks[studyTrackCode]
            ].filter(Boolean)}
            removeSampleFn={this.removePopulation}
            updateStudentsFn={() => this.props.updatePopulationStudents(studentNumberList)}
            updating={populations.updating}
            tags={tags}
          />
        </Form.Group>
        <Form.Group>
          {showAdvancedSettings ? (
            <Form.Group>
              <InfoBox content={Advanced} />
            </Form.Group>
          ) : null}
          <Form.Field style={{ margin: 'auto' }}>
            <b>Advanced settings</b>
            <Form.Radio
              data-cy="advanced-toggle"
              toggle
              checked={showAdvancedSettings}
              onClick={() => {
                this.setState({ showAdvancedSettings: !showAdvancedSettings })
              }}
            />
          </Form.Field>
          {this.renderAdvancedSettingsSelector()}
        </Form.Group>
      </React.Fragment>
    )
  }

  render() {
    return <div className="historyContainer">{this.renderQueryCards()}</div>
  }
}

const mapStateToProps = ({ populations, populationDegreesAndProgrammes, localize, tags }) => ({
  populations,
  units: populationDegreesAndProgrammes,
  translate: getTranslate(localize),
  tags: tags.data
})

const mapDispatchToProps = dispatch => ({
  removePopulation: uuid => {
    dispatch(removePopulation(uuid))
    dispatch(clearPopulationFilters())
  },
  updatePopulationStudents: students => dispatch(updatePopulationStudents(students))
})

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(PopulationSearchHistory)
