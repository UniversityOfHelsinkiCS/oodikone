import { courseNameColumn, getColor } from '@/components/ColorizedCoursesTable/common'

export const getColumns = (getTextIn, semesters, numberMode, colorMode, allTotal) => {
  const columns = [
    courseNameColumn(getTextIn),
    ...semesters.map(semester => ({
      key: `${semester.semestercode}`,
      title: `${getTextIn(semester.name).replace(' ', '\n')}`,
      cellProps: row => ({
        style: {
          ...getColor(
            row.bySemesters[semester.semestercode],
            semesters.length,
            colorMode,
            numberMode,
            row.bySemesters[numberMode],
            allTotal
          ),
          textAlign: 'right',
        },
      }),
      getRowVal: row => row.bySemesters[semester.semestercode]?.[numberMode] ?? 0,
      filterType: 'range',
    })),
    {
      key: 'all',
      title: 'Total',
      getRowVal: row => row.bySemesters[numberMode] ?? 0,
      cellProps: row => ({
        style: {
          ...(colorMode === 'course'
            ? {}
            : getColor(row.bySemesters, semesters.length, colorMode, numberMode, null, allTotal)),
          textAlign: 'right',
        },
      }),
    },
  ]
  return columns
}
