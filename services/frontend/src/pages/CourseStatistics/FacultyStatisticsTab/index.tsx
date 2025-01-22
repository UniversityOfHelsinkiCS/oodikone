import { FormControl, InputLabel, MenuItem, Select, Stack } from '@mui/material'
import { flatten, uniq } from 'lodash'
import { useState } from 'react'
import { useSelector } from 'react-redux'

import { Section } from '@/components/material/Section'
import { RootState } from '@/redux'
import { CourseStat } from '@/types/courseStat'
import { CourseTable } from './CourseTable'

export const FacultyStatisticsTab = () => {
  const openOrRegular = useSelector((state: RootState) => state.courseSearch.openOrRegular)
  const courseStats: Record<string, Record<'unifyStats' | 'openStats' | 'regularStats', CourseStat>> = useSelector(
    (state: RootState) => state.courseStats.data
  )

  const yearCodes = uniq(
    flatten(Object.values(courseStats).map(course => Object.keys(course[openOrRegular].facultyStats)))
  )
    .sort()
    .reverse()

  const [selectedYear, setSelectedYear] = useState(yearCodes[0])

  const dropdownOptions = yearCodes.map(yearCode => ({
    key: yearCode,
    text: `${1949 + Number(yearCode)}-${1950 + Number(yearCode)}`,
    value: yearCode,
  }))

  const yearsCourseStats = Object.values(courseStats)
    .map(course => ({
      course,
      courseInstance: course[openOrRegular].facultyStats[selectedYear],
    }))
    .sort((a, b) => Number(a.courseInstance == null) - Number(b.courseInstance == null))

  const courseTables = yearsCourseStats.map(({ course, courseInstance }) => (
    <CourseTable course={course[openOrRegular]} courseInstance={courseInstance} key={course.unifyStats.coursecode} />
  ))

  return (
    <Section>
      <Stack gap={2}>
        <FormControl fullWidth>
          <InputLabel id="academic-year-select-label">Select academic year</InputLabel>
          <Select
            MenuProps={{
              PaperProps: {
                style: {
                  maxHeight: 200,
                },
              },
            }}
            label="Select academic year"
            labelId="academic-year-select-label"
            onChange={event => setSelectedYear(event.target.value)}
            value={selectedYear}
          >
            {dropdownOptions.map(({ key, text, value }) => (
              <MenuItem key={key} value={value}>
                {text}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        {courseTables}
      </Stack>
    </Section>
  )
}
