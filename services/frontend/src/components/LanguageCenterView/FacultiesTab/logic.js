import { courseNameColumn, getRatio } from '../common'

export const getColumns = (getTextIn, faculties, numberMode, facultyMap) => {
  const getFacultyTitle = code => {
    if (!code) return 'No faculty' // Shouldn't happen probably
    if (code === 'H930') return 'Open\nuni'
    return code
  }

  const formatAsPercent = val => (val === null ? '-' : `${val} %`)

  const getRatioTooltip = stats =>
    `Completions: ${stats.completed}\nEnrollments: ${stats.notCompleted}\nRatio: ${stats.ratio} %`

  const getRatioCellProps = stats => {
    if (stats.ratio === null) return null
    const hoverTooltip = {
      title: getRatioTooltip(stats),
    }
    if (numberMode !== 'ratio') return hoverTooltip
    if (stats.notCompleted === 0) return hoverTooltip
    return { ...hoverTooltip, style: { backgroundColor: `rgba(200,0,0,${1 - stats.ratio / 100})` } }
  }

  const totalColumn = {
    key: 'total-column',
    title: 'Total',
    getRowVal: row => row.bySemesters.facultiesTotal[numberMode],
    forceToolsMode: 'floating',
    filterType: 'range',
  }

  const totalRatioColumn = {
    key: 'total-ratio',
    title: 'Total ratio',
    getRowVal: row => {
      const stats = row.bySemesters.facultiesTotal
      if (stats.notCompleted === 0 || stats.ratio === null) return null
      return stats.ratio
    },
    formatValue: val => formatAsPercent(val),
    cellProps: row => getRatioCellProps(row.bySemesters.facultiesTotal),
  }

  const columns = [
    courseNameColumn(getTextIn),
    ...faculties.map(facultyCode => ({
      key: facultyCode ?? 'no-faculty',
      title: getFacultyTitle(facultyCode),
      headerProps: { title: getTextIn(facultyMap[facultyCode]) },
      cellProps: row => getRatioCellProps(row.bySemesters.cellStats[facultyCode]),
      getRowVal: row => {
        const stats = row.bySemesters.cellStats[facultyCode]
        if (numberMode === 'ratio') {
          if (stats.notCompleted === 0) return null
          return stats.ratio
        }
        return stats[numberMode]
      },
      formatValue: numberMode !== 'ratio' ? null : val => formatAsPercent(val),
      filterType: 'range',
      forceToolsMode: 'floating',
    })),
    numberMode !== 'ratio' ? null : totalRatioColumn,
    numberMode === 'ratio' ? null : totalColumn,
  ].filter(Boolean)
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
  const facultiesTotal = { completed: 0, notCompleted: 0, ratio: null }
  const totalRow = { cellStats: {} }
  semesters.forEach(sem => {
    totalRow[sem] = { completed: 0, notCompleted: 0, ratio: 1 }
    courses.forEach(course => {
      const stats = course.bySemesters[sem]
      if (!stats) return
      totalRow[sem].completed += stats.completed
      totalRow[sem].notCompleted += stats.notCompleted
      totalRow[sem].ratio = getRatio(totalRow[sem])
      facultiesTotal.completed += stats.completed
      facultiesTotal.notCompleted += stats.notCompleted
      facultiesTotal.ratio = getRatio(totalRow)
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

  return { cellStats: {}, code: 'TOTAL', name: { en: 'All courses total' }, bySemesters: totalRow, facultiesTotal }
}
