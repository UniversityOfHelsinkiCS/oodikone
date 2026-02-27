import TextField from '@mui/material/TextField'
import { createContext, useContext, useState, useEffect } from 'react'

export const ColorizedCoursesTableContext = createContext(null)

export const useColorizedCoursesTableContext = () => useContext(ColorizedCoursesTableContext)

export const emptyFields = { completions: 0, enrollments: 0, difference: 0, rejected: 0 }

export const calculateTotals = (courses, semesters, faculties) => {
  const facultiesTotal = { ...emptyFields }
  const totalRow = { ...emptyFields, cellStats: {} }
  semesters.forEach(semester => {
    totalRow[semester] = { ...emptyFields }
    courses.forEach(course => {
      const stats = course.bySemesters[semester]
      if (!stats) return

      totalRow[semester].completions += stats.completions
      totalRow[semester].enrollments += stats.enrollments
      totalRow[semester].rejected += stats.rejected
      totalRow[semester].difference += stats.difference ?? 0
      totalRow.completions += stats.completions
      totalRow.enrollments += stats.enrollments
      totalRow.rejected += stats.rejected
      totalRow.difference += stats.difference ?? 0
      facultiesTotal.completions += stats.completions
      facultiesTotal.enrollments += stats.enrollments
      facultiesTotal.rejected += stats.rejected
      facultiesTotal.difference += stats.difference ?? 0
    })
    if (faculties) {
      faculties.forEach(faculty => {
        totalRow[semester][faculty] = structuredClone(emptyFields)
        courses.forEach(course => {
          const stats = course.bySemesters[semester]?.[faculty]
          if (!stats) return
          totalRow[semester][faculty].completions += stats.completions
          totalRow[semester][faculty].enrollments += stats.enrollments
          totalRow[semester][faculty].rejected += stats.rejected
          totalRow[semester][faculty].difference += stats.difference ?? 0
        })
      })
    }
  })

  return { cellStats: {}, code: 'TOTAL', name: { en: 'All courses total' }, bySemesters: totalRow, facultiesTotal }
}

export const calculateNewTotalColumnValues = (data, selectedSemesters) =>
  data.map(originalRow => {
    const row = { ...originalRow }
    const includedValues = { completions: 0, enrollments: 0, difference: 0, rejected: 0 }

    Object.entries(originalRow.bySemesters).forEach(
      ([semesterCode, { completions, enrollments, difference, rejected }]) => {
        if (selectedSemesters.includes(semesterCode)) {
          includedValues.completions += completions
          includedValues.enrollments += enrollments
          includedValues.difference += difference
          includedValues.rejected += rejected
        }
      }
    )

    row.bySemesters = { ...row.bySemesters, ...includedValues }
    return row
  })

export const getColor = (stats, columnAmount, colorMode, numberMode, courseTotal, allTotal) => {
  if (!stats || colorMode === 'none') return {}

  const value = stats[numberMode]
  const totalValue = colorMode === 'course' ? courseTotal : allTotal
  if (totalValue === 0 || value === 0) return {}

  const color = ['completions', 'enrollments'].includes(numberMode) ? '0,170,0' : '255,70,70'

  const relativeAlphaValue =
    colorMode === 'course' ? (value * columnAmount) / (12 * totalValue) : (4 * value * columnAmount) / totalValue

  return {
    backgroundColor: `rgba(${color},${Math.min(1.0, relativeAlphaValue)}) !important`,
  }
}

// NOTE: Give setCourseFilter as a useDebouncedState to make the text box work nicely
export const CourseFilter = ({ setCourseFilter }) => {
  const [textField, setTextField] = useState('')
  useEffect(() => {
    setCourseFilter(textField)
  }, [textField])

  return (
    <TextField label="Course name/code filter" onChange={event => setTextField(event.target.value)} value={textField} />
  )
}
