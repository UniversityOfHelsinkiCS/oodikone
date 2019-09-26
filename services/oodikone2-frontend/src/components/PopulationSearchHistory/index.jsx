import React, { Component } from 'react'
import { connect } from 'react-redux'
import { func, shape, object, bool, arrayOf } from 'prop-types'
import { getTranslate } from 'react-localize-redux'
import { Form, Button } from 'semantic-ui-react'
import moment from 'moment'
import qs from 'query-string'

import PopulationQueryCard from '../PopulationQueryCard'
import { removePopulation, updatePopulationStudents } from '../../redux/populations'
import { clearPopulationFilters } from '../../redux/populationFilters'

import './populationSearchHistory.css'
import infotooltips from '../../common/InfoToolTips'
import InfoBox from '../InfoBox'

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
    this.setState({
      query: {
        ...query,
        months: nextProps.populations.query.months,
        endYear: nextProps.populations.query.endYear,
        startYear: nextProps.populations.query.startYear,
        semesters: nextProps.populations.query.semesters,
        studentStatuses: nextProps.populations.query.studentStatuses || []
      }
    })
  }

  months = (year, term) => {
    const start = term === 'FALL' ? `${year}-08-01` : moment(`${year}-01-01`).add(1, 'years')
    return Math.ceil(moment.duration(moment().diff(moment(start))).asMonths())
  }

  getMonths = (startYear, end, term) => {
    if (moment.isMoment(end)) {
      const lastDayOfMonth = moment(end).endOf('month')
      const start = term === 'FALL' ? `${startYear}-08-01` : `${startYear}-01-01`
      return Math.round(moment.duration(moment(lastDayOfMonth).diff(moment(start))).asMonths())
    }
    return -1
  }

  handleSemesterSelection = (e, { value }) => {
    const { query } = this.state
    console.log(query.tag)
    const semesters = query.semesters.includes(value)
      ? query.semesters.filter(s => s !== value)
      : [...query.semesters, value]
    if (!query.tag) {
      this.setState({
        query: {
          ...query,
          semesters,
          months: this.months(this.props.populations.query.startYear, semesters.includes('FALL') ? 'FALL' : 'SPRING')
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

  pushQueryToUrl = () => {
    const { studyRights, tag } = this.props.populations.query
    const { studentStatuses, semesters, months, endYear, startYear } = this.state.query
    const queryObject = {
      tag,
      endYear,
      startYear,
      months,
      studentStatuses,
      semesters,
      studyRights: JSON.stringify(studyRights)
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
    const { translate, populations } = this.props
    const { semesters, studentStatuses } = query

    return (
      <div>
        <Form.Group>
          {!populations.query.tag ? (
            <Form.Field>
              <label>Semesters</label>
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
            <label>Include</label>
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
              label="Students with cancelled study right"
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
      </div>
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
    return (
      <React.Fragment>
        <PopulationQueryCard
          key={`population-${populations.query.uuid}`}
          translate={translate}
          population={populations.data}
          query={populations.query}
          queryId={0}
          unit={units.data.programmes[populations.query.studyRights.programme]} // Possibly deprecated
          units={[
            ...Object.values(units.data.programmes),
            ...Object.values(units.data.degrees),
            ...Object.values(units.data.studyTracks)
          ].filter(u => Object.values(populations.query.studyRights).includes(u.code))}
          removeSampleFn={this.removePopulation}
          updateStudentsFn={() => this.props.updatePopulationStudents(studentNumberList)}
          updating={populations.updating}
          tags={tags}
        />
        <InfoBox content={QueryCard} />

        <Form.Group>
          <Form.Field style={{ margin: 'auto' }}>
            <label>Advanced settings</label>
            <Form.Radio
              toggle
              checked={showAdvancedSettings}
              onClick={() => {
                this.setState({ showAdvancedSettings: !showAdvancedSettings })
              }}
            />
          </Form.Field>
          {this.renderAdvancedSettingsSelector()}
        </Form.Group>
        <Form.Group>
          <InfoBox content={Advanced} />
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
