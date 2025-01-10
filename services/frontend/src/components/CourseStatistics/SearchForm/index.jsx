import { omit, sortBy } from 'lodash'
import qs from 'query-string'
import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate, useLocation } from 'react-router'
import { Form, Header, Input, Message, Popup, Radio, Segment } from 'semantic-ui-react'

import { validateInputLength } from '@/common'
import { useSearchHistory, useToggle } from '@/common/hooks'
import { MemoizedCourseTable as CourseTable } from '@/components/CourseStatistics/CourseTable'
import { useLanguage } from '@/components/LanguagePicker/useLanguage'
import { SearchHistory } from '@/components/SearchHistory'
import { useDebouncedState } from '@/hooks/useDebouncedState'
import { useGetCourseSearchResultQuery } from '@/redux/coursesearch'
import { getCourseStats, clearCourseStats } from '@/redux/coursestats'

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
  const navigate = useNavigate()
  const isLoadingCourseStats = useSelector(state => state.courseStats.pending)
  const [combineSubstitutions, toggleCombineSubstitutions] = useToggle(true)
  const [selectMultipleCoursesEnabled, toggleSelectMultipleCoursesEnabled] = useToggle(false)
  const [courseName, setCourseName] = useState('')
  const [courseCode, setCourseCode] = useState('')
  const [debouncedCourseName, setDebouncedCourseName] = useDebouncedState(courseName)
  const [debouncedCourseCode, setDebouncedCourseCode] = useDebouncedState(courseCode)
  const [selectedCourses, setSelectedCourses] = useState({})

  const isInputValid = validateInputLength(courseName, 5) || validateInputLength(courseCode, 2)
  const isDebouncedInputValid =
    validateInputLength(debouncedCourseName, 5) || validateInputLength(debouncedCourseCode, 2)
  const debouncedChanged = debouncedCourseName !== courseName || debouncedCourseCode !== courseCode

  const [searchHistory, addItemToSearchHistory, updateItemInSearchHistory] = useSearchHistory('courseSearch', 6)
  const { data, isFetching } = useGetCourseSearchResultQuery(
    { name: debouncedCourseName, code: debouncedCourseCode, combineSubstitutions },
    { skip: !isDebouncedInputValid }
  )
  const matchingCourses = data?.courses ?? []

  const handleCourseNameChange = event => {
    setCourseName(event.target.value)
    setDebouncedCourseName(event.target.value)
  }

  const handleCourseCodeChange = event => {
    setCourseCode(event.target.value)
    setDebouncedCourseCode(event.target.value)
  }

  const parseQueryFromUrl = () => {
    const search = qs.parse(location.search)
    const query = {
      courseCodes: JSON.parse(search.courseCodes),
      separate: JSON.parse(search.separate),
      combineSubstitutions: search.combineSubstitutionsFrom ?? JSON.parse(combineSubstitutions),
    }
    return query
  }

  const fetchStatisticsFromUrlParams = () => {
    const query = parseQueryFromUrl()
    dispatch(getCourseStats(query, onProgress))
  }

  useEffect(() => {
    if (!location.search) {
      dispatch(clearCourseStats())
    }
  }, [])

  useEffect(() => {
    if (location.search) {
      fetchStatisticsFromUrlParams()
    }
  }, [location.search])

  const onSelectCourse = course => {
    const isSelected = !!selectedCourses[course.code]

    if (isSelected) {
      setSelectedCourses(previousSelectedCourses => omit(previousSelectedCourses, course.code))
    } else {
      setSelectedCourses(previousSelectedCourses => ({
        ...previousSelectedCourses,
        [course.code]: { ...course, selected: true },
      }))
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
    navigate({ search: searchString })
  }

  const onSearchHistorySelected = historyItem => {
    pushQueryToUrl(historyItem)
  }

  const onSubmitFormClick = () => {
    const codes = sortBy(Object.keys(selectedCourses))
    const params = {
      courseCodes: codes,
      separate: false,
      combineSubstitutions,
    }
    const searchHistoryText = codes.map(code => `${getTextIn(selectedCourses[code].name)} ${code}`)
    addItemToSearchHistory({
      text: searchHistoryText.join(', '),
      params,
    })
    pushQueryToUrl(params)
  }

  const clearSelectedCourses = () => {
    setSelectedCourses({})
  }

  useEffect(() => {
    if (Object.keys(selectedCourses).length === 0 || selectMultipleCoursesEnabled) return
    onSubmitFormClick()
  }, [selectedCourses])

  useEffect(() => {
    clearSelectedCourses()
  }, [combineSubstitutions])

  useEffect(() => {
    if (selectMultipleCoursesEnabled) return
    clearSelectedCourses()
  }, [selectMultipleCoursesEnabled])

  const courses = matchingCourses.filter(course => !selectedCourses[course.code])

  const selected = Object.values(selectedCourses)
  const noSelectedCourses = selected.length === 0
  const disabled = isLoadingCourseStats || noSelectedCourses || selected.length > MAX_SELECTED_COURSES

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

    if (noSelectedCourses) {
      return null
    }

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
    const newSelectedCourses = courses.reduce((newSelected, course) => {
      newSelected[course.code] = { ...course }
      return newSelected
    }, {})

    setSelectedCourses(previousSelectedCourses => ({
      ...previousSelectedCourses,
      ...newSelectedCourses,
    }))
  }

  return (
    <>
      <Segment loading={isLoadingCourseStats}>
        <Form>
          <Header>Search for courses</Header>
          <div style={{ marginBottom: '15px' }}>
            <Form.Group>
              <Form.Field width={7}>
                <label>Name</label>
                <Input
                  data-cy="course-name-input"
                  fluid
                  icon="search"
                  onChange={handleCourseNameChange}
                  placeholder="Search by course name"
                  value={courseName}
                />
              </Form.Field>
              <Form.Field width={4}>
                <label>Code</label>
                <Input
                  data-cy="course-code-input"
                  fluid
                  icon="search"
                  onChange={handleCourseCodeChange}
                  placeholder="Search by course code"
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
                <b>Currently selected: {Object.keys(selectedCourses).length || 0}</b>
              </Message>
            )}
            <Segment basic loading={(isFetching || debouncedChanged) && isInputValid} style={{ padding: 0 }}>
              {!isInputValid ? (
                <Message
                  content="Please enter at least 5 characters for course name or 2 characters for course code."
                  negative
                />
              ) : (
                <>
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
                    hidden={
                      isLoadingCourseStats ||
                      (Object.keys(courses).length === 0 && Object.keys(selectedCourses).length > 0)
                    }
                    onSelectCourse={onSelectCourse}
                    title="Searched courses"
                  />
                  {courses.length > 0 && selectMultipleCoursesEnabled && (
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
                  )}
                </>
              )}
            </Segment>
          </div>
        </Form>
      </Segment>
      <SearchHistory
        disabled={isLoadingCourseStats}
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
