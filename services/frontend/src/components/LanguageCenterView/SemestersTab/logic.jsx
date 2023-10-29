import React from 'react'
import { shortenCourseName } from '../common'

export const getColumns = (getTextIn, semesters, mode) => {
  const getTotalOfSemesterStats = stats => {
    const objVals = Object.values(stats)
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
  }

  const getValueFromStats = (stats, mode) => {
    if (!stats) return 0
    if (mode === 'total') return (stats.completed ?? 0) + (stats.notCompleted ?? 0)
    return stats[mode]
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
      cellProps: row => {
        const stats = row.semesterStats[semester.semestercode]
        const value = getValueFromStats(stats, mode)
        const totalValue = getTotalOfSemesterStats(row.semesterStats)
        const relativeValue = totalValue === 0 ? 0 : value / (totalValue / semesters.length)
        return {
          style: {
            backgroundColor: `rgba(0,180,0,${relativeValue / 6})`,
          },
        }
      },
      getRowVal: row => getValueFromStats(row.semesterStats[semester.semestercode], mode),
      filterable: false,
    })),
    {
      key: 'all',
      title: 'Total',
      getRowVal: row => getTotalOfSemesterStats(row.semesterStats),
    },
  ]
  return columns
}

export const getCourseMapWithSemesters = (attempts, semesters) => {
  const map = attempts.reduce((obj, cur) => {
    const semester = semesters.find(({ startdate, enddate }) => {
      const start = new Date(startdate).getTime()
      const end = new Date(enddate).getTime()
      const attDate = new Date(cur.date).getTime()
      const result = start < attDate && end > attDate
      return result
    })?.semestercode
    if (!obj[cur.courseCode]) {
      obj[cur.courseCode] = {}
    }
    if (!obj[cur.courseCode][semester]) {
      obj[cur.courseCode][semester] = {}
    }
    const stats = obj[cur.courseCode][semester]
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
