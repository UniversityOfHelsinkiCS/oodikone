import React from 'react'
import { shortenCourseName } from '../common'

export const getColumns = (getTextIn, faculties, mode, facultyMap) => {
  const getFacultyTitle = code => {
    if (!code) return 'No faculty' // Shouldn't happen probably
    if (code === 'H930') return 'Open\nuni'
    return code
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
            {row.name && shortenCourseName(getTextIn(row.name), 60)}
          </i>
        </div>
      ),
    },
    ...faculties.map(facultyCode => ({
      key: facultyCode ?? 'no-faculty',
      title: getFacultyTitle(facultyCode),
      headerProps: { title: getTextIn(facultyMap[facultyCode]) },
      getRowVal: row => {
        const stats = row.facultyStats[facultyCode]
        if (!stats) return 0
        if (mode === 'total') {
          const result = (stats.completed ?? 0) + (stats.notCompleted ?? 0)
          return result
        }
        return stats[mode] ?? 0
      },
      filterable: false,
    })),
    {
      key: 'all',
      title: 'Total',
      getRowVal: row => {
        const objVals = Object.values(row.facultyStats)
        const arr = objVals.map(stat => {
          if (mode === 'total') {
            const notCompleted = stat.notCompleted ?? 0
            const completed = stat.completed ?? 0
            return notCompleted + completed
          }
          return stat[mode]
        })
        return arr.reduce((sum, cur) => {
          if (cur === undefined) return sum
          return cur + sum
        }, 0)
      },
    },
  ]
  return columns
}

export const getCourseFaculties = attempts => {
  const map = attempts.reduce((obj, cur) => {
    if (!obj[cur.courseCode]) {
      obj[cur.courseCode] = {}
    }
    if (!obj[cur.courseCode][cur.faculty]) {
      obj[cur.courseCode][cur.faculty] = {}
    }
    const stats = obj[cur.courseCode][cur.faculty]
    const field = cur.completed ? 'completed' : 'notCompleted'
    if (!stats[field]) {
      stats[field] = 1
    } else {
      stats[field] += 1
    }
    return obj
  }, {})
  return map
}

export const calculateTotals = coursesWithFaculties => {
  const facultyStats = {}
  coursesWithFaculties.forEach(course => {
    Object.entries(course.facultyStats).forEach(([faculty, stats]) => {
      if (!facultyStats[faculty]) {
        facultyStats[faculty] = { notCompleted: 0, completed: 0 }
      }
      const oldStats = facultyStats[faculty]
      if (!oldStats.notCompleted) oldStats.notCompleted = 0
      if (!oldStats.completed) oldStats.completed = 0
      oldStats.notCompleted += stats.notCompleted ?? 0
      oldStats.completed += stats.completed ?? 0
    })
  })
  return { code: 'TOTAL', name: { en: 'All courses total' }, facultyStats }
}
