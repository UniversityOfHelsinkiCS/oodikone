import React, { Component } from 'react'
import { connect } from 'react-redux'
import { Table, Form, Input, Tab } from 'semantic-ui-react'
import { func, arrayOf, object, shape, string, bool } from 'prop-types'
import { getActiveLanguage, getTranslate } from 'react-localize-redux'
import { orderBy } from 'lodash'
import { withRouter } from 'react-router-dom'

import { setPopulationFilter, removePopulationFilterOfCourse } from '../../redux/populationFilters'
import { clearCourseStats } from '../../redux/coursestats'

import { courseParticipation } from '../../populationFilters'
import PassingSemesters from './PassingSemesters'

import './populationCourseStats.css'
import { PopulationCourseContext } from './PopulationCourseContext'
import TSA from '../../common/tsa'
import GradeDistribution from './GradeDistribution'
import PassFail from './PassFail'

const sendAnalytics = (action, name, value) => TSA.Matomo.sendEvent('Population statistics', action, name, value)

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

class PopulationCourseStats extends Component {
  static propTypes = {
    courses: shape({
      coursestatistics: arrayOf(object),
      coursetypes: shape({}),
      disciplines: shape({})
    }).isRequired,
    translate: func.isRequired,
    setPopulationFilter: func.isRequired,
    populationCourses: shape({
      data: shape({ coursestatistics: arrayOf(shape({ course: shape({ code: string, name: shape({}) }) })) })
    }).isRequired,
    selectedCourses: arrayOf(object).isRequired,
    removePopulationFilterOfCourse: func.isRequired,
    clearCourseStats: func.isRequired,
    pending: bool.isRequired,
    selectedStudents: arrayOf(string).isRequired,
    years: shape({}) // eslint-disable-line
  }

  static getDerivedStateFromProps(props, state) {
    if (state && props.courses) {
      const studentAmountLimit =
        state.selectedStudentsLength !== props.selectedStudents.length
          ? Math.round(props.selectedStudents.length * 0.3)
          : state.studentAmountLimit
      return {
        ...state,
        courseStatistics: PopulationCourseStats.updateCourseStatisticsCriteria(props, state),
        initialSortReady: true,
        studentAmountLimit,
        selectedStudentsLength: props.selectedStudents.length
      }
    }

    return null
  }

  static updateCourseStatisticsCriteria(props, state) {
    const { studentAmountLimit, sortCriteria, codeFilter, nameFilter, reversed } = state
    const {
      courses: { coursestatistics },
      language
    } = props

    const studentAmountFilter = ({ stats }) => {
      const { students } = stats
      return studentAmountLimit === 0 || students >= studentAmountLimit
    }
    const courseCodeFilter = ({ course }) => {
      const { code } = course
      return code.toLowerCase().includes(codeFilter.toLowerCase())
    }
    const courseNameFilter = ({ course }) => {
      const { name } = course
      return name[language].toLowerCase().includes(nameFilter.toLowerCase())
    }

    const filteredCourses =
      coursestatistics &&
      coursestatistics
        .filter(studentAmountFilter)
        .filter(c => !codeFilter || courseCodeFilter(c))
        .filter(c => !nameFilter || courseNameFilter(c))

    const lodashSortOrder = reversed ? lodashSortOrderTypes.DESC : lodashSortOrderTypes.ASC

    const courseStatistics = orderBy(
      filteredCourses,
      [course => course.stats[sortCriteria], course => course.course.code],
      [lodashSortOrder, lodashSortOrderTypes.ASC]
    )

    return courseStatistics
  }

  state = {
    sortCriteria: tableColumnNames.STUDENTS,
    reversed: true,
    studentAmountLimit: Math.round(this.props.selectedStudents.length * 0.3),
    codeFilter: '',
    nameFilter: '',
    activeView: null,
    selectedStudentsLength: 0
  }

  onFilterChange = (e, field) => {
    const {
      target: { value }
    } = e
    clearTimeout(this.timer)
    this.timer = setTimeout(() => {
      this.setState({ [field]: value })
    }, 1000)
  }

  onSetFilterKeyPress = e => {
    const { key } = e
    const enterKey = 'Enter'
    const isEnterKeyPress = key === enterKey
    if (isEnterKeyPress) {
      this.handleCourseStatisticsCriteriaChange()
    }
  }

  onStudentAmountLimitChange = e => {
    const {
      target: { value }
    } = e
    clearTimeout(this.timer)
    this.timer = setTimeout(() => {
      sendAnalytics(
        'Courses of Population student count filter change',
        'Courses of Population student count filter change',
        value
      )
      this.setState({ studentAmountLimit: value }, () => this.handleCourseStatisticsCriteriaChange())
    }, 1000)
  }

  onSortableColumnHeaderClick = criteria => {
    const { reversed, sortCriteria } = this.state
    const isActiveSortCriteria = sortCriteria === criteria
    const isReversed = isActiveSortCriteria ? !reversed : reversed

    this.setState(
      {
        sortCriteria: criteria,
        reversed: isReversed
      },
      () => this.handleCourseStatisticsCriteriaChange()
    )
  }

  onGoToCourseStatisticsClick = courseCode => {
    const { clearCourseStats: clearCourseStatsfn } = this.props
    sendAnalytics('Courses of Population course stats button clicked', courseCode)
    clearCourseStatsfn()
  }

  onCourseNameCellClick = code => {
    const courseStatistic = this.props.populationCourses.data.coursestatistics.find(cs => cs.course.code === code)
    if (courseStatistic) {
      if (!this.isActiveCourse(courseStatistic.course)) {
        const params = { course: courseStatistic, field: 'all' }
        this.props.setPopulationFilter(courseParticipation(params))
        sendAnalytics('Courses of Population course selected for filter', code)
      } else {
        this.props.removePopulationFilterOfCourse(courseStatistic.course)
        sendAnalytics('Courses of Population course unselected for filter', code)
      }
    }
  }

  handleCourseStatisticsCriteriaChange = () => {
    // eslint-disable-next-line react/no-access-state-in-setstate
    const courseStatistics = PopulationCourseStats.updateCourseStatisticsCriteria(this.props, this.state)
    this.setState({ courseStatistics })
  }

  isActiveCourse = course => {
    const { selectedCourses } = this.props
    return selectedCourses.length > 0 && selectedCourses.find(c => course.code === c.code) !== undefined
  }

  renderFilterInputHeaderCell = (field, name, colSpan = '') => {
    const { translate } = this.props
    return (
      <Table.HeaderCell colSpan={colSpan}>
        {translate(name)}
        <Input
          className="courseCodeInput"
          transparent
          placeholder="(filter here)"
          onChange={e => this.onFilterChange(e, field)}
          onKeyPress={this.onSetFilterKeyPress}
        />
      </Table.HeaderCell>
    )
  }

  render() {
    const { courses, translate, pending } = this.props
    const { studentAmountLimit, courseStatistics, sortCriteria, reversed } = this.state
    const contextValue = {
      courseStatistics,
      filterInput: this.renderFilterInputHeaderCell,
      isActiveCourse: this.isActiveCourse,
      onCourseNameCellClick: this.onCourseNameCellClick,
      onGoToCourseStatisticsClick: this.onGoToCourseStatisticsClick,
      onSortableColumnHeaderClick: this.onSortableColumnHeaderClick,
      tableColumnNames,
      translate,
      sortCriteria,
      reversed
    }

    const panes = [
      {
        menuItem: 'pass/fail',
        render: () => (
          <div className="menuTab">
            <PassFail />
          </div>
        )
      },
      {
        menuItem: 'grades',
        render: () => (
          <div className="menuTab">
            <GradeDistribution />
          </div>
        )
      },
      {
        menuItem: 'when passed',
        render: () => (
          <div className="menuTab" style={{ marginTop: '0.5em' }}>
            <PassingSemesters
              filterInput={this.renderFilterInputHeaderCell}
              courseStatistics={courseStatistics}
              onCourseNameClickFn={this.onCourseNameCellClick}
              isActiveCourseFn={this.isActiveCourse}
            />
          </div>
        )
      }
    ]
    if (!courses) {
      return null
    }
    if (pending) {
      return null
    }
    return (
      <div>
        <Form>
          <Form.Field inline>
            <label>{translate('populationCourses.limit')}</label>
            <Input defaultValue={studentAmountLimit} onChange={this.onStudentAmountLimitChange} />
          </Form.Field>
        </Form>
        <PopulationCourseContext.Provider value={contextValue}>
          <Tab panes={panes} />
        </PopulationCourseContext.Provider>
      </div>
    )
  }
}

const mapStateToProps = state => {
  const { years } = state.semesters.data
  const courseFilters = state.populationFilters.filters.filter(f => f.type === 'CourseParticipation')
  const selectedCourses = courseFilters.map(f => f.params.course.course)
  return {
    language: getActiveLanguage(state.localize).code,
    translate: getTranslate(state.localize),
    years,
    selectedCourses,
    populationCourses: state.populationCourses
  }
}

export default connect(
  mapStateToProps,
  {
    setPopulationFilter,
    removePopulationFilterOfCourse,
    clearCourseStats
  }
)(withRouter(PopulationCourseStats))
