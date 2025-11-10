import Box from '@mui/material/Box'
import { createColumnHelper } from '@tanstack/react-table'
import { useMemo } from 'react'

import { getColor } from '@/components/ColorizedCoursesTable/common'

const CourseContainer = ({ getTextIn, name, code }) => (
  <div
    style={{ display: 'flex', flexDirection: 'column', alignItems: 'baseline', height: 'auto', padding: '0.5em 0' }}
    title={getTextIn(name) ?? code}
  >
    <b>{code}</b>
    <i style={{ color: 'gray', maxWidth: '100%' }}>{getTextIn(name) ?? null}</i>
  </div>
)

const columnHelper = createColumnHelper()

export const useColumns = (getTextIn, semesters, numberMode, colorMode, allTotal) => {
  return useMemo(
    () => [
      columnHelper.accessor('code', {
        header: 'Course',
        cell: ({ row }) => {
          const { code, name } = row.original
          return <CourseContainer code={code} getTextIn={getTextIn} name={name} />
        },
        aggregationRows: () => [{ id: 'total', value: undefined }],
        aggregatedCell: () => <CourseContainer code="Total" getTextIn={getTextIn} name={{ en: 'All courses total' }} />,
      }),
      columnHelper.accessor('all', {
        header: 'Total',
        cell: ({ row }) => {
          return (
            <Box
              sx={{
                'td:has(> &)':
                  colorMode !== 'course'
                    ? getColor(row.original[numberMode], semesters.length, colorMode, numberMode, null, allTotal)
                    : {},
              }}
            >
              {row.original[numberMode] ?? 0}
            </Box>
          )
        },
        enableSorting: true,
        aggregatedCell: ({ table }) =>
          table
            .getFilteredRowModel()
            .rows.reduce(
              (acc, row) =>
                acc +
                semesters.reduce(
                  (semester_acc, semester) =>
                    semester_acc + (row.original.bySemesters[semester.semestercode]?.[numberMode] ?? 0),
                  0
                ),
              0
            ),
      }),
      ...semesters.map(({ name, semestercode }) =>
        columnHelper.accessor(() => undefined, {
          id: `${semestercode}`,
          header: `${getTextIn(name)}`,
          cell: ({ row }) => {
            return (
              <Box
                sx={{
                  'td:has(> &)': getColor(
                    row.original.bySemesters[semestercode],
                    semesters.length,
                    colorMode,
                    numberMode,
                    row.original.bySemesters[numberMode],
                    allTotal
                  ),
                }}
              >
                {row.original.bySemesters[semestercode]?.[numberMode] ?? 0}
              </Box>
            )
          },
          aggregatedCell: ({ table }) =>
            table
              .getFilteredRowModel()
              .rows.reduce((acc, row) => acc + (row.original.bySemesters[semestercode]?.[numberMode] ?? 0), 0),
          sortingFn: (rowA, rowB) => {
            const a = rowA.original.bySemesters[semestercode]?.[numberMode] ?? 0
            const b = rowB.original.bySemesters[semestercode]?.[numberMode] ?? 0

            return a - b
          },
        })
      ),
    ],
    [numberMode, colorMode, allTotal]
  )
}
