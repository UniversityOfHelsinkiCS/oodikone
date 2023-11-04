import React from 'react'
import { shortenCourseName } from '../common'

export const getColumns = (getTextIn, semesters, numberMode, colorMode, allTotal) => {
  const getColor = (row, semester) => {
    if (colorMode === 'none' || allTotal === 0) return {}
    if (!semester && colorMode === 'course') return {}
    const stats = semester ? row.bySemesters[semester.semestercode] : row.bySemesters
    if (!stats) return {}
    const value = stats[numberMode]
    const totalValue = colorMode === 'course' ? row.bySemesters[numberMode] : allTotal
    if (value === 0) return {}

    const relativeValue = (() => {
      if (totalValue === 0) return 0
      if (colorMode === 'course') return value / ((totalValue / semesters.length) * 2)
      return value / (totalValue / semesters.length / 8)
    })()

    return {
      style: {
        backgroundColor: `rgba(0,170,0,${relativeValue / 4})`,
      },
    }
  }

  const columns = [
    {
      key: 'course-name',
      title: 'Course',
      getRowVal: row => row.code ?? 'No faculty found because enrollment date missing.',
      getRowContent: row => (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <b>{row.code ?? 'No faculty'}</b>
          <i style={{ color: 'gray', fontWeight: 'normal' }}>
            {row.name && shortenCourseName(getTextIn(row.name), 46)}
          </i>
        </div>
      ),
    },
    ...semesters.map(semester => ({
      key: `${semester.semestercode}`,
      title: `${semester.name.fi.replace(' ', '\n')}`,
      cellProps: row => getColor(row, semester),
      getRowVal: row => row.bySemesters[semester.semestercode]?.[numberMode] ?? 0,
      filterable: false,
    })),
    {
      key: 'all',
      title: 'Total',
      getRowVal: row => row.bySemesters[numberMode],
      cellProps: row => getColor(row),
    },
  ]
  return columns
}

export const calculateTotals = (courses, semesters) => {
  const totalRow = { completed: 0, notCompleted: 0, total: 0 }

  semesters.forEach(sem => {
    totalRow[sem] = { completed: 0, notCompleted: 0, total: 0 }
    courses.forEach(course => {
      const stats = course.bySemesters[sem]
      if (!stats) return
      totalRow[sem].completed += stats.completed
      totalRow[sem].notCompleted += stats.notCompleted
      totalRow[sem].total += stats.total
      totalRow.completed += stats.completed
      totalRow.notCompleted += stats.notCompleted
      totalRow.total += stats.total
    })
  })

  return { code: 'TOTAL', name: { en: 'All courses total' }, bySemesters: totalRow }
}
