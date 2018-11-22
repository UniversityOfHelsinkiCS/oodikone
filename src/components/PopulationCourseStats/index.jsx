import React, { Component } from 'react'
import { connect } from 'react-redux'
import { Table, Form, Input, Popup, Button, Icon } from 'semantic-ui-react'
import { func, arrayOf, object, number, shape, string } from 'prop-types'
import { getTranslate } from 'react-localize-redux'
import _ from 'lodash'
import { withRouter } from 'react-router-dom'
import moment from 'moment'

import { setPopulationFilter, removePopulationFilterOfCourse } from '../../redux/populationFilters'
import { getMultipleCourseStatistics } from '../../redux/courseStatistics'
import { courseParticipation } from '../../populationFilters'

const formatGradeDistribution = grades => _.replace(JSON.stringify(_.sortBy(Object.entries(grades).map(([key, value]) => ({ [key]: value.count })), o => -Object.keys(o)), null, 1), /\[\n|{\n*|{\s|}|\s*}|]|"|,/g, '')

const tableColumnNames = {
  STUDENTS: 'students',
  PASSED: 'passed',
  RETRY_PASSED: 'retryPassed',
  PERCENTAGE: 'percentage',
  FAILED: 'failed',
  FAILED_MANY: 'failedMany',
  ATTEMPTS: 'attempts',
  PER_STUDENT: 'perStudent',
  PASSED_OF_POPULATION: 'passedOfPopulation',
  TRIED_OF_POPULATION: 'triedOfPopulation'

}

const sortOrderTypes = {
  ASC: 'ascending',
  DESC: 'descending'
}

class PopulationCourseStats extends Component {
  static propTypes = {
    courses: shape({
      coursestatistics: arrayOf(object).isRequired,
      coursetypes: shape({}).isRequired,
      disciplines: shape({}).isRequired
    }).isRequired,
    translate: func.isRequired,
    setPopulationFilter: func.isRequired,
    populationSize: number.isRequired,
    selectedCourses: arrayOf(object).isRequired,
    removePopulationFilterOfCourse: func.isRequired,
    history: shape({}).isRequired,
    getMultipleCourseStatistics: func.isRequired,
    language: string.isRequired,
    query: shape({}).isRequired
  }

  constructor(props) {
    super(props)

    this.state = {
      sortBy: tableColumnNames.STUDENTS,
      reversed: false,
      limit: parseInt(this.props.populationSize * 0.15, 10),
      codeFilter: '',
      showGradeDistribution: false
    }
  }

  getSelectionStyle = criteria => (this.state.sortBy === criteria ? ({ background: 'darkgray' }) : ({ background: '#f9fafb' }))

  criteria = (c1, c2) => {
    const orderByCode = (code1, code2) =>
      (code1.course.code < code2.course.code ? -1 : 1)

    if (this.state.reversed) {
      const val = c1.stats[this.state.sortBy] - c2.stats[this.state.sortBy]
      return (val !== 0 ? val : orderByCode(c1, c2))
    }
    const val = c2.stats[this.state.sortBy] - c1.stats[this.state.sortBy]
    return (val !== 0 ? val : orderByCode(c1, c2))
  }

  limit = () => (course) => {
    if (this.state.limit === 0) {
      return true
    }
    return course.stats.students >= this.state.limit
  }

  codeFilter = ({ course }) =>
    course.code.toLowerCase().includes(this.state.codeFilter.toLowerCase())

  sortBy = (criteria) => {
    const { reversed, sortBy } = this.state
    const isAlreadySelected = sortBy === criteria

    this.setState({
      sortBy: criteria,
      reversed: isAlreadySelected ? !reversed : reversed
    })
  }


  limitPopulationToCourse = course => () => {
    if (!this.active(course.course)) {
      const params = { course, field: 'all' }
      this.props.setPopulationFilter(courseParticipation(params))
    } else {
      this.props.removePopulationFilterOfCourse(course.course)
    }
  }

  active = course =>
    this.props.selectedCourses
      .find(c => course.name === c.name && course.code === c.code) !== undefined

  renderSortArrow = (criteria) => {
    const { sortBy, reversed } = this.state
    const isSortByCriteria = sortBy === criteria

    return isSortByCriteria
      ? <Icon name={`angle ${reversed ? 'up' : 'down'}`} />
      : null
  }


  renderGradeDistributionTable = ({ translate, sortBy, courses, language }) => (
    <Table celled sortable>
      <Table.Header>
        <Table.Row>
          <Table.HeaderCell colSpan="2" >
            {translate('populationCourses.course')}
          </Table.HeaderCell>
          <Table.HeaderCell>
            {translate('populationCourses.code')}
            <Input style={{ marginLeft: 10, width: '6em', textDecoration: 'underline' }} transparent placeholder="(filter here)" onKeyPress={e => e.key === 'Enter' && this.setState({ codeFilter: e.target.value })} />
          </Table.HeaderCell>
          <Table.HeaderCell
            sorted={sortBy === tableColumnNames.STUDENTS ? sortOrderTypes.DESC : null}
            onClick={this.sortBy(tableColumnNames.STUDENTS)}
            style={this.getSelectionStyle(tableColumnNames.STUDENTS)}
          >
            Attempts
          </Table.HeaderCell>
          <Table.HeaderCell>
            0
          </Table.HeaderCell>
          <Table.HeaderCell>
            1
          </Table.HeaderCell>
          <Table.HeaderCell>
            2
          </Table.HeaderCell>
          <Table.HeaderCell>
            3
          </Table.HeaderCell>
          <Table.HeaderCell>
            4
          </Table.HeaderCell>
          <Table.HeaderCell>
            5
          </Table.HeaderCell>
          <Table.HeaderCell>
            Other passed
          </Table.HeaderCell>
        </Table.Row>
      </Table.Header>
      <Table.Body>
        {courses.coursestatistics
          .sort(this.criteria()).filter(this.limit() && this.codeFilter()).map(course => (
            <Popup
              key={course.course.code}
              trigger={
                <Table.Row active={this.active(course.course)}>
                  <Table.Cell onClick={this.limitPopulationToCourse(course)}>
                    {course.course.name[language]}
                  </Table.Cell>
                  <Table.Cell
                    icon="level up alternate"
                    onClick={() => {
                      this.props.history.push('/coursestatistics/')
                      this.props.getMultipleCourseStatistics({
                        codes: [course.course.code],
                        start: Number(this.props.query.year),
                        end: Number(moment(moment(this.props.query.year, 'YYYY').add(this.props.query.months, 'months')).format('YYYY')),
                        separate: false,
                        language: this.props.language
                      })
                    }}
                    style={{ borderLeft: '0px !important' }}
                  />
                  <Table.Cell>{course.course.code}</Table.Cell>
                  <Table.Cell>
                    {course.grades ? _.sum(Object.values(course.grades).map(g => g.count)) || 0 : 0}
                  </Table.Cell>
                  <Table.Cell>
                    {course.grades ?
                      _.sum(Object.values(course.grades).filter(g =>
                        g.status.failingGrade).map(g => g.count))
                      || 0 : 0}
                  </Table.Cell>
                  <Table.Cell>
                    {course.grades[1] ? course.grades[1].count || 0 : 0}
                  </Table.Cell>
                  <Table.Cell>
                    {course.grades[2] ? course.grades[2].count || 0 : 0}
                  </Table.Cell>
                  <Table.Cell>
                    {course.grades[3] ? course.grades[3].count || 0 : 0}
                  </Table.Cell>
                  <Table.Cell>
                    {course.grades[4] ? course.grades[4].count || 0 : 0}
                  </Table.Cell>
                  <Table.Cell>
                    {course.grades[5] ? course.grades[5].count || 0 : 0}
                  </Table.Cell>
                  <Table.Cell>
                    {course.grades ?
                      _.sum(Object.values(_.omit(course.grades, [1, 2, 3, 4, 5])).filter(g =>
                        g.status.passingGrade || g.status.improvedGrade).map(g => g.count)) : 0}
                  </Table.Cell>
                </Table.Row>}
              flowing
              hoverable
              inverted
              position="top right"
              hideOnScroll
              content={course.grades ? <pre>{formatGradeDistribution(course.grades)}</pre> : 'Nothing to see here'}
            />
          ))}
      </Table.Body>
    </Table>
  )
  renderBasicTable = ({ translate, sortBy, direction, courses, language }) => (
    <Table celled sortable>
      <Table.Header>
        <Table.Row>
          <Table.HeaderCell colSpan="2">
            {translate('populationCourses.course')}
          </Table.HeaderCell>
          <Table.HeaderCell
            rowSpan="2"
            sorted={sortBy === tableColumnNames.STUDENTS ? sortOrderTypes.DESC : null}
            onClick={this.sortBy(tableColumnNames.STUDENTS)}
            style={this.getSelectionStyle(tableColumnNames.STUDENTS)}
          >
            {translate('populationCourses.students')}
            {this.renderSortArrow(tableColumnNames.STUDENTS)}
          </Table.HeaderCell>
          <Table.HeaderCell
            colSpan="3"
          >
            {translate('populationCourses.passed')}
          </Table.HeaderCell>
          <Table.HeaderCell
            colSpan="2"
          >
            {translate('populationCourses.failed')}
          </Table.HeaderCell>
          <Table.HeaderCell colSpan="2">{translate('populationCourses.attempts')}</Table.HeaderCell>
          <Table.HeaderCell colSpan="2">{translate('populationCourses.percentageOfPopulation')}</Table.HeaderCell>
        </Table.Row>
        <Table.Row>
          <Table.HeaderCell colSpan="1" >{translate('populationCourses.name')}</Table.HeaderCell>
          <Table.HeaderCell>
            {translate('populationCourses.code')}
            <Input style={{ marginLeft: 10, width: '6em' }} transparent placeholder="(filter here)" onKeyPress={e => e.key === 'Enter' && this.setState({ codeFilter: e.target.value })} />
          </Table.HeaderCell>
          <Table.HeaderCell
            sorted={sortBy === tableColumnNames.PASSED ? sortOrderTypes.DESC : null}
            onClick={this.sortBy(tableColumnNames.PASSED)}
            style={this.getSelectionStyle(tableColumnNames.PASSED)}

          >
            {translate('populationCourses.number')}
            {this.renderSortArrow(tableColumnNames.PASSED)}
          </Table.HeaderCell>
          <Table.HeaderCell
            sorted={sortBy === tableColumnNames.RETRY_PASSED ? sortOrderTypes.DESC : null}
            onClick={this.sortBy(tableColumnNames.RETRY_PASSED)}
            style={this.getSelectionStyle(tableColumnNames.RETRY_PASSED)}

          >
            {translate('populationCourses.passedAfterRetry')}
            {this.renderSortArrow(tableColumnNames.RETRY_PASSED)}
          </Table.HeaderCell>
          <Table.HeaderCell
            sorted={sortBy === tableColumnNames.PERCENTAGE ? direction : null}
            onClick={this.sortBy(tableColumnNames.PERCENTAGE)}
            style={this.getSelectionStyle(tableColumnNames.PERCENTAGE)}

          >
            {translate('populationCourses.percentage')}
            {this.renderSortArrow(tableColumnNames.PERCENTAGE)}
          </Table.HeaderCell>

          <Table.HeaderCell
            sorted={sortBy === tableColumnNames.FAILED ? sortOrderTypes.DESC : null}
            onClick={this.sortBy(tableColumnNames.FAILED)}
            style={this.getSelectionStyle(tableColumnNames.FAILED)}

          >
            {translate('populationCourses.number')}
            {this.renderSortArrow(tableColumnNames.FAILED)}
          </Table.HeaderCell>
          <Table.HeaderCell
            rowSpan="2"
            sorted={sortBy === tableColumnNames.FAILED_MANY ? sortOrderTypes.DESC : null}
            onClick={this.sortBy(tableColumnNames.FAILED_MANY)}
            style={this.getSelectionStyle(tableColumnNames.FAILED_MANY)}

          >
            {translate('populationCourses.failedManyTimes')}
            {this.renderSortArrow(tableColumnNames.FAILED_MANY)}
          </Table.HeaderCell>
          <Table.HeaderCell
            sorted={sortBy === tableColumnNames.ATTEMPTS ? sortOrderTypes.DESC : null}
            onClick={this.sortBy(tableColumnNames.ATTEMPTS)}
            style={this.getSelectionStyle(tableColumnNames.ATTEMPTS)}
          >
            {translate('populationCourses.number')}
            {this.renderSortArrow(tableColumnNames.ATTEMPTS)}

          </Table.HeaderCell>
          <Table.HeaderCell
            sorted={sortBy === tableColumnNames.PER_STUDENT ? sortOrderTypes.DESC : null}
            onClick={this.sortBy(tableColumnNames.PER_STUDENT)}
            style={this.getSelectionStyle(tableColumnNames.PER_STUDENT)}
          >
            {translate('populationCourses.perStudent')}
            {this.renderSortArrow(tableColumnNames.PER_STUDENT)}

          </Table.HeaderCell>
          <Table.HeaderCell
            sorted={sortBy === tableColumnNames.PASSED_OF_POPULATION ? direction : null}
            onClick={this.sortBy(tableColumnNames.PASSED_OF_POPULATION)}
            style={this.getSelectionStyle(tableColumnNames.PASSED_OF_POPULATION)}

          >
            {translate('populationCourses.passed')}
            {this.renderSortArrow(tableColumnNames.PASSED_OF_POPULATION)}
          </Table.HeaderCell>
          <Table.HeaderCell
            sorted={sortBy === tableColumnNames.TRIED_OF_POPULATION ? direction : null}
            onClick={this.sortBy(tableColumnNames.TRIED_OF_POPULATION)}
            style={this.getSelectionStyle(tableColumnNames.TRIED_OF_POPULATION)}

          >
            {translate('populationCourses.attempted')}
            {this.renderSortArrow(tableColumnNames.TRIED_OF_POPULATION)}
          </Table.HeaderCell>
        </Table.Row>
      </Table.Header>
      <Table.Body>
        {courses.coursestatistics
          .sort(this.criteria()).filter(this.limit() && this.codeFilter()).map(course => (
            <Table.Row key={course.course.code} active={this.active(course.course)}>
              <Table.Cell onClick={this.limitPopulationToCourse(course)}>
                {course.course.name[language]}
              </Table.Cell>
              <Table.Cell
                icon="level up alternate"
                onClick={() => {
                  this.props.history.push('/coursestatistics/')
                  this.props.getMultipleCourseStatistics({
                    codes: [course.course.code],
                    start: Number(this.props.query.year),
                    end: Number(moment(moment(this.props.query.year, 'YYYY').add(this.props.query.months, 'months')).format('YYYY')),
                    separate: false,
                    language: this.props.language
                  })
                }}
                style={{
                  borderLeft: '0px !important',
                  display: 'none'
                }}
              />
              <Table.Cell>{course.course.code}</Table.Cell>
              <Table.Cell>
                {course.stats.passed + course.stats.failed}
              </Table.Cell>
              <Table.Cell>
                {course.stats.passed}
              </Table.Cell>
              <Table.Cell>
                {course.stats.retryPassed}
              </Table.Cell>
              <Table.Cell>{course.stats.percentage} %</Table.Cell>
              <Table.Cell>
                {course.stats.failed}
              </Table.Cell>
              <Table.Cell>
                {course.stats.failedMany}
              </Table.Cell>
              <Table.Cell>{course.stats.attempts}</Table.Cell>
              <Table.Cell>
                {course.stats.perStudent.toFixed(2)}
              </Table.Cell>
              <Table.Cell>{course.stats.passedOfPopulation} %</Table.Cell>
              <Table.Cell>{course.stats.triedOfPopulation} %</Table.Cell>
            </Table.Row>))}
      </Table.Body>
    </Table>
  )

  render() {
    const { courses, translate } = this.props
    const { reversed } = this.state
    const direction = reversed ? sortOrderTypes.DESC : sortOrderTypes.ASC
    if (courses.length === 0) return null
    return (
      <div>
        <Form>
          <Form.Field inline>
            <label>{translate('populationCourses.limit')}</label>
            <Input
              value={this.state.limit}
              onChange={e => this.setState({ limit: e.target.value })}
            />
            <Button icon floated="right" onClick={() => this.setState({ showGradeDistribution: !this.state.showGradeDistribution })}>
              <Icon color="black" size="big" name="chart bar" />
            </Button>
          </Form.Field>
        </Form>
        {this.state.showGradeDistribution ?
          this.renderGradeDistributionTable(this.props, this.state)
          :
          this.renderBasicTable(this.props, this.state, direction)
        }
      </div>
    )
  }
}

const mapStateToProps = (state) => {
  const courseFilters = state.populationFilters.filters.filter(f => f.type === 'CourseParticipation')
  const selectedCourses = courseFilters.map(f => f.params.course.course)
  return {
    language: state.settings.language,
    translate: getTranslate(state.locale),
    query: state.populations.query,
    selectedCourses,
    populationSize: state.populations.data.students.length > 0 ?
      state.populations.data.students.length : 0
  }
}

export default connect(
  mapStateToProps,
  { setPopulationFilter, removePopulationFilterOfCourse, getMultipleCourseStatistics }
)(withRouter(PopulationCourseStats))
