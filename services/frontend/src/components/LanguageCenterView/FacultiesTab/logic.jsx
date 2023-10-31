import React from 'react'
import { shortenCourseName } from '../common'

export const getColumns = (getTextIn, faculties, mode, semesters, facultyMap) => {
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
        let number = 0
        semesters.forEach(sem => {
          const semesterStats = row.bySemesters[sem]
          if (!semesterStats || !semesterStats[facultyCode]) return
          number += semesterStats[facultyCode][mode]
        })
        return number
      },
      filterable: false,
    })),
    {
      key: 'total-column',
      title: 'Total',
      getRowVal: row => {
        let number = 0
        semesters.forEach(sem => {
          const semesterStats = row.bySemesters[sem]
          if (!semesterStats) return
          number += semesterStats[mode]
        })
        return number
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

export const calculateTotals = (courses, faculties, semesters) => {
  const totalRow = {}
  semesters.forEach(sem => {
    totalRow[sem] = { completed: 0, notCompleted: 0, total: 0 }
    courses.forEach(course => {
      const stats = course.bySemesters[sem]
      if (!stats) return
      totalRow[sem].completed += stats.completed
      totalRow[sem].notCompleted += stats.notCompleted
      totalRow[sem].total += stats.total
    })

    faculties.forEach(fac => {
      totalRow[sem][fac] = { completed: 0, notCompleted: 0, total: 0 }
      courses.forEach(course => {
        const stats = course.bySemesters[sem]?.[fac]
        if (!stats) return
        totalRow[sem][fac].completed += stats.completed
        totalRow[sem][fac].notCompleted += stats.notCompleted
        totalRow[sem][fac].total += stats.total
      })
    })
  })

  return { code: 'TOTAL', name: { en: 'All courses total' }, bySemesters: totalRow }
}
