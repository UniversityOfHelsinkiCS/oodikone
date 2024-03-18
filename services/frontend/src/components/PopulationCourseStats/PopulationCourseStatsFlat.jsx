import { orderBy, debounce } from 'lodash'
import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { useDispatch } from 'react-redux'
import { Table, Input, Tab, Icon } from 'semantic-ui-react'

import { clearCourseStats } from '@/redux/coursestats'
import { useGetSemestersQuery } from '@/redux/semesters'
import { useLanguage } from '../LanguagePicker/useLanguage'
import { GradeDistribution } from './GradeDistribution'
import { PassFailEnrollments } from './PassFailEnrollments'
import { PopulationCourseContext } from './PopulationCourseContext'
import './populationCourseStats.css'

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
  TRIED_OF_POPULATION: 'triedOfPopulation',
}

const lodashSortOrderTypes = {
  ASC: 'asc',
  DESC: 'desc',
}

const updateCourseStatisticsCriteria = (courseStats, state, getTextIn, studentAmountLimit) => {
  if (!courseStats) {
    return []
  }

  const { sortCriteria, codeFilter, nameFilter, reversed } = state

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
  codeFilter: '',
  nameFilter: '',
  activeView: null,
  selectedStudentsLength: props.selectedStudentsLength || 0,
})

export const PopulationCourseStatsFlat = ({ courses, filteredStudents, studentAmountLimit }) => {
  const dispatch = useDispatch()
  const semesterRequest = useGetSemestersQuery()
  const { getTextIn } = useLanguage()

  const years = semesterRequest.isLoading ? [] : semesterRequest.data.years

  const props = {
    courses,
    populationCourses: courses,
    selectedStudents: filteredStudents,
    filteredStudents,
    years,
  }

  const [filterFields, setFilterFields] = useState({ codeFilter: '', nameFilter: '' })
  const [state, setState] = useState(initialState(props))

  const courseStatistics = useMemo(
    () => updateCourseStatisticsCriteria(courses?.coursestatistics, state, getTextIn, studentAmountLimit),
    [courses, state, studentAmountLimit]
  )

  useEffect(() => {
    if (state && props.courses) {
      setState({
        ...state,
        initialSortReady: true,
        selectedStudentsLength: props.selectedStudents.length,
      })
    }
  }, [props.courses, props.courseStatistics, props.selectedStudents])

  const onFilterChange = (event, field) => {
    const {
      target: { value },
    } = event

    setFilterFields({ ...filterFields, [field]: value })
  }

  const setFilters = useCallback(
    debounce(({ codeFilter, nameFilter }) => {
      setState({ ...state, codeFilter, nameFilter })
    }, 500),
    [state]
  )

  useEffect(() => {
    setFilters(filterFields)
  }, [filterFields])

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

  const onGoToCourseStatisticsClick = () => {
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
            icon={getFilterValue(field) ? <Icon link name="delete" onClick={() => onFilterReset(field)} /> : undefined}
            onChange={event => onFilterChange(event, field)}
            placeholder="Filter..."
            transparent
            value={getFilterValue(field)}
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

  if (!props.courses || !courseStatistics) {
    return null
  }

  return (
    <PopulationCourseContext.Provider value={contextValue}>
      <Tab panes={panes} />
    </PopulationCourseContext.Provider>
  )
}
