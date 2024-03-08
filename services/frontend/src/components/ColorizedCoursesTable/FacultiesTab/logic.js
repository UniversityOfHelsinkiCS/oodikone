import { courseNameColumn, getColor } from '@/components/ColorizedCoursesTable/common'

export const getColumns = (getTextIn, faculties, numberMode, colorMode, facultyMap, allTotal) => {
  const getFacultyTitle = code => {
    if (!code) return 'No faculty' // Shouldn't happen
    if (code === 'OPEN') return 'Open\nuni'
    if (code === 'OTHER') return 'Other\nfaculty'
    return code
  }

  const getTooltip = stats => ({
    title: `Completions: ${stats.completions}\nAccepted enrollments: ${stats.enrollments}\nExceeding: ${stats.difference}\nRejected: ${stats.rejected}`,
  })

  const totalColumn = {
    key: 'total-column',
    title: 'Total',
    cellProps: row => ({
      style:
        colorMode === 'course'
          ? {}
          : getColor(row.bySemesters.facultiesTotal, faculties.length, colorMode, numberMode, null, allTotal),
      ...getTooltip(row.bySemesters.facultiesTotal),
    }),
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
      cellProps: row => ({
        style: getColor(
          row.bySemesters.cellStats[facultyCode],
          faculties.length,
          colorMode,
          numberMode,
          row.bySemesters.facultiesTotal[numberMode],
          allTotal
        ),
        ...getTooltip(row.bySemesters.cellStats[facultyCode]),
      }),
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
