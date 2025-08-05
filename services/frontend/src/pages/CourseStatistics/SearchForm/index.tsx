import LibraryAddIcon from '@mui/icons-material/LibraryAddCheck'
import SearchIcon from '@mui/icons-material/Search'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import Grid from '@mui/material/Grid2'
import InputAdornment from '@mui/material/InputAdornment'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'

import { omit, sortBy } from 'lodash'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'

import { validateInputLength } from '@/common'
import { useLanguage } from '@/components/LanguagePicker/useLanguage'
import { Backdrop } from '@/components/material/Backdrop'
import { SearchHistory } from '@/components/material/SearchHistory'
import { Section } from '@/components/material/Section'
import { ToggleWithTooltip } from '@/components/material/ToggleWithTooltip'
import { useDebouncedState } from '@/hooks/debouncedState'
import { useSearchHistory } from '@/hooks/searchHistory'
import { useToggle } from '@/hooks/toggle'
import { useGetCourseSearchResultQuery } from '@/redux/courseSearch'
import { SearchHistoryItem } from '@/types/searchHistory'
import { queryParamsToString } from '@/util/queryparams'
import { MemoizedCourseTable as CourseTable } from './CourseTable'
import { FetchStatisticsButton } from './FetchStatisticsButton'
import { MultipleCoursesAlert } from './MultipleCoursesAlert'

// For now, let's allow more courses because it's necessary and doesn't necessarily
// fail if the courses have small populations (this used to be limited to 40)
const MAX_SELECTED_COURSES = 99999

export const SearchForm = ({ progress, isPending }) => {
  const { getTextIn } = useLanguage()
  const navigate = useNavigate()
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
    const searchString = queryParamsToString(queryObject)
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
  const noSelectedCourses = !selected.length
  const disabled = isPending ?? noSelectedCourses ?? selected.length > MAX_SELECTED_COURSES

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
      <Backdrop open={isPending} sx={{ color: '#fff', zIndex: theme => theme.zIndex.drawer + 1 }}>
        <CircularProgress color="inherit" value={progress} variant="determinate" />
      </Backdrop>
      <Section title="Search for courses">
        <Box autoComplete="off" component="form" noValidate>
          <Stack gap={2}>
            <Grid alignItems="center" container spacing={2}>
              <Grid size={5}>
                <TextField
                  data-cy="course-name-input"
                  fullWidth
                  label="Name"
                  onChange={handleCourseNameChange}
                  placeholder="Search by course name"
                  slotProps={{
                    input: {
                      endAdornment: (
                        <InputAdornment position="end">
                          <SearchIcon />
                        </InputAdornment>
                      ),
                    },
                  }}
                  value={courseName}
                />
              </Grid>
              <Grid size={3}>
                <TextField
                  data-cy="course-code-input"
                  fullWidth
                  label="Code"
                  onChange={handleCourseCodeChange}
                  placeholder="Search by course code"
                  slotProps={{
                    input: {
                      endAdornment: (
                        <InputAdornment position="end">
                          <SearchIcon />
                        </InputAdornment>
                      ),
                    },
                  }}
                  value={courseCode}
                />
              </Grid>
              <Grid size={4}>
                <ToggleWithTooltip
                  checked={combineSubstitutions}
                  cypress="combine-substitutions-toggle"
                  label="Combine substitutions"
                  onChange={toggleCombineSubstitutions}
                  tooltipText={getTextIn({
                    fi: 'Jos "Combine substitutions" on valittuna (oletuksena), niin kurssi ja leikkaavat kurssit yhdistetään tilastoissa.',
                    en: 'If "Combine substitutions" is on (default behavior), then course and its substitutions are combined in the statistics.',
                  })}
                />
                <ToggleWithTooltip
                  checked={selectMultipleCourses}
                  cypress="select-multiple-courses-toggle"
                  label="Select multiple courses"
                  onChange={toggleSelectMultipleCourses}
                  tooltipText={getTextIn({
                    fi: 'Jos "Select multiple courses" on valittuna, voit valita tarkasteltavaksi useita kursseja.',
                    en: 'If "Select multiple courses" is on, you can select multiple courses to view statistics for.',
                  })}
                />
              </Grid>
            </Grid>
            {selectMultipleCourses && (
              <MultipleCoursesAlert selectedCourses={Object.keys(selectedCourses).length || 0} />
            )}
            {!isInputValid ? (
              <Alert severity="info" variant="outlined">
                Please enter at least 5 characters for course name or 2 characters for course code.
              </Alert>
            ) : (
              <Section isLoading={(isFetching || debouncedChanged) && isInputValid}>
                {selected.length > 0 && selectMultipleCourses && (
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
                )}
                <CourseTable
                  courses={courses}
                  hidden={isPending ?? (!Object.keys(courses).length && !Object.keys(selectedCourses).length)}
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
