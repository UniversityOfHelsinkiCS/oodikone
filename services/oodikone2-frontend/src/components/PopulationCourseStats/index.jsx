import React, { useState, useEffect, useCallback } from 'react'
import { connect, useSelector } from 'react-redux'
import { Table, Form, Input, Tab, Icon } from 'semantic-ui-react'
import { func, arrayOf, object, shape, string, bool } from 'prop-types'
import { orderBy, debounce } from 'lodash'
import { withRouter } from 'react-router-dom'
import { clearCourseStats } from '../../redux/coursestats'
import PassingSemesters from './PassingSemesters'
import './populationCourseStats.css'
import { PopulationCourseContext } from './PopulationCourseContext'
import TSA from '../../common/tsa'
import GradeDistribution from './GradeDistribution'
import PassFail from './PassFail'
import Students from './Students'
import { getUserIsAdmin, getTextIn } from '../../common'
import useCourseFilter from '../FilterTray/filters/Courses/useCourseFilter'
import useFilterTray from '../FilterTray/useFilterTray'
import { contextKey as filterTrayContextKey } from '../FilterTray'
import { contextKey as coursesFilterContextKey } from '../FilterTray/filters/Courses'
import useAnalytics from '../FilterTray/useAnalytics'
import useLanguage from '../LanguagePicker/useLanguage'

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

function updateCourseStatisticsCriteria(props, language, state, mandatoryCourses) {
  const { sortCriteria, codeFilter, nameFilter, reversed } = state
  const {
    courses: { coursestatistics }
  } = props

  const courseCodeFilter = ({ course }) => {
    const { code } = course
    return code.toLowerCase().includes(codeFilter.toLowerCase())
  }
  const courseNameFilter = ({ course }) => {
    const { name } = course
    return getTextIn(name, language)
      .toLowerCase()
      .includes(nameFilter.toLowerCase())
  }

  const mandatoryFilter = ({ course }) => {
    return mandatoryCourses.some(c => c.code === course.code)
  }

  const filteredCourses =
    coursestatistics &&
    mandatoryCourses &&
    coursestatistics
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
  selectedStudentsLength: props.selectedStudentsLength || 0
})

function PopulationCourseStats(props) {
  const [filterFields, setFilterFields] = useState({ codeFilter: '', nameFilter: '' })
  const [modules, setModules] = useState([])
  const [courseStatistics, setCourseStatistics] = useState(
    updateCourseStatisticsCriteria(props, language, initialState(props))
  )
  const [expandedGroups, setExpandedGroups] = useState(new Set())

  const { language } = useLanguage()
  const [state, setState] = useState(initialState(props))
  const mandatoryCourses = useSelector(({ populationMandatoryCourses }) => populationMandatoryCourses.data)
  const [, setFilterTrayOpen] = useFilterTray(filterTrayContextKey)
  const [, setCourseFilterOpen] = useFilterTray(coursesFilterContextKey)
  const { toggleCourseSelection, courseIsSelected } = useCourseFilter()
  const filterAnalytics = useAnalytics()

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
      setCourseStatistics(updateCourseStatisticsCriteria(props, language, state, mandatoryCourses))
    }
  }, [props.courses, props.selectedStudents])

  useEffect(() => {
    const { codeFilter, nameFilter, reversed, sortCriteria } = state
    const {
      courses: { coursestatistics },
      language
    } = props
    const courseCodeFilter = ({ course }) => {
      const { code } = course
      return code.toLowerCase().includes(codeFilter.toLowerCase())
    }
    const courseNameFilter = ({ course }) => {
      const { name } = course
      return getTextIn(name, language)
        .toLowerCase()
        .includes(nameFilter.toLowerCase())
    }

    const mandatoryFilter = ({ course }) => {
      return mandatoryCourses.some(c => c.code === course.code && c.visible.visibility)
    }

    const filteredCourses =
      coursestatistics &&
      mandatoryCourses &&
      coursestatistics
        .filter(mandatoryFilter)
        .filter(c => !codeFilter || courseCodeFilter(c))
        .filter(c => !nameFilter || courseNameFilter(c))
        .map(c => {
          const course = mandatoryCourses.find(mc => mc.code === c.course.code)
          return { ...c, ...course }
        })

    const lodashSortOrder = reversed ? lodashSortOrderTypes.DESC : lodashSortOrderTypes.ASC

    const sortedStatistics = orderBy(
      filteredCourses,
      [course => course.stats[sortCriteria], course => course.course.code],
      [lodashSortOrder, lodashSortOrderTypes.ASC]
    )

    const modules = {}

    sortedStatistics.forEach(course => {
      const code = course.label_code
      if (!code) {
        return
      }
      if (!modules[code]) {
        modules[code] = []
      }
      modules[code].push(course)
    })

    Object.keys(modules).forEach(m => {
      if (modules[m].length === 0) {
        delete modules[m]
      }
    })

    setModules(
      Object.entries(modules)
        .map(([module, courses]) => ({
          module: { code: module, name: courses[0].label_name, order: courses[0].module_order },
          courses
        }))
        .sort((a, b) => a.module.order - b.module.order)
    )

    setCourseStatistics(sortedStatistics)
  }, [state.studentAmountLimit, state.codeFilter, state.nameFilter, mandatoryCourses])

  const onFilterChange = (e, field) => {
    const {
      target: { value }
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

  const handleCourseStatisticsCriteriaChange = () => {
    // eslint-disable-next-line react/no-access-state-in-setstate
    const courseStatistics = updateCourseStatisticsCriteria(props, language, state)
    setCourseStatistics(courseStatistics)
  }

  const onSetFilterKeyPress = e => {
    const { key } = e
    const enterKey = 'Enter'
    const isEnterKeyPress = key === enterKey
    if (isEnterKeyPress) {
      handleCourseStatisticsCriteriaChange()
    }
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

  const onCourseNameCellClick = code => {
    const courseStatistic = props.populationCourses.data.coursestatistics.find(cs => cs.course.code === code)
    if (courseStatistic) {
      const isSelected = courseIsSelected(code)
      const name = 'Course Filtername'

      if (isSelected) {
        filterAnalytics.clearFilterViaTable(name)
      } else {
        filterAnalytics.setFilterViaTable(name)
      }

      toggleCourseSelection(code)
      setFilterTrayOpen(true)
      setCourseFilterOpen(true)
    }
  }

  const onFilterReset = field => {
    setFilterFields({ ...filterFields, [field]: '' })
  }

  const toggleGroupExpansion = code => {
    const newExpandedGroups = new Set(expandedGroups)
    newExpandedGroups.has(code) ? newExpandedGroups.delete(code) : newExpandedGroups.add(code)
    setExpandedGroups(newExpandedGroups)
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
            onKeyPress={onSetFilterKeyPress}
            value={getFilterValue(field)}
            icon={getFilterValue(field) ? <Icon name="delete" link onClick={() => onFilterReset(field)} /> : undefined}
          />
        </div>
      </Table.HeaderCell>
    )
  }

  const { courses, pending, isAdmin } = props
  const { sortCriteria, reversed } = state
  const contextValue = {
    courseStatistics,
    modules,
    filterInput: renderFilterInputHeaderCell,
    onCourseNameCellClick,
    onGoToCourseStatisticsClick,
    onSortableColumnHeaderClick,
    tableColumnNames,
    sortCriteria,
    reversed
  }

  const panes = [
    {
      menuItem: 'pass/fail',
      render: () => (
        <div className="menuTab">
          <PassFail expandedGroups={expandedGroups} toggleGroupExpansion={toggleGroupExpansion} />
        </div>
      )
    },
    {
      menuItem: 'grades',
      render: () => (
        <div className="menuTab">
          <GradeDistribution expandedGroups={expandedGroups} toggleGroupExpansion={toggleGroupExpansion} />
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
            expandedGroups={expandedGroups}
            toggleGroupExpansion={toggleGroupExpansion}
          />
        </div>
      )
    },
    {
      menuItem: 'students',
      render: () => (
        <div className="menuTab" style={{ marginTop: '0.5em' }}>
          <Students expandedGroups={expandedGroups} toggleGroupExpansion={toggleGroupExpansion} />
        </div>
      )
    }
  ]

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
  populationCourses: shape({
    data: shape({ coursestatistics: arrayOf(shape({ course: shape({ code: string, name: shape({}) }) })) })
  }).isRequired,
  clearCourseStats: func.isRequired,
  pending: bool.isRequired,
  selectedStudents: arrayOf(string).isRequired,
  isAdmin: bool.isRequired,
  years: shape({}) // eslint-disable-line
}

const mapStateToProps = state => {
  const { years } = state.semesters.data
  const isAdmin = getUserIsAdmin(state.auth.token.roles)

  return {
    years,
    populationCourses: state.populationCourses,
    isAdmin
  }
}

export default connect(
  mapStateToProps,
  {
    clearCourseStats
  }
)(withRouter(PopulationCourseStats))
