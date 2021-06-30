import React, { useState, useEffect, Fragment } from 'react'
import { Segment, Header, Form } from 'semantic-ui-react'
import { connect } from 'react-redux'
import { withRouter } from 'react-router-dom'
import qs from 'query-string'
import { sortBy } from 'lodash'
import { func, arrayOf, shape, bool } from 'prop-types'
import { clearCourses, findCoursesV2, toggleUnifyOpenUniCourses } from '../../../redux/coursesearch'
import { getCourseStats, clearCourseStats } from '../../../redux/coursestats'
import { getCourseStatsDiff, clearOodiSisDiff } from '../../../redux/oodiSisDiff'
import { getCourseSearchResults } from '../../../selectors/courses'
import { useSearchHistory, usePrevious, useIsAdmin } from '../../../common/hooks'
import { validateInputLength, getTextIn } from '../../../common'
import TSA from '../../../common/tsa'
import AutoSubmitSearchInput from '../../AutoSubmitSearchInput'
import CourseTable from '../CourseTable'
import SearchHistory from '../../SearchHistory'
import useLanguage from '../../LanguagePicker/useLanguage'
import filterCourseSearchResults from './searchFormUtils'

const sendAnalytics = (action, name, value) => TSA.Matomo.sendEvent('Course statistics search', action, name, value)

const INITIAL = {
  courseName: '',
  courseCode: '',
  selectedCourses: {},
  separate: false
}

const searchBoxStyle = {
  border: '2px solid black',
  borderRadius: '0.3em',
  padding: '12px',
  boxShadow: '0 2px 4px 0 rgb(34 36 38 / 12%), 0 2px 10px 0 rgb(34 36 38 / 15%)'
}

const useTSASearchResultsHook = (coursesLoading, courseName, courseCode, matchingCoursesLength) => {
  const prevCoursesLoading = usePrevious(coursesLoading)

  useEffect(() => {
    const wasLoadingButFinished = prevCoursesLoading && !coursesLoading
    if (!wasLoadingButFinished) {
      // only send events after user has seen results
      return
    }

    if (courseName && courseCode) {
      sendAnalytics('Search with both name and code', `${courseName}, ${courseCode}`, matchingCoursesLength)
    } else if (courseName) {
      sendAnalytics('Search with name', courseName, matchingCoursesLength)
    } else if (courseCode) {
      sendAnalytics('Search with code', courseCode, matchingCoursesLength)
    }
  }, [coursesLoading, courseName, courseCode, matchingCoursesLength])
}

const SearchForm = props => {
  // console.log('matchingCourses: ', props.matchingCourses)
  const { language } = useLanguage()
  const [state, setState] = useState({
    ...INITIAL
  })
  const [searchHistory, addItemToSearchHistory, updateItemInSearchHistory] = useSearchHistory('courseSearch', 6)
  const isAdmin = useIsAdmin()

  const { courseName, courseCode, selectedCourses, separate } = state
  const { coursesLoading, isLoading, matchingCourses, unifyOpenUniCourses, showDiff, setShowDiff } = props

  const parseQueryFromUrl = () => {
    const { location } = props
    const { courseCodes, separate, unifyOpenUniCourses, ...rest } = qs.parse(location.search)
    const query = {
      ...INITIAL,
      ...rest,
      courseCodes: JSON.parse(courseCodes),
      separate: JSON.parse(separate),
      unifyOpenUniCourses: JSON.parse(unifyOpenUniCourses || false)
    }
    return query
  }

  const fetchStatisticsFromUrlParams = () => {
    const query = parseQueryFromUrl()
    setState({ ...state, ...query })
    if (showDiff) {
      props.getCourseStatsDiff(query, props.onProgress)
    } else {
      props.getCourseStats(query, props.onProgress)
    }
  }

  useEffect(() => {
    const { location } = props
    if (!location.search) {
      props.clearCourses()
      props.clearCourseStats()
      props.clearOodiSisDiff()
    }
  }, [])

  useEffect(() => {
    const { location } = props
    if (location.search) {
      fetchStatisticsFromUrlParams()
    }
  }, [props.location.search])

  useTSASearchResultsHook(coursesLoading, courseName, courseCode, matchingCourses.length)

  const onSelectCourse = course => {
    course.selected = !course.selected
    const isSelected = !!selectedCourses[course.code]

    if (isSelected) {
      const { [course.code]: omit, ...rest } = selectedCourses
      sendAnalytics('Unselected course', course.name)
      setState({
        ...state,
        selectedCourses: rest
      })
    } else {
      sendAnalytics('Selected course', course.name)
      setState({
        ...state,
        selectedCourses: {
          ...selectedCourses,
          [course.code]: { ...course, selected: true }
        }
      })
    }
  }

  const pushQueryToUrl = query => {
    const { history } = props
    const { courseCodes, ...rest } = query
    const queryObject = { ...rest, courseCodes: JSON.stringify(courseCodes) }
    const searchString = qs.stringify(queryObject)
    history.push({ search: searchString })
  }

  const onSearchHistorySelected = historyItem => {
    sendAnalytics(
      'Select Previous Search',
      historyItem && historyItem.courseCodes && historyItem.courseCodes.join && historyItem.courseCodes.join(',')
    )
    pushQueryToUrl(historyItem)
  }

  const onSubmitFormClick = () => {
    const codes = sortBy(Object.keys(selectedCourses))
    const params = {
      courseCodes: codes,
      separate,
      unifyOpenUniCourses: props.unifyOpenUniCourses
    }
    const searchHistoryText = codes.map(code => `${getTextIn(selectedCourses[code].name, language)} ${code}`)
    addItemToSearchHistory({
      text: searchHistoryText.join(', '),
      params
    })
    pushQueryToUrl(params)
  }

  const fetchCourses = () => {
    const isValidName = validateInputLength(courseName, 5)
    const isValidCode = validateInputLength(courseCode, 2)

    if (isValidName || isValidCode) {
      return props.findCoursesV2({ name: courseName, code: courseCode })
    }
    if (courseName.length < 5 && courseCode.length < 2) {
      props.clearCourses()
    }
    return Promise.resolve()
  }

  const onToggleSeparateStatistics = () => {
    const newValue = !state.separate
    setState({ ...state, separate: newValue })
    sendAnalytics('Toggle Separate stats for spring & fall', `${newValue}`)
  }

  const onToggleUnifyOpenUniCoursesCheckbox = () => {
    const newValue = !unifyOpenUniCourses
    sendAnalytics('Toggle Unify open university courses', `${newValue}`)

    setState({ ...state, selectedCourses: {} })
    props.toggleUnifyOpenUniCourses()
  }

  const courses = matchingCourses.filter(c => !selectedCourses[c.code])

  const disabled = isLoading || Object.keys(selectedCourses).length === 0
  const selected = Object.values(selectedCourses).map(course => ({ ...course, selected: true }))
  const noSelectedCourses = selected.length === 0

  const addAllCourses = () => {
    courses.forEach(course => {
      course.selected = true
    })

    const newSelectedCourses = courses.reduce((newSelected, course) => {
      newSelected[course.code] = { ...course }
      return newSelected
    }, {})

    setState({
      ...state,
      selectedCourses: {
        ...selectedCourses,
        ...newSelectedCourses
      }
    })
  }

  return (
    <React.Fragment>
      <Segment loading={isLoading}>
        <Form>
          <Header>Search for courses</Header>
          <div style={{ marginBottom: '15px' }}>
            <Form.Group>
              <Form.Field width={8}>
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
              <Form.Field width={3}>
                <label>Code:</label>
                <AutoSubmitSearchInput
                  doSearch={fetchCourses}
                  placeholder="Search by a course code"
                  value={courseCode}
                  onChange={cc => setState({ ...state, courseCode: cc })}
                  loading={props.coursesLoading}
                  minSearchLength={0}
                  data-cy="course-code-input"
                />
              </Form.Field>
              <Form.Field width={4} style={{ display: 'flex', flexDirection: 'column' }}>
                <label>Unify open university courses:</label>
                <span style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
                  <Form.Checkbox
                    name="unifyOpenUniCourses"
                    onChange={onToggleUnifyOpenUniCoursesCheckbox}
                    checked={unifyOpenUniCourses}
                  />
                </span>
              </Form.Field>
              {isAdmin && (
                <Form.Field width={4} style={{ display: 'flex', flexDirection: 'column' }}>
                  <label>Show Oodi/SIS diff</label>
                  <span style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
                    <Form.Checkbox onChange={() => setShowDiff(!showDiff)} checked={showDiff} />
                  </span>
                </Form.Field>
              )}
            </Form.Group>
            <div style={!noSelectedCourses ? searchBoxStyle : null}>
              <CourseTable
                title="Selected courses"
                hidden={noSelectedCourses}
                courses={selected}
                onSelectCourse={onSelectCourse}
                controlIcon="trash alternate outline"
                selectedTable
              />
              {!noSelectedCourses && (
                <Fragment>
                  <Form.Checkbox
                    label="Separate statistics for Spring and Fall semesters"
                    name="separate"
                    onChange={onToggleSeparateStatistics}
                    checked={separate}
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
                    data-cy="fetch-stats-button"
                  />
                </Fragment>
              )}
            </div>
            <CourseTable
              hidden={isLoading}
              courses={courses}
              title="Searched courses"
              onSelectCourse={onSelectCourse}
            />
            {courses.length ? (
              <div className="select-all-container">
                <Form.Button
                  type="button"
                  size="large"
                  content="Select all search results"
                  basic
                  color="green"
                  onClick={addAllCourses}
                />
              </div>
            ) : null}
          </div>
        </Form>
      </Segment>
      <SearchHistory
        disabled={isLoading}
        handleSearch={onSearchHistorySelected}
        items={searchHistory}
        updateItem={updateItemInSearchHistory}
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
  unifyOpenUniCourses: bool.isRequired,
  toggleUnifyOpenUniCourses: func.isRequired,
  onProgress: func,
  clearOodiSisDiff: func.isRequired,
  getCourseStatsDiff: func.isRequired,
  showDiff: bool.isRequired,
  setShowDiff: func.isRequired
}

const mapStateToProps = state => {
  const { courses } = getCourseSearchResults(state)
  const { pending: courseStatsPending } = state.courseStats
  const { unifyOpenUniCourses } = state.courseSearch
  return {
    matchingCourses: filterCourseSearchResults(courses, unifyOpenUniCourses),
    // newMatchingCourses: filterCourseSearchResults(groups, courses, groupMeta, unifyOpenUniCourses, newMeta),
    isLoading: courseStatsPending,
    coursesLoading: state.courseSearch.pending,
    unifyOpenUniCourses
  }
}

export default withRouter(
  connect(mapStateToProps, {
    getCourseStats,
    clearCourses,
    findCoursesV2,
    clearCourseStats,
    toggleUnifyOpenUniCourses,
    getCourseStatsDiff,
    clearOodiSisDiff
  })(SearchForm)
)
