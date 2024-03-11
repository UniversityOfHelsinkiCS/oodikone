import React, { createContext, useContext } from 'react'

export const ColorizedCoursesTableContext = createContext(null)

export const useColorizedCoursesTableContext = () => useContext(ColorizedCoursesTableContext)

export const emptyFields = { completions: 0, enrollments: 0, difference: 0, rejected: 0 }

export const courseNameColumn = getTextIn => ({
  key: 'course-name',
  title: 'Course',
  getRowVal: row => row.code,
  getRowContent: row => (
    <div style={{ display: 'flex', flexDirection: 'column' }} title={getTextIn(row.name)}>
      <b>{row.code}</b>
      <i style={{ color: 'gray', fontWeight: 'normal' }}>{row.name && getTextIn(row.name)}</i>
    </div>
  ),
})

export const calculateTotals = (courses, semesters, faculties) => {
  const facultiesTotal = { ...emptyFields }
  const totalRow = { ...emptyFields, cellStats: {} }
  semesters.forEach(sem => {
    totalRow[sem] = { ...emptyFields }
    courses.forEach(course => {
      const stats = course.bySemesters[sem]
      if (!stats) return

      totalRow[sem].completions += stats.completions
      totalRow[sem].enrollments += stats.enrollments
      totalRow[sem].rejected += stats.rejected
      totalRow[sem].difference += stats.difference ?? 0
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
      faculties.forEach(fac => {
        totalRow[sem][fac] = { ...emptyFields }
        courses.forEach(course => {
          const stats = course.bySemesters[sem]?.[fac]
          if (!stats) return
          totalRow[sem][fac].completions += stats.completions
          totalRow[sem][fac].enrollments += stats.enrollments
          totalRow[sem][fac].rejected += stats.rejected
          totalRow[sem][fac].difference += stats.difference ?? 0
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
  if (colorMode === 'none' || allTotal === 0) return {}
  if (!stats) return {}
  const value = stats[numberMode]
  const totalValue = colorMode === 'course' ? courseTotal : allTotal
  if (value === 0) return {}

  const relativeValue = (() => {
    if (totalValue === 0) return 0
    if (colorMode === 'course') return value / ((totalValue / columnAmount) * 2)
    return value / (totalValue / columnAmount / 8)
  })()
  const divisor = colorMode === 'course' ? 6 : 2
  const color = ['completions', 'enrollments'].includes(numberMode) ? '0,170,0' : '220,60,60'
  const modifier = ['completions', 'enrollments'].includes(numberMode) ? 0 : 0.3
  return {
    backgroundColor: `rgba(${color},${relativeValue / divisor + modifier})`,
  }
}
