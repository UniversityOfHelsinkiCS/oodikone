import { courseNameColumn } from '../common'

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
    const divisor = colorMode === 'course' ? 6 : 2
    return {
      style: {
        backgroundColor: `rgba(0,170,0,${relativeValue / divisor})`,
      },
    }
  }

  const columns = [
    courseNameColumn(getTextIn),
    ...semesters.map(semester => ({
      key: `${semester.semestercode}`,
      title: `${getTextIn(semester.name).replace(' ', '\n')}`,
      cellProps: row => getColor(row, semester),
      getRowVal: row => row.bySemesters[semester.semestercode]?.[numberMode] ?? 0,
      filterable: false,
    })),
    {
      key: 'all',
      title: 'Total',
      getRowVal: row => row.bySemesters[numberMode] ?? 0,
      cellProps: row => getColor(row),
    },
  ]
  return columns
}

export const calculateTotals = (courses, semesters) => {
  const totalRow = { completions: 0, enrollments: 0, total: 0 }

  semesters.forEach(sem => {
    totalRow[sem] = { completions: 0, enrollments: 0, total: 0 }
    courses.forEach(course => {
      const stats = course.bySemesters[sem]
      if (!stats) return
      totalRow[sem].completions += stats.completions
      totalRow[sem].enrollments += stats.enrollments
      totalRow[sem].total += stats.total
      totalRow.completions += stats.completions
      totalRow.enrollments += stats.enrollments
      totalRow.total += stats.total
    })
  })

  return { code: 'TOTAL', name: { en: 'All courses total' }, bySemesters: totalRow }
}
