import { courseNameColumn, getRatio } from '../common'

export const getColumns = (getTextIn, faculties, numberMode, facultyMap) => {
  const getFacultyTitle = code => {
    if (!code) return 'No faculty' // Shouldn't happen probably
    if (code === 'H930') return 'Open\nuni'
    return code
  }

  const formatAsPercent = val => (val === null ? '-' : `${val} %`)

  const getRatioTooltip = stats =>
    `Completions: ${stats.completions}\nEnrollments: ${stats.enrollments}\nRatio: ${stats.ratio} %`

  const getRatioCellProps = stats => {
    if (stats.ratio === null) return null
    const hoverTooltip = {
      title: getRatioTooltip(stats),
    }
    if (numberMode !== 'ratio') return hoverTooltip
    if (stats.enrollments === 0) return hoverTooltip
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
      if (stats.enrollments === 0 || stats.ratio === null) return null
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
          if (stats.enrollments === 0) return null
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

export const calculateTotals = (courses, faculties, semesters) => {
  const facultiesTotal = { completions: 0, enrollments: 0, ratio: null }
  const totalRow = { cellStats: {} }
  semesters.forEach(sem => {
    totalRow[sem] = { completions: 0, enrollments: 0, ratio: 1 }
    courses.forEach(course => {
      const stats = course.bySemesters[sem]
      if (!stats) return
      totalRow[sem].completions += stats.completions
      totalRow[sem].enrollments += stats.enrollments
      totalRow[sem].ratio = getRatio(totalRow[sem])
      facultiesTotal.completions += stats.completions
      facultiesTotal.enrollments += stats.enrollments
      facultiesTotal.ratio = getRatio(totalRow)
    })

    faculties.forEach(fac => {
      totalRow[sem][fac] = { completions: 0, enrollments: 0, ratio: null }
      courses.forEach(course => {
        const stats = course.bySemesters[sem]?.[fac]
        if (!stats) return
        totalRow[sem][fac].completions += stats.completions
        totalRow[sem][fac].enrollments += stats.enrollments
        totalRow[sem][fac].ratio = getRatio(totalRow[sem][fac])
      })
    })
  })

  return { cellStats: {}, code: 'TOTAL', name: { en: 'All courses total' }, bySemesters: totalRow, facultiesTotal }
}