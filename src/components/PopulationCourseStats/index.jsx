import React, { Component } from 'react'
import { connect } from 'react-redux'
import { Table, Form, Input, Popup, Button } from 'semantic-ui-react'
import { func, arrayOf, object, number, shape, string, oneOf, bool } from 'prop-types'
import { getTranslate } from 'react-localize-redux'
import _ from 'lodash'
import { withRouter } from 'react-router-dom'
import moment from 'moment'

import { setPopulationFilter, removePopulationFilterOfCourse } from '../../redux/populationFilters'
import { getMultipleCourseStatistics } from '../../redux/courseStatistics'
import { courseParticipation } from '../../populationFilters'
import PassingSemesters from './PassingSemesters'

import styles from './populationCourseStats.css'

export const tableColumnNames = {
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

export const sortOrderTypes = {
  ASC: 'ascending',
  DESC: 'descending'
}

const lodashSortOrderTypes = {
  ASC: 'asc',
  DESC: 'desc'
}

const SortableHeaderCell =
  ({ content, columnName, onClickFn, activeSortColumn, reversed, rowSpan }) => {
    const isTableSortedBy = activeSortColumn === columnName
    const direction = reversed ? sortOrderTypes.DESC : sortOrderTypes.ASC
    return (
      <Table.HeaderCell
        rowSpan={`${rowSpan}`}
        sorted={isTableSortedBy ? direction : null}
        onClick={() => onClickFn(columnName)}
        className={isTableSortedBy ? styles.activeSortHeader : ''}
        content={content}
      />
    )
  }

const tableColumnType = oneOf(Object.values(tableColumnNames))

SortableHeaderCell.propTypes = {
  content: string.isRequired,
  columnName: tableColumnType.isRequired,
  activeSortColumn: tableColumnType.isRequired,
  reversed: bool.isRequired,
  onClickFn: func.isRequired,
  rowSpan: number
}

SortableHeaderCell.defaultProps = {
  rowSpan: 1
}

const formatGradeDistribution = grades =>
  _.replace(JSON.stringify(
    _.sortBy(Object.entries(grades)
      .map(([key, value]) => ({ [key]: value.count })), o => -Object.keys(o)),
    null, 1
  ), /\[\n|{\n*|{\s|}|\s*}|]|"|,/g, '')

class PopulationCourseStats extends Component {
  static propTypes = {
    courses: shape({
      coursestatistics: arrayOf(object).isRequired,
      coursetypes: shape({}),
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

  static getDerivedStateFromProps(props, state) {
    if (state && !state.initialSortReady && props.courses.coursestatistics) {
      state.courseStatistics = PopulationCourseStats.updateCourseStatisticsCriteria(props, state)
      state.initialSortReady = true
    }

    return state
  }

  static updateCourseStatisticsCriteria(props, state) {
    const { studentAmountLimit, sortCriteria, codeFilter, reversed } = state
    const { courses: { coursestatistics } } = props

    const studentAmountFilter = ({ stats }) => {
      const { students } = stats
      return studentAmountLimit === 0 || students >= studentAmountLimit
    }
    const courseCodeFilter = ({ course }) => {
      const { code } = course
      return code.toLowerCase().includes(codeFilter.toLowerCase())
    }

    const filteredCourses = coursestatistics
      .filter(studentAmountFilter)
      .filter(c => !codeFilter || courseCodeFilter(c))

    const lodashSortOrder = reversed ? lodashSortOrderTypes.DESC : lodashSortOrderTypes.ASC

    const courseStatistics = _.orderBy(
      filteredCourses,
      [course => course.stats[sortCriteria], course => course.course.code],
      [lodashSortOrder, lodashSortOrderTypes.ASC]
    )

    return courseStatistics
  }

  state = {
    sortCriteria: tableColumnNames.STUDENTS,
    reversed: true,
    studentAmountLimit: parseInt(this.props.populationSize * 0.15, 10),
    codeFilter: '',
    activeView: null
  }

  onCodeFilterChange = (e) => {
    const { target: { value } } = e
    this.setState({ codeFilter: value })
  }

  onSetCodeFilterKeyPress = (e) => {
    const { key } = e
    const enterKey = 'Enter'
    const isEnterKeyPress = key === enterKey
    if (isEnterKeyPress) {
      this.handleCourseStatisticsCriteriaChange()
    }
  }

  onStudentAmountLimitChange = (e) => {
    const { target: { value } } = e
    this.setState(
      { studentAmountLimit: value },
      () => this.handleCourseStatisticsCriteriaChange()
    )
  }

  onSortableColumnHeaderClick = (criteria) => {
    const { reversed, sortCriteria } = this.state
    const isActiveSortCriteria = sortCriteria === criteria
    const isReversed = isActiveSortCriteria ? !reversed : reversed

    this.setState({
      sortCriteria: criteria,
      reversed: isReversed
    }, () => this.handleCourseStatisticsCriteriaChange())
  }

  onGoToCourseStatisticsClick = (code) => {
    const { history, query, getMultipleCourseStatistics: getStatsFn, language } = this.props
    const { year, months } = query
    history.push('/coursestatistics/')
    getStatsFn({
      codes: [code],
      start: Number(year),
      end: Number(moment(moment(year, 'YYYY').add(months, 'months')).format('YYYY')),
      separate: false,
      language
    })
  }

  onCourseNameCellClick = (courseStats) => {
    if (!this.isActiveCourse(courseStats.course)) {
      const params = { course: courseStats, field: 'all' }
      this.props.setPopulationFilter(courseParticipation(params))
    } else {
      this.props.removePopulationFilterOfCourse(courseStats.course)
    }
  }

  setActiveView = activeView => this.setState({ activeView })

  handleCourseStatisticsCriteriaChange = () => {
    const courseStatistics = PopulationCourseStats.updateCourseStatisticsCriteria(this.props, this.state)
    this.setState({ courseStatistics })
  }

  isActiveCourse = (course) => {
    const { selectedCourses } = this.props
    return selectedCourses.length > 0 && selectedCourses
      .find(c => course.name === c.name && course.code === c.code) !== undefined
  }

  renderCodeFilterInputHeaderCell = () => {
    const { translate } = this.props
    const { codeFilter } = this.state
    return (
      <Table.HeaderCell>
        {translate('populationCourses.code')}
        <Input
          className={styles.courseCodeInput}
          transparent
          value={codeFilter}
          placeholder="(filter here)"
          onChange={this.onCodeFilterChange}
          onKeyPress={this.onSetCodeFilterKeyPress}
        />
      </Table.HeaderCell>)
  }

  renderActiveView() {
    const { courses } = this.props
    const { courseStatistics } = this.state
    const courseStats = courseStatistics || courses.coursestatistics

    switch (this.state.activeView) {
      case 'showGradeDistribution':
        return this.renderGradeDistributionTable(courseStats)
      case 'passingSemester':
        return (<PassingSemesters
          courseStatistics={courseStats}
          onCourseNameClickFn={this.onCourseNameCellClick}
          isActiveCourseFn={this.isActiveCourse}
        />)
      default:
        return this.renderBasicTable(courseStats)
    }
  }

  renderGradeDistributionTable = (courseStatistics) => {
    const { translate, language } = this.props
    const { sortCriteria, reversed } = this.state

    const courseGradesTypes = [1, 2, 3, 4, 5]

    const getTableHeader = () => (
      <Table.Header>
        <Table.Row>
          <Table.HeaderCell colSpan="2" content={translate('populationCourses.course')} />
          {this.renderCodeFilterInputHeaderCell()}
          <SortableHeaderCell
            content="Attempts"
            columnName={tableColumnNames.STUDENTS}
            onClickFn={this.onSortableColumnHeaderClick}
            activeSortColumn={sortCriteria}
            reversed={reversed}
          />
          <Table.HeaderCell content={0} />
          {courseGradesTypes.map(g => <Table.HeaderCell content={g} />)}
          <Table.HeaderCell content="Other passed" />
        </Table.Row>
      </Table.Header>
    )

    const getCourseRow = (courseStats) => {
      const { course, grades } = courseStats
      const { name, code } = course

      let attempts = 0
      let failedGrades = 0
      let otherPassed = 0

      if (grades) {
        const countSumReducer = (acc, cur) => acc + cur.count
        const gradeValues = grades ? Object.values(grades) : null
        attempts = gradeValues.reduce(countSumReducer, 0)
        failedGrades = gradeValues.filter(g => g.status.failed).reduce(countSumReducer, 0)
        otherPassed = Object.values(_.omit(grades, courseGradesTypes))
          .filter(g => g.status.passingGrade || g.status.improvedGrade)
          .reduce(countSumReducer, 0)
      }

      return (
        <Table.Row active={this.isActiveCourse(course)}>
          <Table.Cell
            onClick={() => this.onCourseNameCellClick(courseStats)}
            content={name[language]}
            className={styles.clickableCell}
          />
          <Table.Cell
            icon="level up alternate"
            onClick={() => this.onGoToCourseStatisticsClick(code)}
            className={styles.iconCell}
          />
          <Table.Cell content={code} />
          <Table.Cell content={attempts} />
          <Table.Cell content={failedGrades} />
          {courseGradesTypes.map(g =>
            <Table.Cell content={grades[g] ? grades[g].count || 0 : 0} />)
          }
          <Table.Cell content={otherPassed} />
        </Table.Row>
      )
    }

    const getCoursePopUpRow = (courseStats) => {
      const { course, grades } = courseStats
      const { code } = course
      return (
        <Popup
          key={code}
          flowing
          hoverable
          inverted
          position="top right"
          hideOnScroll
          content={grades ? <pre>{formatGradeDistribution(grades)}</pre> : 'Nothing to see here'}
          trigger={getCourseRow(courseStats)}
        />
      )
    }

    return (
      <Table celled sortable>
        {getTableHeader()}
        <Table.Body>
          {courseStatistics.map(getCoursePopUpRow)}
        </Table.Body>
      </Table>
    )
  }

  renderBasicTable = (courseStatistics) => {
    const { translate, language } = this.props
    const { sortCriteria, reversed } = this.state

    const getSortableHeaderCell = (label, columnName, rowSpan = 1) =>
      (<SortableHeaderCell
        content={label}
        columnName={columnName}
        onClickFn={this.onSortableColumnHeaderClick}
        activeSortColumn={sortCriteria}
        reversed={reversed}
        rowSpan={rowSpan}
      />)

    const getTableHeader = () => (
      <Table.Header>
        <Table.Row>
          <Table.HeaderCell colSpan="3" content={translate('populationCourses.course')} />
          {getSortableHeaderCell(translate('populationCourses.students'), tableColumnNames.STUDENTS, 2)}
          <Table.HeaderCell colSpan="3" content={translate('populationCourses.passed')} />
          <Table.HeaderCell colSpan="2" content={translate('populationCourses.failed')} />
          <Table.HeaderCell colSpan="2" content={translate('populationCourses.attempts')} />
          <Table.HeaderCell colSpan="2" content={translate('populationCourses.percentageOfPopulation')} />
        </Table.Row>
        <Table.Row>
          <Table.HeaderCell colSpan="2" content={translate('populationCourses.name')} />
          {this.renderCodeFilterInputHeaderCell()}
          {getSortableHeaderCell(translate('populationCourses.number'), tableColumnNames.PASSED)}
          {getSortableHeaderCell(translate('populationCourses.passedAfterRetry'), tableColumnNames.RETRY_PASSED)}
          {getSortableHeaderCell(translate('populationCourses.percentage'), tableColumnNames.PERCENTAGE)}
          {getSortableHeaderCell(translate('populationCourses.number'), tableColumnNames.FAILED)}
          {getSortableHeaderCell(translate('populationCourses.failedManyTimes'), tableColumnNames.FAILED_MANY)}
          {getSortableHeaderCell(translate('populationCourses.number'), tableColumnNames.ATTEMPTS)}
          {getSortableHeaderCell(translate('populationCourses.perStudent'), tableColumnNames.PER_STUDENT)}
          {getSortableHeaderCell(translate('populationCourses.passed'), tableColumnNames.PASSED_OF_POPULATION)}
          {getSortableHeaderCell(translate('populationCourses.attempted'), tableColumnNames.TRIED_OF_POPULATION)}
        </Table.Row>
      </Table.Header>
    )

    const getCourseRow = (courseStats) => {
      const { course, stats } = courseStats
      const { code, name } = course
      const {
        failed,
        passed,
        retryPassed,
        failedMany,
        attempts,
        percentage,
        perStudent,
        passedOfPopulation,
        triedOfPopulation
      } = stats
      return ((
        <Table.Row key={code} active={this.isActiveCourse(course)}>
          <Table.Cell
            onClick={() => this.onCourseNameCellClick(courseStats)}
            content={name[language]}
            className={styles.clickableCell}
          />
          <Table.Cell
            icon="level up alternate"
            onClick={() => this.onGoToCourseStatisticsClick(code)}
            className={styles.iconCell}
          />
          <Table.Cell content={code} />
          <Table.Cell content={passed + failed} />
          <Table.Cell content={passed} />
          <Table.Cell content={retryPassed} />
          <Table.Cell content={`${percentage} %`} />
          <Table.Cell content={failed} />
          <Table.Cell content={failedMany} />
          <Table.Cell content={attempts} />
          <Table.Cell content={perStudent.toFixed(2)} />
          <Table.Cell content={`${passedOfPopulation}  %`} />
          <Table.Cell content={`${triedOfPopulation}  %`} />
        </Table.Row>)
      )
    }

    return (
      <Table celled sortable>
        {getTableHeader()}
        <Table.Body>
          {courseStatistics.map(getCourseRow)}
        </Table.Body>
      </Table>
    )
  }

  render() {
    const { courses, translate } = this.props
    const { studentAmountLimit } = this.state

    if (courses.length === 0) {
      return null
    }

    return (
      <div>
        <Form>
          <Form.Field inline>
            <label>{translate('populationCourses.limit')}</label>
            <Input
              value={studentAmountLimit}
              onChange={this.onStudentAmountLimitChange}
            />
            <Button
              active={this.state.activeView === 'passingSemester'}
              floated="right"
              onClick={() => this.setActiveView('passingSemester')}
            >
              when passed
            </Button>
            <Button
              active={this.state.activeView === 'showGradeDistribution'}
              floated="right"
              onClick={() => this.setActiveView('showGradeDistribution')}
            >
              grades
            </Button>
            <Button
              active={this.state.activeView === null}
              floated="right"
              onClick={() => this.setActiveView(null)}
            >
              pass/fail
            </Button>
          </Form.Field>
        </Form>

        {this.renderActiveView()}
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
