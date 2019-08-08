import React, { useState, useEffect, Fragment } from 'react'
import { Segment, Header, Form } from 'semantic-ui-react'
import { connect } from 'react-redux'
import { withRouter } from 'react-router-dom'
import qs from 'query-string'
import { func, arrayOf, shape, bool } from 'prop-types'
import { getSemesters } from '../../../redux/semesters'
import { clearCourses, findCoursesV2 } from '../../../redux/coursesearch'
import { getCourseStats, clearCourseStats } from '../../../redux/coursestats'
import AutoSubmitSearchInput from '../../AutoSubmitSearchInput'
import CourseTable from '../CourseTable'
import { getCourseSearchResults } from '../../../selectors/courses'
import { useSearchHistory } from '../../../common'
import SearchHistory from '../../SearchHistory'
import { getStartAndEndYearValues } from '../courseStatisticsUtils'
import YearFilter from './YearFilter'

const INITIAL = {
  courseName: '',
  courseCode: '',
  selectedCourses: {},
  fromYear: undefined,
  toYear: undefined,
  separate: false
}

const SearchForm = (props) => {
  const [state, setState] = useState({
    ...INITIAL
  })
  const [searchHistory, addItemToSearchHistory] = useSearchHistory('courseSearch', 6)

  const {
    courseName,
    courseCode,
    selectedCourses,
    fromYear,
    toYear,
    separate
  } = state

  const parseQueryFromUrl = () => {
    const { location } = props
    const { courseCodes, fromYear, toYear, separate, ...rest } = qs.parse(location.search)
    const query = {
      ...INITIAL,
      ...rest,
      courseCodes: JSON.parse(courseCodes),
      fromYear: JSON.parse(fromYear),
      toYear: JSON.parse(toYear),
      separate: JSON.parse(separate)
    }
    return query
  }

  const fetchStatisticsFromUrlParams = () => {
    const query = parseQueryFromUrl()
    setState({ ...state, ...query, selectedCourses: query.courseCodes })
    props.getCourseStats(query)
  }

  useEffect(() => {
    const { location } = props
    props.getSemesters()
    if (!location.search) {
      props.clearCourses()
      props.clearCourseStats()
    }
  }, [])

  useEffect(() => {
    const { location } = props
    if (location.search) {
      fetchStatisticsFromUrlParams()
    }
  }, [props.location.search])

  const onSelectCourse = (course) => {
    course.selected = !course.selected
    const isSelected = !!selectedCourses[course.code]
    const { fromYear: newFromYear, toYear: newToYear } = getStartAndEndYearValues(course, props.years)

    if (isSelected) {
      const { [course.code]: omit, ...rest } = selectedCourses
      setState({ ...state, selectedCourses: rest })
    } else {
      setState({
        ...state,
        selectedCourses: {
          ...selectedCourses,
          [course.code]: { ...course, selected: true }
        },
        fromYear: fromYear < newFromYear ? fromYear : newFromYear,
        toYear: toYear > newToYear ? toYear : newToYear
      })
    }
  }

  const onToggleCheckbox = (e, target) => {
    const { name } = target
    setState({ ...state, [name]: !state[name] })
  }

  const pushQueryToUrl = (query) => {
    const { history } = props
    const { courseCodes, ...rest } = query
    const queryObject = { ...rest, courseCodes: JSON.stringify(courseCodes) }
    const searchString = qs.stringify(queryObject)
    history.push({ search: searchString })
  }

  const onSubmitFormClick = async () => {
    const params = {
      fromYear,
      toYear,
      courseCodes: Object.keys(selectedCourses),
      separate
    }
    const { years } = props
    const from = years.find(year => year.key === fromYear)
    const to = years.find(year => year.key === toYear)
    const searchHistoryText = params.courseCodes.map(code => `${selectedCourses[code].name} ${code}`)
    addItemToSearchHistory({
      text: `${searchHistoryText.join(', ')} from: ${from.text} to: ${to.text}`,
      params
    })
    pushQueryToUrl(params)
  }

  const fetchCourses = () => {
    const validateParam = (param, minLength) => param && param.length >= minLength
    const isValidName = validateParam(courseName, 5)
    const isValidCode = validateParam(courseCode, 2)

    if (isValidName || isValidCode) {
      return props.findCoursesV2({ name: courseName, code: courseCode })
    }
    if (courseName.length === 0 && courseCode.length === 0) {
      props.clearCourses()
    }
    return Promise.resolve()
  }

  const handleChange = (e, target) => {
    const { name, value } = target
    setState({ ...state, [name]: value })
  }

  const { years, isLoading, matchingCourses } = props
  const courses = matchingCourses.filter(c => !selectedCourses[c.code])

  const disabled = (!fromYear || Object.keys(selectedCourses).length === 0) || isLoading
  const selected = Object.values(selectedCourses).map(course => ({ ...course, selected: true }))
  const noSelectedCourses = selected.length === 0
  const noQueryStrings = !courseName && !courseCode

  return (
    <React.Fragment>
      <Segment loading={isLoading}>
        <Form>
          <Header content="Search for courses" />
          <div style={{ marginBottom: '15px' }}>
            <Form.Group widths="equal">
              <Form.Field>
                <label>Name:</label>
                <AutoSubmitSearchInput
                  doSearch={fetchCourses}
                  placeholder="Search by entering a course name"
                  value={courseName}
                  onChange={cn => setState({ ...state, courseName: cn })}
                  loading={props.coursesLoading}
                  minSearchLength={0}
                />
              </Form.Field>
              <Form.Field>
                <label>Code:</label>
                <AutoSubmitSearchInput
                  doSearch={fetchCourses}
                  placeholder="Search by entering a course code"
                  value={courseCode}
                  onChange={cc => setState({ ...state, courseCode: cc })}
                  loading={props.coursesLoading}
                  minSearchLength={0}
                />
              </Form.Field>
            </Form.Group>
            <CourseTable
              title="Selected courses"
              hidden={noSelectedCourses}
              courses={selected}
              onSelectCourse={onSelectCourse}
              controlIcon="remove"
            />
            {!noSelectedCourses &&
              <Fragment>
                <YearFilter
                  fromYear={fromYear}
                  toYear={toYear}
                  years={years}
                  separate={separate}
                  handleChange={handleChange}
                  onToggleCheckbox={onToggleCheckbox}
                  showCheckbox
                />
                <Form.Button
                  type="button"
                  disabled={disabled}
                  fluid
                  size="huge"
                  primary
                  basic
                  positive
                  content="Fetch statistics"
                  onClick={onSubmitFormClick}
                />
              </Fragment>
            }
            <CourseTable
              hidden={noQueryStrings || isLoading}
              courses={courses}
              title="Searched courses"
              onSelectCourse={onSelectCourse}
              controlIcon="plus"
            />
          </div>
        </Form>
      </Segment>
      <SearchHistory
        handleSearch={pushQueryToUrl}
        items={searchHistory}
      />
    </React.Fragment>
  )
}

SearchForm.propTypes = {
  findCoursesV2: func.isRequired,
  getSemesters: func.isRequired,
  getCourseStats: func.isRequired,
  clearCourses: func.isRequired,
  clearCourseStats: func.isRequired,
  matchingCourses: arrayOf(shape({})).isRequired,
  years: arrayOf(shape({})).isRequired,
  isLoading: bool.isRequired,
  coursesLoading: bool.isRequired,
  history: shape({}).isRequired,
  location: shape({}).isRequired
}

const mapStateToProps = (state) => {
  const { years = [] } = state.semesters.data
  const { pending: courseStatsPending } = state.courseStats
  return {
    matchingCourses: getCourseSearchResults(state),
    years: Object.values(years).map(({ yearcode, yearname }) => ({
      key: yearcode,
      text: yearname,
      value: yearcode
    })).reverse(),
    isLoading: courseStatsPending,
    coursesLoading: state.courseSearch.pending
  }
}

export default withRouter(connect(mapStateToProps, {
  getSemesters,
  getCourseStats,
  clearCourses,
  findCoursesV2,
  clearCourseStats
})(SearchForm))
