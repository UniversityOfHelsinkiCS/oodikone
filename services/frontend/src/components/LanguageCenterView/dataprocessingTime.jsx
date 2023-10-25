import moment from 'moment'
import React from 'react'

const shorten = (text, maxLength) => (text.length > maxLength ? `${text.substring(0, maxLength)} ... ` : text)

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
  const columns = [
    {
      key: 'course-name',
      title: 'Course',
      getRowVal: row => row.code ?? 'No faculty found because enrollment date missing.',
      getRowContent: row => (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <b>{row.code ?? 'No faculty'}</b>
          <i style={{ color: 'gray', fontWeight: 'normal' }}>{row.name && shorten(getTextIn(row.name), 60)}</i>
        </div>
      ),
    },
    ...semesters.map(semester => ({
      key: `${semester.semestercode}`,
      title: `${semester.name.fi}`,
      cellProps: row => {
        const stats = row.semesterStats[semester.semestercode]
        const value = !stats ? 0 : mode === 'total' ? (stats.completed ?? 0) + (stats.notCompleted ?? 0) : stats[mode]
        const totalValue = getTotalOfSemesterStats(row.semesterStats) / semesters.length
        const relativeValue = totalValue === 0 ? 0 : (value / totalValue) * 100
        const green = (255 * relativeValue) / 100
        const red = (255 * (100 - relativeValue)) / 100

        // eslint-disable-next-line consistent-return
        return {
          style: {
            backgroundColor: `rgba(${red},${green},0,0.3)`,
          },
        }
      },
      getRowVal: row => {
        const stats = row.semesterStats[semester.semestercode]
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

export const filterAttemptsByDates = (date, { startDate, endDate }) => {
  const start = startDate.startdate ?? moment(new Date('1900-1-1'))
  const end = endDate.enddate ?? moment(new Date('2100-01-01'))
  return moment(new Date(date)).isBetween(start, end)
}
