import React, { useState, useEffect } from 'react'
import { Segment, Header, Form } from 'semantic-ui-react'
import { connect } from 'react-redux'
import { withRouter } from 'react-router-dom'
import qs from 'query-string'
import { sortBy } from 'lodash'
import { func, arrayOf, shape, bool } from 'prop-types'
import { clearCourses, findCoursesV2 } from '../../../redux/coursesearch'
import { getCourseStats, clearCourseStats } from '../../../redux/coursestats'
import AutoSubmitSearchInput from '../../AutoSubmitSearchInput'
import CourseTable from '../CourseTable'
import { getCourseSearchResults } from '../../../selectors/courses'
import { useSearchHistory } from '../../../common'
import SearchHistory from '../../SearchHistory'

const INITIAL = {
  courseName: '',
  courseCode: '',
  selectedCourses: {},
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
    separate
  } = state

  const parseQueryFromUrl = () => {
    const { location } = props
    const { courseCodes, separate, ...rest } = qs.parse(location.search)
    const query = {
      ...INITIAL,
      ...rest,
      courseCodes: JSON.parse(courseCodes),
      separate: JSON.parse(separate)
    }
    return query
  }

  const fetchStatisticsFromUrlParams = () => {
    const query = parseQueryFromUrl()
    setState({ ...state, ...query })
    props.getCourseStats(query, props.onProgress)
  }

  useEffect(() => {
    const { location } = props
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

    if (isSelected) {
      const { [course.code]: omit, ...rest } = selectedCourses
      setState({
        ...state,
        selectedCourses: rest
      })
    } else {
      setState({
        ...state,
        selectedCourses: {
          ...selectedCourses,
          [course.code]: { ...course, selected: true }
        }
      })
    }
  }

  const pushQueryToUrl = (query) => {
    const { history } = props
    const { courseCodes, ...rest } = query
    const queryObject = { ...rest, courseCodes: JSON.stringify(courseCodes) }
    const searchString = qs.stringify(queryObject)
    history.push({ search: searchString })
  }

  const onSubmitFormClick = async () => {
    const codes = sortBy(Object.keys(selectedCourses))
    const params = {
      courseCodes: codes,
      separate
    }
    const searchHistoryText = codes.map(code => `${selectedCourses[code].name} ${code}`)
    addItemToSearchHistory({
      text: searchHistoryText.join(', '),
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

  const { isLoading, matchingCourses } = props
  const courses = matchingCourses.filter(c => !selectedCourses[c.code])

  const disabled = isLoading || Object.keys(selectedCourses).length === 0
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

SearchForm.defaultProps = {
  onProgress: null
}

SearchForm.propTypes = {
  findCoursesV2: func.isRequired,
  getCourseStats: func.isRequired,
  clearCourses: func.isRequired,
  clearCourseStats: func.isRequired,
  matchingCourses: arrayOf(shape({})).isRequired,
  isLoading: bool.isRequired,
  coursesLoading: bool.isRequired,
  history: shape({}).isRequired,
  location: shape({}).isRequired,
  onProgress: func
}

const mapStateToProps = (state) => {
  const { pending: courseStatsPending } = state.courseStats
  return {
    matchingCourses: getCourseSearchResults(state),
    isLoading: courseStatsPending,
    coursesLoading: state.courseSearch.pending
  }
}

export default withRouter(connect(mapStateToProps, {
  getCourseStats,
  clearCourses,
  findCoursesV2,
  clearCourseStats
})(SearchForm))
