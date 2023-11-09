import React from 'react'
import { getRatio, shortenCourseName } from '../common'

export const getColumns = (getTextIn, faculties, numberMode, facultyMap) => {
  const getFacultyTitle = code => {
    if (!code) return 'No faculty' // Shouldn't happen probably
    if (code === 'H930') return 'Open\nuni'
    return code
  }

  const totalEnrollmentsColumn = {
    key: 'total-column',
    title: 'Total\nenrollments',
    getRowVal: row => row.bySemesters.facultiesTotal.notCompleted,
    filterType: 'range',
    forceToolsMode: 'floating',
  }

  const totalColumn = {
    key: 'total-column',
    title: 'Total',
    getRowVal: row => row.bySemesters.facultiesTotal[numberMode],
    forceToolsMode: 'floating',
    filterType: 'range',
  }

  const getTotalColumn = () => {
    if (numberMode === 'ratio') {
      return totalEnrollmentsColumn
    }
    return totalColumn
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
      cellProps: row => {
        const stats = row.bySemesters.cellStats[facultyCode]
        if (stats.ratio === null) return null
        const hoverTooltip = {
          title: `Completions: ${stats.completed}\nEnrollments: ${stats.notCompleted}\nRatio: ${stats.ratio} %`,
        }
        if (numberMode !== 'ratio') return hoverTooltip
        if (stats.notCompleted === 0) return hoverTooltip
        return { ...hoverTooltip, style: { backgroundColor: `rgba(200,0,0,${1 - stats.ratio / 100})` } }
      },
      getRowVal: row => {
        const stats = row.bySemesters.cellStats[facultyCode]
        if (numberMode === 'ratio') {
          if (stats.notCompleted === 0) return '-'
          return stats.ratio
        }
        return stats[numberMode]
      },
      formatValue: numberMode === 'ratio' ? val => (val === '-' ? '-' : `${val} %`) : null,
      filterType: 'range',
      forceToolsMode: 'floating',
    })),
    getTotalColumn(),
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
  const totalRow = { cellStats: { completed: 0, notCompleted: 0, ratio: null } }
  semesters.forEach(sem => {
    totalRow[sem] = { completed: 0, notCompleted: 0, ratio: 1 }
    courses.forEach(course => {
      const stats = course.bySemesters[sem]
      if (!stats) return
      totalRow[sem].completed += stats.completed
      totalRow[sem].notCompleted += stats.notCompleted
      totalRow[sem].ratio = getRatio(totalRow[sem])
    })

    faculties.forEach(fac => {
      totalRow[sem][fac] = { completed: 0, notCompleted: 0, ratio: null }
      courses.forEach(course => {
        const stats = course.bySemesters[sem]?.[fac]
        if (!stats) return
        totalRow[sem][fac].completed += stats.completed
        totalRow[sem][fac].notCompleted += stats.notCompleted
        totalRow[sem][fac].ratio = getRatio(totalRow[sem][fac])
      })
    })
  })

  return { cellStats: {}, code: 'TOTAL', name: { en: 'All courses total' }, bySemesters: totalRow }
}
