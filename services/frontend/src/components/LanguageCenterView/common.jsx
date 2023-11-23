import moment from 'moment'
import React, { createContext, useContext } from 'react'

export const LanguageCenterContext = createContext(null)

export const useLanguageCenterContext = () => useContext(LanguageCenterContext)

export const emptyFields = { completions: 0, enrollments: 0, difference: 0, rejected: 0 }

export const shortenCourseName = (text, maxLength) =>
  text.length > maxLength ? `${text.substring(0, maxLength)} ... ` : text

export const courseNameColumn = getTextIn => ({
  key: 'course-name',
  title: 'Course',
  getRowVal: row => row.code,
  getRowContent: row => (
    <div title={getTextIn(row.name)} style={{ display: 'flex', flexDirection: 'column' }}>
      <b>{row.code}</b>
      <i style={{ color: 'gray', fontWeight: 'normal' }}>{row.name && shortenCourseName(getTextIn(row.name), 46)}</i>
    </div>
  ),
})

export const filterAttemptsByDates = (date, { startDate, endDate }) => {
  const start = startDate.startdate ?? moment(new Date('1900-1-1'))
  const end = endDate.enddate ?? moment(new Date('2100-01-01'))
  return moment(new Date(date)).isBetween(start, end)
}

export const getDifference = stats => {
  const value = stats.notCompleted - stats.completed
  return value < 0 ? 0 : value
}

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

export const getColor = (row, stats, columnAmount, colorMode, numberMode, allTotal) => {
  if (colorMode === 'none' || allTotal === 0) return {}
  if (!stats) return {}
  const value = stats[numberMode]
  const totalValue = colorMode === 'course' ? stats[numberMode] : allTotal
  if (value === 0) return {}

  const relativeValue = (() => {
    if (totalValue === 0) return 0
    if (colorMode === 'course') return value / ((totalValue / columnAmount) * 2)
    return value / (totalValue / columnAmount / 8)
  })()
  const divisor = colorMode === 'course' ? 6 : 2

  return {
    backgroundColor: `rgba(0,170,0,${relativeValue / divisor})`,
  }
}
