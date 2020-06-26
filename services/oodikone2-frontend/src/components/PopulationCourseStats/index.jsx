import React, { useState, useEffect } from 'react'
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
import Students from './Students'
import { getUserIsAdmin } from '../../common'

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

function updateCourseStatisticsCriteria(props, state) {
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

const initialState = props => ({
  sortCriteria: tableColumnNames.STUDENTS,
  reversed: true,
  studentAmountLimit: Math.round(props.selectedStudents.length * 0.3),
  codeFilter: '',
  nameFilter: '',
  activeView: null,
  selectedStudentsLength: props.selectedStudentsLength || 0
})

function PopulationCourseStats(props) {
  const [state, setState] = useState(initialState(props))
  const [courseStatistics, setCourseStatistics] = useState(updateCourseStatisticsCriteria(props, initialState(props)))
  const [timer, setTimer] = useState(null)

  useEffect(() => {
    if (state && props.courses) {
      const studentAmountLimit =
        state.selectedStudentsLength !== props.selectedStudents.length
          ? Math.round(props.selectedStudents.length * 0.3)
          : state.studentAmountLimit

      setState({
        ...state,
        initialSortReady: true,
        studentAmountLimit,
        selectedStudentsLength: props.selectedStudents.length
      })
      // setCourseStatistics(updateCourseStatisticsCriteria(props, state))
    }
  }, [props.courses, props.selectedStudents])

  useEffect(() => {
    const { studentAmountLimit, codeFilter, nameFilter, reversed, sortCriteria } = state
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

    const sortedStatistics = orderBy(
      filteredCourses,
      [course => course.stats[sortCriteria], course => course.course.code],
      [lodashSortOrder, lodashSortOrderTypes.ASC]
    )

    setCourseStatistics(sortedStatistics)
  }, [state.studentAmountLimit, state.codeFilter, state.nameFilter])

  const onFilterChange = (e, field) => {
    const {
      target: { value }
    } = e
    clearTimeout(timer)
    setTimer(
      setTimeout(() => {
        setState({ ...state, [field]: value })
      }, 1000)
    )
  }

  const handleCourseStatisticsCriteriaChange = () => {
    // eslint-disable-next-line react/no-access-state-in-setstate
    const courseStatistics = updateCourseStatisticsCriteria(props, state)
    setCourseStatistics(courseStatistics)
  }

  // useEffect(() => {
  //   handleCourseStatisticsCriteriaChange()
  // }, [state.studentAmountLimit, state.sortCriteria, state.reversed])

  const onSetFilterKeyPress = e => {
    const { key } = e
    const enterKey = 'Enter'
    const isEnterKeyPress = key === enterKey
    if (isEnterKeyPress) {
      handleCourseStatisticsCriteriaChange()
    }
  }

  const onStudentAmountLimitChange = e => {
    const {
      target: { value }
    } = e
    clearTimeout(timer)
    setTimer(
      setTimeout(() => {
        sendAnalytics(
          'Courses of Population student count filter change',
          'Courses of Population student count filter change',
          value
        )
        setState({ ...state, studentAmountLimit: value }) // , () => this.handleCourseStatisticsCriteriaChange())
      }, 1000)
    )
  }

  const onSortableColumnHeaderClick = criteria => {
    const { reversed, sortCriteria } = state
    const isActiveSortCriteria = sortCriteria === criteria
    const isReversed = isActiveSortCriteria ? !reversed : reversed

    const lodashSortOrder = isReversed ? lodashSortOrderTypes.DESC : lodashSortOrderTypes.ASC

    const sortedStatistics = orderBy(
      courseStatistics,
      [course => course.stats[sortCriteria], course => course.course.code],
      [lodashSortOrder, lodashSortOrderTypes.ASC]
    )

    setState({
      ...state,
      sortCriteria: criteria,
      reversed: isReversed
    })

    setCourseStatistics(sortedStatistics)
  }

  const onGoToCourseStatisticsClick = courseCode => {
    const { clearCourseStats: clearCourseStatsfn } = props
    sendAnalytics('Courses of Population course stats button clicked', courseCode)
    clearCourseStatsfn()
  }

  const isActiveCourse = course => {
    const { selectedCourses } = props
    return selectedCourses.length > 0 && selectedCourses.find(c => course.code === c.code) !== undefined
  }

  const onCourseNameCellClick = code => {
    const courseStatistic = props.populationCourses.data.coursestatistics.find(cs => cs.course.code === code)
    if (courseStatistic) {
      if (!isActiveCourse(courseStatistic.course)) {
        const params = { course: courseStatistic, field: 'all' }
        props.setPopulationFilter(courseParticipation(params))
        sendAnalytics('Courses of Population course selected for filter', code)
      } else {
        props.removePopulationFilterOfCourse(courseStatistic.course)
        sendAnalytics('Courses of Population course unselected for filter', code)
      }
    }
  }

  const renderFilterInputHeaderCell = (field, name, colSpan = '') => {
    const { translate } = props
    return (
      <Table.HeaderCell colSpan={colSpan}>
        {translate(name)}
        <Input
          className="courseCodeInput"
          transparent
          placeholder="(filter here)"
          onChange={e => onFilterChange(e, field)}
          onKeyPress={onSetFilterKeyPress}
        />
      </Table.HeaderCell>
    )
  }

  const { courses, translate, pending, isAdmin } = props
  const { sortCriteria, reversed } = state
  const contextValue = {
    courseStatistics,
    filterInput: renderFilterInputHeaderCell,
    isActiveCourse,
    onCourseNameCellClick,
    onGoToCourseStatisticsClick,
    onSortableColumnHeaderClick,
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
            filterInput={renderFilterInputHeaderCell}
            courseStatistics={courseStatistics}
            onCourseNameClickFn={onCourseNameCellClick}
            isActiveCourseFn={isActiveCourse}
          />
        </div>
      )
    }
  ]

  if (isAdmin) {
    panes.push({
      menuItem: 'students',
      render: () => (
        <div className="menuTab" style={{ marginTop: '0.5em' }}>
          <Students />
        </div>
      )
    })
  }

  if (!courses) {
    return null
  }

  if (!courseStatistics) {
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
          <Input defaultValue={state.studentAmountLimit} onChange={onStudentAmountLimitChange} />
        </Form.Field>
      </Form>
      <PopulationCourseContext.Provider value={contextValue}>
        <Tab panes={panes} />
      </PopulationCourseContext.Provider>
    </div>
  )
}

PopulationCourseStats.propTypes = {
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
  isAdmin: bool.isRequired,
  years: shape({}) // eslint-disable-line
}

const mapStateToProps = state => {
  const { years } = state.semesters.data
  const courseFilters = state.populationFilters.filters.filter(f => f.type === 'CourseParticipation')
  const selectedCourses = courseFilters.map(f => f.params.course.course)
  const isAdmin = getUserIsAdmin(state.auth.token.roles)
  return {
    language: getActiveLanguage(state.localize).code,
    translate: getTranslate(state.localize),
    years,
    selectedCourses,
    populationCourses: state.populationCourses,
    isAdmin
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
