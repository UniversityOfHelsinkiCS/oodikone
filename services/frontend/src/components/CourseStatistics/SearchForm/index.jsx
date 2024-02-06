import React, { useState, useEffect } from 'react'
import { Segment, Header, Form, Radio, Popup, Message } from 'semantic-ui-react'
import { useSelector, useDispatch } from 'react-redux'
import { useLocation, useHistory } from 'react-router-dom'
import qs from 'query-string'
import { sortBy } from 'lodash'
import { func } from 'prop-types'

import { clearCourses, findCoursesV2 } from 'redux/coursesearch'
import { getCourseStats, clearCourseStats } from 'redux/coursestats'
import { getCourseSearchResults } from 'selectors/courses'
import { useSearchHistory, useToggle } from 'common/hooks'
import { validateInputLength } from 'common'
import { TimeoutAutoSubmitSearchInput as AutoSubmitSearchInput } from '../../AutoSubmitSearchInput'
import { MemoizedCourseTable as CourseTable } from '../CourseTable'
import { SearchHistory } from '../../SearchHistory'
import { useLanguage } from '../../LanguagePicker/useLanguage'

const INITIAL = {
  courseName: '',
  courseCode: '',
  selectedCourses: {},
  separate: false,
}

// For now, let's allow more courses because it's necessary and doesn't necessarily fail if the courses
// have small populations (this used to be limited to 40)
const MAX_SELECTED_COURSES = 99999

const searchBoxStyle = {
  border: '2px solid black',
  borderRadius: '0.3em',
  padding: '12px',
  boxShadow: '0 2px 4px 0 rgb(34 36 38 / 12%), 0 2px 10px 0 rgb(34 36 38 / 15%)',
}

export const SearchForm = ({ onProgress }) => {
  const { getTextIn } = useLanguage()
  const dispatch = useDispatch()
  const location = useLocation()
  const history = useHistory()
  const isLoading = useSelector(state => state.courseStats.pending)
  const [combineSubstitutions, toggleCombineSubstitutions] = useToggle(true)
  const [selectMultipleCoursesEnabled, toggleSelectMultipleCoursesEnabled] = useToggle(false)
  const matchingCourses = useSelector(state => getCourseSearchResults(state, combineSubstitutions))
  const [state, setState] = useState({ ...INITIAL })
  const [searchHistory, addItemToSearchHistory, updateItemInSearchHistory] = useSearchHistory('courseSearch', 6)

  const { courseName, courseCode, selectedCourses, separate } = state

  const parseQueryFromUrl = () => {
    const { courseCodes, separate, unifyOpenUniCourses, ...rest } = qs.parse(location.search)
    const query = {
      ...INITIAL,
      ...rest,
      courseCodes: JSON.parse(courseCodes),
      separate: JSON.parse(separate),
      combineSubstitutions: JSON.parse(combineSubstitutions),
    }
    return query
  }

  const fetchStatisticsFromUrlParams = () => {
    const query = parseQueryFromUrl()
    setState({ ...state, ...query })
    dispatch(getCourseStats(query, onProgress))
  }

  useEffect(() => {
    if (!location.search) {
      dispatch(clearCourses())
      dispatch(clearCourseStats())
    }
  }, [])

  useEffect(() => {
    if (location.search) {
      fetchStatisticsFromUrlParams()
    }
  }, [location.search])

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
    const { courseCodes, ...rest } = query
    const queryObject = {
      ...rest,
      courseCodes: JSON.stringify(courseCodes),
      combineSubstitutions: JSON.stringify(combineSubstitutions),
    }
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
      combineSubstitutions,
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
      return dispatch(findCoursesV2({ name: courseName, code: courseCode, combineSubstitutions }))
    }
    if (courseName.length < 5 && courseCode.length < 2) {
      dispatch(clearCourses())
    }
    return Promise.resolve()
  }

  const clearSelectedCourses = () => {
    setState({ ...state, selectedCourses: {} })
  }

  useEffect(() => {
    if (Object.keys(selectedCourses).length === 0 || selectMultipleCoursesEnabled) return
    onSubmitFormClick()
  }, [selectedCourses])

  useEffect(() => {
    const fetchData = async () => {
      await fetchCourses()
    }
    fetchData()
    clearSelectedCourses()
  }, [combineSubstitutions])

  useEffect(() => {
    if (selectMultipleCoursesEnabled) return
    clearSelectedCourses()
  }, [selectMultipleCoursesEnabled])

  const courses = matchingCourses.filter(c => !selectedCourses[c.code])

  const selected = Object.values(selectedCourses).map(course => ({ ...course, selected: true }))
  const noSelectedCourses = selected.length === 0
  const disabled = isLoading || noSelectedCourses || selected.length > MAX_SELECTED_COURSES

  const renderFetchStatisticsButton = () => {
    const FetchStatisticsButton = (
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
    )

    if (noSelectedCourses) return null

    if (disabled) {
      return (
        <Popup
          on="hover"
          position="top center"
          content={getTextIn({
            fi: `Olet valinnut ${selected.length} kurssia. Voit valita tarkasteltavaksi enintään ${MAX_SELECTED_COURSES} kurssia kerrallaan. Tarkenna hakua tai poista valittuja kursseja.`,
            en: `You have selected ${selected.length} courses. You can select up to ${MAX_SELECTED_COURSES} courses at a time. Refine your search or remove selected courses.`,
          })}
          trigger={<span>{FetchStatisticsButton}</span>}
        />
      )
    }

    return FetchStatisticsButton
  }

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

  const newFeatureMessage = {
    header: {
      en: 'Are you looking for statistics of courses offered by a specific study programme?',
      fi: 'Haluatko tarkastella tilastoja tietyn koulutusohjelman tarjoamista kursseista?',
    },
    content: {
      en: 'You can now see the statistics of all courses offered by a study programme by selecting Programmes > Overview > Choose programme > Programme courses > By semester.',
      fi: 'Voit nyt tarkastella tilastoja kaikista koulutusohjelman tarjoamista kursseista valitsemalla Programmes > Overview > Valitse ohjelma > Programme courses > By semester.',
    },
  }

  return (
    <>
      <Segment loading={isLoading}>
        <Form>
          <Header>Search for courses</Header>
          <Message info>
            <Message.Header>{getTextIn(newFeatureMessage.header)}</Message.Header>
            <p>{getTextIn(newFeatureMessage.content)}</p>
          </Message>
          <div style={{ marginBottom: '15px' }}>
            <Form.Group>
              <Form.Field width={8}>
                <label>Name:</label>
                <AutoSubmitSearchInput
                  doSearch={fetchCourses}
                  placeholder="Search by entering a course name"
                  value={courseName}
                  onChange={cn => setState({ ...state, courseName: cn })}
                  loading={isLoading}
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
                  loading={isLoading}
                  minSearchLength={0}
                  data-cy="course-code-input"
                />
              </Form.Field>
              <Form.Field>
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    gap: '20px',
                    marginLeft: '10px',
                  }}
                >
                  <Popup
                    on="hover"
                    content={getTextIn({
                      fi: 'Jos "Combine substitutions" on valittuna (oletuksena), niin kurssi ja leikkaavat kurssit yhdistetään tilastoissa.',
                      en: 'If "Combine substitutions" is on (default behavior), then course and its substitutions are combined in the statistics.',
                    })}
                    size="tiny"
                    position="top center"
                    trigger={
                      <Radio
                        toggle
                        label="Combine substitutions"
                        checked={combineSubstitutions}
                        onChange={toggleCombineSubstitutions}
                        data-cy="combine-substitutions-toggle"
                      />
                    }
                  />
                  <Popup
                    on="hover"
                    content={getTextIn({
                      fi: 'Jos "Select multiple courses" on valittuna, voit valita tarkasteltavaksi useita kursseja.',
                      en: 'If "Select multiple courses" is on, you can select multiple courses to view statistics for.',
                    })}
                    size="tiny"
                    position="top center"
                    trigger={
                      <Radio
                        toggle
                        label="Select multiple courses"
                        checked={selectMultipleCoursesEnabled}
                        onChange={toggleSelectMultipleCoursesEnabled}
                        data-cy="select-multiple-courses-toggle"
                      />
                    }
                  />
                </div>
              </Form.Field>
            </Form.Group>
            {selectMultipleCoursesEnabled && (
              <Message>
                <b style={{ color: 'red', fontSize: '14pt' }}>Notice:</b> Selecting many courses may fail if there are
                too many students in total. If the feature does not work, try again with fewer courses. <br /> <br />
                <b>Currently selected: {Object.keys(state.selectedCourses).length || 0}</b>
              </Message>
            )}
            <div style={!noSelectedCourses ? searchBoxStyle : null}>
              <CourseTable
                title="Selected courses"
                hidden={noSelectedCourses}
                courses={selected}
                onSelectCourse={onSelectCourse}
                controlIcon="trash alternate outline"
                selectedTable
              />
              {renderFetchStatisticsButton()}
            </div>
            <CourseTable
              hidden={isLoading || (Object.keys(courses).length === 0 && Object.keys(selectedCourses).length > 0)}
              courses={courses}
              title="Searched courses"
              onSelectCourse={onSelectCourse}
            />
            {courses.length && selectMultipleCoursesEnabled ? (
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
  onProgress: func,
}
