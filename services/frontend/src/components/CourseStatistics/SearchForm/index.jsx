import React, { useState, useEffect } from 'react'
import { Segment, Header, Form } from 'semantic-ui-react'
import { useSelector, useDispatch } from 'react-redux'
import { withRouter } from 'react-router-dom'
import qs from 'query-string'
import { sortBy } from 'lodash'
import { func, shape } from 'prop-types'
import { clearCourses, findCoursesV2 } from '../../../redux/coursesearch'
import { getCourseStats, clearCourseStats } from '../../../redux/coursestats'
import { getCourseSearchResults } from '../../../selectors/courses'
import { useSearchHistory } from '../../../common/hooks'
import { validateInputLength } from '../../../common'
import AutoSubmitSearchInput from '../../AutoSubmitSearchInput'
import CourseTable from '../CourseTable'
import SearchHistory from '../../SearchHistory'
import useLanguage from '../../LanguagePicker/useLanguage'

const INITIAL = {
  courseName: '',
  courseCode: '',
  selectedCourses: {},
  separate: false,
}

const searchBoxStyle = {
  border: '2px solid black',
  borderRadius: '0.3em',
  padding: '12px',
  boxShadow: '0 2px 4px 0 rgb(34 36 38 / 12%), 0 2px 10px 0 rgb(34 36 38 / 15%)',
}

const SearchForm = props => {
  const { getTextIn } = useLanguage()
  const dispatch = useDispatch()
  const isLoading = useSelector(state => state.courseStats.pending)
  const matchingCourses = useSelector(getCourseSearchResults)
  const [state, setState] = useState({
    ...INITIAL,
  })
  const [searchHistory, addItemToSearchHistory, updateItemInSearchHistory] = useSearchHistory('courseSearch', 6)

  const { courseName, courseCode, selectedCourses, separate } = state

  // const { coursesLoading, isLoading, matchingCourses /* unifyOpenUniCourses */ } = props

  const parseQueryFromUrl = () => {
    const { location } = props
    const { courseCodes, separate, unifyOpenUniCourses, ...rest } = qs.parse(location.search)
    const query = {
      ...INITIAL,
      ...rest,
      courseCodes: JSON.parse(courseCodes),
      separate: JSON.parse(separate),
      // unifyOpenUniCourses: JSON.parse(unifyOpenUniCourses || false),
    }
    return query
  }

  const fetchStatisticsFromUrlParams = () => {
    const query = parseQueryFromUrl()
    setState({ ...state, ...query })
    dispatch(getCourseStats(query, props.onProgress))
  }

  useEffect(() => {
    const { location } = props
    if (!location.search) {
      dispatch(clearCourses())
      dispatch(clearCourseStats())
    }
  }, [])

  useEffect(() => {
    const { location } = props
    if (location.search) {
      fetchStatisticsFromUrlParams()
    }
  }, [props.location.search])

  const onSelectCourse = course => {
    course.selected = !course.selected
    const isSelected = !!selectedCourses[course.code]

    if (isSelected) {
      const { [course.code]: omit, ...rest } = selectedCourses
      setState({
        ...state,
        selectedCourses: rest,
      })
    } else {
      setState({
        ...state,
        selectedCourses: {
          ...selectedCourses,
          [course.code]: { ...course, selected: true },
        },
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
    pushQueryToUrl(historyItem)
  }

  const onSubmitFormClick = () => {
    const codes = sortBy(Object.keys(selectedCourses))
    const params = {
      courseCodes: codes,
      separate,
    }
    const searchHistoryText = codes.map(code => `${getTextIn(selectedCourses[code].name)} ${code}`)
    addItemToSearchHistory({
      text: searchHistoryText.join(', '),
      params,
    })
    pushQueryToUrl(params)
  }

  const fetchCourses = () => {
    const isValidName = validateInputLength(courseName, 5)
    const isValidCode = validateInputLength(courseCode, 2)

    if (isValidName || isValidCode) {
      return dispatch(findCoursesV2({ name: courseName, code: courseCode }))
    }
    if (courseName.length < 5 && courseCode.length < 2) {
      dispatch(clearCourses())
    }
    return Promise.resolve()
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
        ...newSelectedCourses,
      },
    })
  }

  return (
    <>
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
        items={searchHistory.map(item => {
          item.timestamp = new Date(item.timestamp)
          return item
        })}
        updateItem={updateItemInSearchHistory}
      />
    </>
  )
}

SearchForm.defaultProps = {
  onProgress: null,
}

SearchForm.propTypes = {
  history: shape({}).isRequired,
  location: shape({}).isRequired,
  onProgress: func,
}

export default withRouter(SearchForm)
