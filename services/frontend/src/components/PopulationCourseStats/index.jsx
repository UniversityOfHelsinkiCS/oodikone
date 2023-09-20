import React, { useState, useEffect, useCallback } from 'react'
import { connect, useSelector } from 'react-redux'
import { Table, Input, Tab, Icon } from 'semantic-ui-react'
import { orderBy, debounce } from 'lodash'
import { withRouter } from 'react-router-dom'
import { clearCourseStats } from '../../redux/coursestats'
import { useTabChangeAnalytics } from '../../common/hooks'
import PassingSemesters from './PassingSemesters'
import './populationCourseStats.css'
import { PopulationCourseContext } from './PopulationCourseContext'
import GradeDistribution from './GradeDistribution'
import PassFailEnrollments from './PassFailEnrollments'
import Students from './Students'
import useLanguage from '../LanguagePicker/useLanguage'

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

const updateCourseStatisticsCriteria = (courseStats, state, mandatoryCourses, getTextIn) => {
  if (!courseStats) {
    return []
  }

  const { sortCriteria, codeFilter, nameFilter, reversed } = state

  const courseCodeFilter = ({ course }) => {
    const { code } = course
    return code.toLowerCase().includes(codeFilter.toLowerCase())
  }
  const courseNameFilter = ({ course }) => {
    const { name } = course
    return getTextIn(name).toLowerCase().includes(nameFilter.toLowerCase())
  }

  const mandatoryFilter = ({ course }) => {
    return (
      (mandatoryCourses.defaultProgrammeCourses &&
        mandatoryCourses.defaultProgrammeCourses.some(c => c.code === course.code)) ||
      (mandatoryCourses.secondProgrammeCourses &&
        mandatoryCourses.secondProgrammeCourses.some(c => c.code === course.code))
    )
  }

  const filteredCourses =
    courseStats &&
    mandatoryCourses &&
    courseStats
      .filter(mandatoryFilter)
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
  filteredStudentsLength: props.filteredStudentsLength || 0,
})

const useDelayedMemo = (fn, watch) => {
  const [cached, setCached] = useState(fn())

  useEffect(() => setCached(fn()), watch)

  return cached
}

const PopulationCourseStats = props => {
  const { getTextIn } = useLanguage()
  const [filterFields, setFilterFields] = useState({ codeFilter: '', nameFilter: '' })
  const [modules, setModules] = useState([])
  const [state, setState] = useState(initialState(props))
  const [expandedGroups, setExpandedGroups] = useState(new Set())
  const mandatoryCourses = useSelector(({ populationMandatoryCourses }) => populationMandatoryCourses.data)
  const { handleTabChange } = useTabChangeAnalytics()

  const courseStatistics = useDelayedMemo(
    () => updateCourseStatisticsCriteria(props.courses?.coursestatistics, state, mandatoryCourses, getTextIn),
    [props.courses, state]
  )

  useEffect(() => {
    if (state && props.courses) {
      const studentAmountLimit =
        state.filteredStudentsLength !== props.filteredStudents.length
          ? Math.round(props.filteredStudents.length * 0.3)
          : state.studentAmountLimit

      setState({
        ...state,
        initialSortReady: true,
        studentAmountLimit,
        filteredStudentsLength: props.filteredStudents.length,
      })
    }
  }, [props.courses, props.filteredStudents])

  useEffect(() => {
    const { codeFilter, nameFilter, reversed, sortCriteria } = state
    const {
      courses: { coursestatistics },
      language,
    } = props
    const courseCodeFilter = ({ course }) => {
      if (!codeFilter) return true

      const { code } = course
      return code.toLowerCase().includes(codeFilter.toLowerCase())
    }
    const courseNameFilter = ({ course }) => {
      if (!nameFilter) return true

      const { name } = course
      return getTextIn(name, language).toLowerCase().includes(nameFilter.toLowerCase())
    }
    const visibleCoursesFilter = ({ course }) => {
      return (
        (mandatoryCourses.defaultProgrammeCourses &&
          mandatoryCourses.defaultProgrammeCourses.some(c => c.code === course.code)) ||
        (mandatoryCourses.secondProgrammeCourses &&
          mandatoryCourses.secondProgrammeCourses.some(c => c.code === course.code))
      )
    }

    const filteredCourses =
      coursestatistics &&
      mandatoryCourses &&
      coursestatistics
        .filter(visibleCoursesFilter)
        .filter(courseCodeFilter)
        .filter(courseNameFilter)
        // it needs to be with flatMap and filter and not map and find
        // because there can be many mandatoryCourses with the same course code
        // as they can belong to many categories
        .flatMap(c => {
          const defaultProgrammeCourses = mandatoryCourses.defaultProgrammeCourses.filter(
            mc => mc.code === c.course.code
          )
          const secondProgrammeCourses = mandatoryCourses.secondProgrammeCourses.filter(mc => mc.code === c.course.code)
          return [
            ...defaultProgrammeCourses.map(course => ({ ...c, ...course })),
            ...secondProgrammeCourses.map(course => ({ ...c, ...course })),
          ]
        })

    const lodashSortOrder = reversed ? lodashSortOrderTypes.DESC : lodashSortOrderTypes.ASC

    const sortedStatistics = orderBy(
      filteredCourses,
      [course => course.stats[sortCriteria], course => course.course.code],
      [lodashSortOrder, lodashSortOrderTypes.ASC]
    )

    const modules = {}

    sortedStatistics.forEach(course => {
      if (!modules[course.parent_code]) {
        modules[course.parent_code] = {
          module: { code: course.parent_code, name: course.parent_name },
          courses: [],
        }
      }
      modules[course.parent_code].courses.push(course)
    })

    Object.keys(modules).forEach(m => {
      if (modules[m].courses.length === 0) {
        delete modules[m]
      }
    })

    setModules(
      orderBy(
        Object.entries(modules).map(([, { module, courses }]) => ({
          module,
          courses,
        })),
        item => item.module.order
      )
    )
  }, [state.studentAmountLimit, props.courses.coursestatistics, state.codeFilter, state.nameFilter, mandatoryCourses])

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

  const onGoToCourseStatisticsClick = useCallback(() => {
    const { clearCourseStats: clearCourseStatsfn } = props
    clearCourseStatsfn()
  }, [props.clearCourseStats])

  const onFilterReset = field => {
    setFilterFields({ ...filterFields, [field]: '' })
  }

  const toggleGroupExpansion = (code, close = false, all = null) => {
    if (all) {
      setExpandedGroups(new Set(all))
    } else if (close) {
      setExpandedGroups(new Set())
    } else {
      const newExpandedGroups = new Set(expandedGroups)
      if (newExpandedGroups.has(code)) {
        newExpandedGroups.delete(code)
      } else {
        newExpandedGroups.add(code)
      }
      setExpandedGroups(newExpandedGroups)
    }
  }

  const getFilterValue = field => (field in filterFields ? filterFields[field] || '' : '')

  const renderFilterInputHeaderCell = (field, name, colSpan = '') => {
    return (
      <Table.HeaderCell width="6" colSpan={colSpan}>
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

  const { courses, pending } = props
  const { sortCriteria, reversed } = state
  const contextValue = {
    courseStatistics,
    modules,
    filterInput: renderFilterInputHeaderCell,
    onGoToCourseStatisticsClick,
    onSortableColumnHeaderClick,
    tableColumnNames,
    sortCriteria,
    reversed,
    courses,
    toggleGroupExpansion,
    expandedGroups,
  }

  const panes = [
    {
      menuItem: 'pass/fail',
      render: () => (
        <Tab.Pane className="menuTab">
          <PassFailEnrollments
            expandedGroups={expandedGroups}
            toggleGroupExpansion={toggleGroupExpansion}
            onlyIamRights={props.onlyIamRights}
          />
        </Tab.Pane>
      ),
    },
    {
      menuItem: 'grades',
      render: () => (
        <Tab.Pane className="menuTab">
          <GradeDistribution
            expandedGroups={expandedGroups}
            toggleGroupExpansion={toggleGroupExpansion}
            onlyIamRights={props.onlyIamRights}
          />
        </Tab.Pane>
      ),
    },
    {
      menuItem: 'when passed',
      render: () => (
        <Tab.Pane className="menuTab">
          <PassingSemesters
            filterInput={renderFilterInputHeaderCell}
            courseStatistics={courseStatistics}
            expandedGroups={expandedGroups}
            toggleGroupExpansion={toggleGroupExpansion}
            onlyIamRights={props.onlyIamRights}
          />
        </Tab.Pane>
      ),
    },
    {
      menuItem: 'students',
      hideIfOnlyIamRights: true,
      render: () => (
        <Tab.Pane className="menuTab">
          <Students
            filteredStudents={props.filteredStudents}
            expandedGroups={expandedGroups}
            toggleGroupExpansion={toggleGroupExpansion}
          />
        </Tab.Pane>
      ),
    },
  ].filter(p => !(p.hideIfOnlyIamRights && props.onlyIamRights))

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
      <PopulationCourseContext.Provider value={contextValue}>
        <Tab panes={panes} onTabChange={handleTabChange} />
      </PopulationCourseContext.Provider>
    </div>
  )
}

export default connect(null, {
  clearCourseStats,
})(withRouter(PopulationCourseStats))
