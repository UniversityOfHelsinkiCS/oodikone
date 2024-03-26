import { sortBy } from 'lodash'
import { func } from 'prop-types'
import qs from 'query-string'
import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useHistory, useLocation } from 'react-router-dom'
import { Form, Header, Message, Popup, Radio, Segment } from 'semantic-ui-react'

import { validateInputLength } from '@/common'
import { useSearchHistory, useToggle } from '@/common/hooks'
import { TimeoutAutoSubmitSearchInput as AutoSubmitSearchInput } from '@/components/AutoSubmitSearchInput'
import { MemoizedCourseTable as CourseTable } from '@/components/CourseStatistics/CourseTable'
import { useLanguage } from '@/components/LanguagePicker/useLanguage'
import { SearchHistory } from '@/components/SearchHistory'
import { useGetAuthorizedUserQuery } from '@/redux/auth'
import { clearCourses, findCoursesV2 } from '@/redux/coursesearch'
import { getCourseStats, clearCourseStats } from '@/redux/coursestats'
import { getCourseSearchResults } from '@/selectors/courses'

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
  const { iamRights, isAdmin } = useGetAuthorizedUserQuery()
  const hasStudyProgrammeRights = iamRights.length > 0 || isAdmin

  const { courseName, courseCode, selectedCourses, separate } = state

  const parseQueryFromUrl = () => {
    const {
      courseCodes,
      separate,
      unifyOpenUniCourses,
      combineSubstitutions: combineSubstitutionsFromUrl,
      ...rest
    } = qs.parse(location.search)
    const query = {
      ...INITIAL,
      ...rest,
      courseCodes: JSON.parse(courseCodes),
      separate: JSON.parse(separate),
      combineSubstitutions: combineSubstitutionsFromUrl ?? JSON.parse(combineSubstitutions),
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

  const courses = matchingCourses.filter(course => !selectedCourses[course.code])

  const selected = Object.values(selectedCourses).map(course => ({ ...course, selected: true }))
  const noSelectedCourses = selected.length === 0
  const disabled = isLoading || noSelectedCourses || selected.length > MAX_SELECTED_COURSES

  const renderFetchStatisticsButton = () => {
    const FetchStatisticsButton = (
      <Form.Button
        basic
        content="Fetch statistics"
        data-cy="fetch-stats-button"
        disabled={disabled}
        fluid
        onClick={onSubmitFormClick}
        positive
        primary
        size="huge"
        type="button"
      />
    )

    if (noSelectedCourses) return null

    if (disabled) {
      return (
        <Popup
          content={getTextIn({
            fi: `Olet valinnut ${selected.length} kurssia. Voit valita tarkasteltavaksi enintään ${MAX_SELECTED_COURSES} kurssia kerrallaan. Tarkenna hakua tai poista valittuja kursseja.`,
            en: `You have selected ${selected.length} courses. You can select up to ${MAX_SELECTED_COURSES} courses at a time. Refine your search or remove selected courses.`,
          })}
          on="hover"
          position="top center"
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
          {hasStudyProgrammeRights && (
            <Message info>
              <Message.Header>{getTextIn(newFeatureMessage.header)}</Message.Header>
              <p>{getTextIn(newFeatureMessage.content)}</p>
            </Message>
          )}
          <div style={{ marginBottom: '15px' }}>
            <Form.Group>
              <Form.Field width={8}>
                <label>Name:</label>
                <AutoSubmitSearchInput
                  doSearch={fetchCourses}
                  loading={isLoading}
                  minSearchLength={0}
                  onChange={cn => setState({ ...state, courseName: cn })}
                  placeholder="Search by entering a course name"
                  value={courseName}
                />
              </Form.Field>
              <Form.Field width={3}>
                <label>Code:</label>
                <AutoSubmitSearchInput
                  data-cy="course-code-input"
                  doSearch={fetchCourses}
                  loading={isLoading}
                  minSearchLength={0}
                  onChange={cc => setState({ ...state, courseCode: cc })}
                  placeholder="Search by a course code"
                  value={courseCode}
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
                    content={getTextIn({
                      fi: 'Jos "Combine substitutions" on valittuna (oletuksena), niin kurssi ja leikkaavat kurssit yhdistetään tilastoissa.',
                      en: 'If "Combine substitutions" is on (default behavior), then course and its substitutions are combined in the statistics.',
                    })}
                    on="hover"
                    position="top center"
                    size="tiny"
                    trigger={
                      <Radio
                        checked={combineSubstitutions}
                        data-cy="combine-substitutions-toggle"
                        label="Combine substitutions"
                        onChange={toggleCombineSubstitutions}
                        toggle
                      />
                    }
                  />
                  <Popup
                    content={getTextIn({
                      fi: 'Jos "Select multiple courses" on valittuna, voit valita tarkasteltavaksi useita kursseja.',
                      en: 'If "Select multiple courses" is on, you can select multiple courses to view statistics for.',
                    })}
                    on="hover"
                    position="top center"
                    size="tiny"
                    trigger={
                      <Radio
                        checked={selectMultipleCoursesEnabled}
                        data-cy="select-multiple-courses-toggle"
                        label="Select multiple courses"
                        onChange={toggleSelectMultipleCoursesEnabled}
                        toggle
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
                controlIcon="trash alternate outline"
                courses={selected}
                hidden={noSelectedCourses}
                onSelectCourse={onSelectCourse}
                selectedTable
                title="Selected courses"
              />
              {renderFetchStatisticsButton()}
            </div>
            <CourseTable
              courses={courses}
              hidden={isLoading || (Object.keys(courses).length === 0 && Object.keys(selectedCourses).length > 0)}
              onSelectCourse={onSelectCourse}
              title="Searched courses"
            />
            {courses.length && selectMultipleCoursesEnabled ? (
              <div className="select-all-container">
                <Form.Button
                  basic
                  color="green"
                  content="Select all search results"
                  onClick={addAllCourses}
                  size="large"
                  type="button"
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
