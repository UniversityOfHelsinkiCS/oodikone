import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { useDispatch } from 'react-redux'
import { Table, Form, Input, Tab, Icon } from 'semantic-ui-react'
import { orderBy, debounce } from 'lodash'
import { useGetSemestersQuery } from 'redux/semesters'
import { clearCourseStats } from '../../redux/coursestats'
import './populationCourseStats.css'
import { PopulationCourseContext } from './PopulationCourseContext'
import TSA from '../../common/tsa'
import GradeDistribution from './GradeDistribution'
import useLanguage from '../LanguagePicker/useLanguage'
import PassFailEnrollments from './PassFailEnrollments'

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
  TRIED_OF_POPULATION: 'triedOfPopulation',
}

export const sortOrderTypes = {
  ASC: 'ascending',
  DESC: 'descending',
}

const lodashSortOrderTypes = {
  ASC: 'asc',
  DESC: 'desc',
}

const updateCourseStatisticsCriteria = (courseStats, language, state, getTextIn) => {
  if (!courseStats) {
    return []
  }

  const { studentAmountLimit, sortCriteria, codeFilter, nameFilter, reversed } = state

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
    return getTextIn(name).toLowerCase().includes(nameFilter.toLowerCase())
  }

  const filteredCourses =
    courseStats &&
    courseStats
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
  studentAmountLimit: Math.round((props?.filteredStudents?.length ?? 0) * 0.3),
  codeFilter: '',
  nameFilter: '',
  activeView: null,
  selectedStudentsLength: props.selectedStudentsLength || 0,
})

const PopulationCourseStatsFlat = ({ courses, pending, filteredStudents, showFilter = true }) => {
  const dispatch = useDispatch()
  const semesterRequest = useGetSemestersQuery()
  const { getTextIn } = useLanguage()

  const years = semesterRequest.isLoading ? [] : semesterRequest.data.years

  const props = {
    courses,
    pending,
    populationCourses: courses,
    selectedStudents: filteredStudents,
    filteredStudents,
    showFilter,
    years,
  }

  const [filterFields, setFilterFields] = useState({ codeFilter: '', nameFilter: '' })
  const [timer, setTimer] = useState(null)
  const [state, setState] = useState(initialState(props))

  const courseStatistics = useMemo(
    () => updateCourseStatisticsCriteria(courses?.coursestatistics, state, getTextIn),
    [courses, state]
  )

  useEffect(() => {
    if (!pending && state && props.courses) {
      const studentAmountLimit =
        state.selectedStudentsLength !== props.selectedStudents.length
          ? Math.round(props.selectedStudents.length * 0.3)
          : state.studentAmountLimit

      setState({
        ...state,
        initialSortReady: true,
        studentAmountLimit,
        selectedStudentsLength: props.selectedStudents.length,
      })
    }
  }, [props.courses, props.courseStatistics, props.selectedStudents, pending])

  const onFilterChange = (e, field) => {
    const {
      target: { value },
    } = e

    setFilterFields({ ...filterFields, [field]: value })
  }

  const setFilters = useCallback(
    debounce(({ codeFilter, nameFilter }) => {
      setState({ ...state, codeFilter, nameFilter })
    }, 500),
    [state]
  )

  useEffect(() => {
    if (!pending) setFilters(filterFields)
  }, [filterFields, pending])

  const onStudentAmountLimitChange = e => {
    const {
      target: { value },
    } = e
    clearTimeout(timer)
    setTimer(
      setTimeout(() => {
        sendAnalytics(
          'Courses of Population student count filter change',
          'Courses of Population student count filter change',
          value
        )
        setState({
          ...state,
          studentAmountLimit: typeof Number(value) === 'number' ? Number(value) : state.studentAmountLimit,
        })
      }, 1000)
    )
  }

  const onSortableColumnHeaderClick = criteria => {
    const { reversed, sortCriteria } = state
    const isActiveSortCriteria = sortCriteria === criteria
    const isReversed = isActiveSortCriteria ? !reversed : reversed

    setState({
      ...state,
      sortCriteria: criteria,
      reversed: isReversed,
    })
  }

  const onGoToCourseStatisticsClick = courseCode => {
    sendAnalytics('Courses of Population course stats button clicked', courseCode)
    dispatch(clearCourseStats())
  }

  const onFilterReset = field => {
    setFilterFields({ ...filterFields, [field]: '' })
  }

  const getFilterValue = field => (field in filterFields ? filterFields[field] || '' : '')

  const renderFilterInputHeaderCell = (field, name, colSpan = '') => {
    return (
      <Table.HeaderCell colSpan={colSpan}>
        <div>{name}</div>
        <div>
          <Input
            className="courseCodeInput"
            transparent
            placeholder="Filter..."
            onChange={e => onFilterChange(e, field)}
            value={getFilterValue(field)}
            icon={getFilterValue(field) ? <Icon name="delete" link onClick={() => onFilterReset(field)} /> : undefined}
          />
        </div>
      </Table.HeaderCell>
    )
  }

  const { sortCriteria, reversed } = state
  const contextValue = {
    courseStatistics,
    filterInput: renderFilterInputHeaderCell,
    onGoToCourseStatisticsClick,
    onSortableColumnHeaderClick,
    tableColumnNames,
    sortCriteria,
    reversed,
  }

  const panes = [
    {
      menuItem: 'pass/fail',
      render: () => (
        <Tab.Pane>
          <PassFailEnrollments flat />
        </Tab.Pane>
      ),
    },
    {
      menuItem: 'grades',
      render: () => (
        <Tab.Pane>
          <GradeDistribution flat />
        </Tab.Pane>
      ),
    },
  ]

  if (!props.courses) {
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
      {showFilter && (
        <Form>
          <Form.Field inline>
            <label>Limit to courses where student number at least</label>
            <Input defaultValue={state.studentAmountLimit} onChange={onStudentAmountLimitChange} />
          </Form.Field>
        </Form>
      )}
      <PopulationCourseContext.Provider value={contextValue}>
        <Tab panes={panes} />
      </PopulationCourseContext.Provider>
    </div>
  )
}

export default PopulationCourseStatsFlat
