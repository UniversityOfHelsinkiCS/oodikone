import { LibraryAddCheck as LibraryAddIcon } from '@mui/icons-material'
import { Alert, Box, Button, Grid2 as Grid, Paper, Stack, TextField } from '@mui/material'
import { omit, sortBy } from 'lodash'
import qs from 'query-string'
import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useLocation, useNavigate } from 'react-router'

import { validateInputLength } from '@/common'
import { useLanguage } from '@/components/LanguagePicker/useLanguage'
import { SearchHistory } from '@/components/material/SearchHistory'
import { Section } from '@/components/material/Section'
import { useSearchHistory } from '@/hooks/searchHistory'
import { useToggle } from '@/hooks/toggle'
import { useDebouncedState } from '@/hooks/useDebouncedState'
import { RootState } from '@/redux'
import { useGetCourseSearchResultQuery } from '@/redux/courseSearch'
import { getCourseStats, clearCourseStats } from '@/redux/courseStats'
import { SearchHistoryItem } from '@/types/searchHistory'
import { CombineSubstitutionsToggle } from './CombineSubstitutionsToggle'
import { MemoizedCourseTable as CourseTable } from './CourseTable'
import { FetchStatisticsButton } from './FetchStatisticsButton'
import { MultipleCoursesAlert } from './MultipleCoursesAlert'
import { SelectMultipleCoursesToggle } from './SelectMultipleCoursesToggle'

// For now, let's allow more courses because it's necessary and doesn't necessarily
// fail if the courses have small populations (this used to be limited to 40)
const MAX_SELECTED_COURSES = 99999

export const SearchForm = ({ onProgress }) => {
  const { getTextIn } = useLanguage()
  const dispatch = useDispatch()
  const location = useLocation()
  const navigate = useNavigate()
  const isLoadingCourseStats = useSelector((state: RootState) => state.courseStats.pending)
  const [combineSubstitutions, toggleCombineSubstitutions] = useToggle(true)
  const [selectMultipleCourses, toggleSelectMultipleCourses] = useToggle(false)
  const [courseName, setCourseName] = useState('')
  const [courseCode, setCourseCode] = useState('')
  const [debouncedCourseName, setDebouncedCourseName] = useDebouncedState(courseName)
  const [debouncedCourseCode, setDebouncedCourseCode] = useDebouncedState(courseCode)
  const [selectedCourses, setSelectedCourses] = useState({})

  const isInputValid = validateInputLength(courseName, 5) || validateInputLength(courseCode, 2)
  const isDebouncedInputValid =
    validateInputLength(debouncedCourseName, 5) || validateInputLength(debouncedCourseCode, 2)
  const debouncedChanged = debouncedCourseName !== courseName || debouncedCourseCode !== courseCode

  const [searchHistory, addItemToSearchHistory] = useSearchHistory('courseSearch', 6)
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
      courseCodes: JSON.parse(search.courseCodes as string),
      separate: JSON.parse(search.separate as string),
      combineSubstitutions: search.combineSubstitutionsFrom ?? JSON.parse(combineSubstitutions.toString()),
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
    void navigate({ search: searchString })
  }

  const onSearchHistorySelected = (item: SearchHistoryItem) => {
    pushQueryToUrl(item)
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
    if (Object.keys(selectedCourses).length === 0 || selectMultipleCourses) {
      return
    }
    onSubmitFormClick()
  }, [selectedCourses])

  useEffect(() => {
    clearSelectedCourses()
  }, [combineSubstitutions])

  useEffect(() => {
    if (selectMultipleCourses) {
      return
    }
    clearSelectedCourses()
  }, [selectMultipleCourses])

  const courses = matchingCourses.filter(course => !selectedCourses[course.code])

  const selected = Object.values(selectedCourses)
  const noSelectedCourses = selected.length === 0
  const disabled = isLoadingCourseStats || noSelectedCourses || selected.length > MAX_SELECTED_COURSES

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
    <Stack gap={2}>
      <Section title="Search for courses">
        <Box autoComplete="off" component="form" noValidate>
          <Stack gap={2}>
            <Grid container spacing={2}>
              <Grid size={8}>
                <TextField
                  data-cy="course-name-input"
                  fullWidth
                  label="Name"
                  onChange={handleCourseNameChange}
                  placeholder="Search by course name"
                  value={courseName}
                />
              </Grid>
              <Grid size={4}>
                <TextField
                  data-cy="course-code-input"
                  fullWidth
                  label="Code"
                  onChange={handleCourseCodeChange}
                  placeholder="Search by course code"
                  value={courseCode}
                />
              </Grid>
            </Grid>
            <Paper sx={{ display: 'flex', justifyContent: 'center', padding: 1 }} variant="outlined">
              <CombineSubstitutionsToggle checked={combineSubstitutions} onChange={toggleCombineSubstitutions} />
              <SelectMultipleCoursesToggle checked={selectMultipleCourses} onChange={toggleSelectMultipleCourses} />
            </Paper>
            {selectMultipleCourses && (
              <MultipleCoursesAlert selectedCourses={Object.keys(selectedCourses).length || 0} />
            )}
            {!isInputValid ? (
              <Alert severity="info" variant="outlined">
                Please enter at least 5 characters for course name or 2 characters for course code.
              </Alert>
            ) : (
              <Section isLoading={(isFetching || debouncedChanged) && isInputValid}>
                <Stack gap={2}>
                  <CourseTable
                    courses={selected}
                    hidden={noSelectedCourses}
                    onSelectCourse={onSelectCourse}
                    title="Selected courses"
                  />
                  <FetchStatisticsButton
                    disabled={disabled}
                    maxSelectedCourses={MAX_SELECTED_COURSES}
                    onClick={onSubmitFormClick}
                    selectedCourses={selected.length}
                  />
                </Stack>
                <CourseTable
                  courses={courses}
                  hidden={
                    isLoadingCourseStats ||
                    (Object.keys(courses).length === 0 && Object.keys(selectedCourses).length > 0)
                  }
                  onSelectCourse={onSelectCourse}
                  title="Searched courses"
                />
                {courses.length > 0 && selectMultipleCourses && (
                  <Box display="flex" justifyContent="center" mt={2}>
                    <Button onClick={addAllCourses} startIcon={<LibraryAddIcon />} variant="outlined">
                      Select all search results
                    </Button>
                  </Box>
                )}
              </Section>
            )}
          </Stack>
        </Box>
      </Section>
      <SearchHistory handleSearch={onSearchHistorySelected} items={searchHistory} />
    </Stack>
  )
}
