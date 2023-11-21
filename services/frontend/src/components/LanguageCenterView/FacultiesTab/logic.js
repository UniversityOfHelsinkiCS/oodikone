import { courseNameColumn } from '../common'

export const getColumns = (getTextIn, faculties, numberMode, facultyMap) => {
  const getFacultyTitle = code => {
    if (!code) return 'No faculty' // Shouldn't happen
    if (code === 'OPEN') return 'Open\nuni'
    if (code === 'OTHER') return 'Other\nfaculty'
    return code
  }

  const getTooltip = stats => ({
    title: `Completions: ${stats.completions}\nEnrollments: ${stats.enrollments}\nDifference: ${stats.difference}`,
  })

  const totalColumn = {
    key: 'total-column',
    title: 'Total',
    cellProps: row => getTooltip(row.bySemesters.facultiesTotal),
    getRowVal: row => row.bySemesters.facultiesTotal[numberMode],
    forceToolsMode: 'floating',
    filterType: 'range',
  }

  const columns = [
    courseNameColumn(getTextIn),
    ...faculties.map(facultyCode => ({
      key: facultyCode ?? 'no-faculty',
      title: getFacultyTitle(facultyCode),
      headerProps: { title: getTextIn(facultyMap[facultyCode]) },
      cellProps: row => getTooltip(row.bySemesters.cellStats[facultyCode]),
      getRowVal: row => {
        const stats = row.bySemesters.cellStats[facultyCode]
        return stats[numberMode]
      },
      filterType: 'range',
      forceToolsMode: 'floating',
    })),
    totalColumn,
  ]
  return columns
}

export const calculateTotals = (courses, faculties, semesters) => {
  const facultiesTotal = { completions: 0, enrollments: 0, difference: 0 }
  const totalRow = { cellStats: {} }
  semesters.forEach(sem => {
    totalRow[sem] = { completions: 0, enrollments: 0, difference: 0 }
    courses.forEach(course => {
      const stats = course.bySemesters[sem]
      if (!stats) return

      totalRow[sem].completions += stats.completions
      totalRow[sem].enrollments += stats.enrollments
      totalRow[sem].difference += stats.difference ?? 0
      facultiesTotal.completions += stats.completions
      facultiesTotal.enrollments += stats.enrollments
      facultiesTotal.difference += stats.difference ?? 0
    })

    faculties.forEach(fac => {
      totalRow[sem][fac] = { completions: 0, enrollments: 0, difference: 0 }
      courses.forEach(course => {
        const stats = course.bySemesters[sem]?.[fac]
        if (!stats) return
        totalRow[sem][fac].completions += stats.completions
        totalRow[sem][fac].enrollments += stats.enrollments
        totalRow[sem][fac].difference += stats.difference ?? 0
      })
    })
  })

  return { cellStats: {}, code: 'TOTAL', name: { en: 'All courses total' }, bySemesters: totalRow, facultiesTotal }
}
