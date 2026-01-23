import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import MenuItem from '@mui/material/MenuItem'
import Select from '@mui/material/Select'
import Stack from '@mui/material/Stack'

import { flatten, uniq } from 'lodash-es'
import { useState } from 'react'
import type { CourseSearchState } from '@/pages/CourseStatistics'
import { CourseStats } from '@/pages/CourseStatistics/util'
import { CourseTable } from './CourseTable'

export const FacultyStatisticsTab = ({
  courseStats,
  openOrRegular,
}: {
  courseStats: CourseStats
  openOrRegular: CourseSearchState
}) => {
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
  )
}
