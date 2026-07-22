import Box from '@mui/material/Box'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'

import { createColumnHelper } from '@tanstack/react-table'
import { useMemo } from 'react'
import { getColor, CourseContainer } from '@/components/ColorizedCoursesTable/common'

const getFacultyTitle = code => {
  if (code === 'OPEN') return 'Open\nuni'
  if (code === 'OTHER') return 'Other\nfaculty'
  return code ?? 'No faculty'
}

const columnHelper = createColumnHelper()

export const useColumns = (getTextIn, faculties, numberMode, colorMode, facultyMap, allTotal) => {
  return useMemo(
    () => [
      columnHelper.accessor('code', {
        id: 'Course',
        header: 'Course',
        cell: ({ row }) => {
          const { code, name } = row.original
          return <CourseContainer code={code} getTextIn={getTextIn} name={name} />
        },
        aggregationRows: () => [{ id: 'total', value: undefined }],
        aggregatedCell: () => <CourseContainer code="Total" getTextIn={getTextIn} name={{ en: 'All courses total' }} />,
        // TODO: pls DRY. This is same as in SemesterTab
        filterFn: (row, columnId, filterValue) => {
          const { code, name } = row.original
          // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
          return code.toLowerCase().includes(filterValue) || getTextIn(name).toLowerCase().includes(filterValue)
        },
      }),
      columnHelper.accessor('total-column', {
        id: 'Total',
        header: 'Total',
        cell: ({ row }) => {
          return (
            <Box
              sx={{
                'td:has(> &)':
                  colorMode !== 'course'
                    ? getColor(
                        row.original.bySemesters.facultiesTotal,
                        faculties.length,
                        colorMode,
                        numberMode,
                        null,
                        allTotal
                      )
                    : {},
              }}
            >
              {row.original.bySemesters.facultiesTotal[numberMode] ?? 0}
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
                faculties.reduce(
                  (faculty_acc, facultyCode) =>
                    faculty_acc + (row.original.bySemesters.cellStats[facultyCode]?.[numberMode] ?? 0),
                  0
                ),
              0
            ),
        sortingFn: (rowA, rowB) => {
          const a = rowA.original.bySemesters.facultiesTotal[numberMode] ?? 0
          const b = rowB.original.bySemesters.facultiesTotal[numberMode] ?? 0

          return a - b
        },
      }),
      ...faculties.map(facultyCode =>
        columnHelper.accessor(() => undefined, {
          id: facultyCode,
          header: () => (
            <Tooltip title={getTextIn(facultyMap?.[facultyCode]) ?? getFacultyTitle(facultyCode)}>
              <Typography variant="subtitle2">{getFacultyTitle(facultyCode)}</Typography>
            </Tooltip>
          ),
          cell: ({ row }) => {
            return (
              <Box
                sx={{
                  'td:has(> &)': getColor(
                    row.original.bySemesters.cellStats[facultyCode],
                    faculties.length,
                    colorMode,
                    numberMode,
                    row.original.bySemesters.facultiesTotal[numberMode],
                    allTotal
                  ),
                }}
              >
                {row.original.bySemesters.cellStats[facultyCode]?.[numberMode] ?? 0}
              </Box>
            )
          },
          aggregatedCell: ({ table }) =>
            table
              .getFilteredRowModel()
              .rows.reduce((acc, row) => acc + (row.original.bySemesters.cellStats[facultyCode]?.[numberMode] ?? 0), 0),
          sortingFn: (rowA, rowB) => {
            const a = rowA.original.bySemesters.cellStats[facultyCode]?.[numberMode] ?? 0
            const b = rowB.original.bySemesters.cellStats[facultyCode]?.[numberMode] ?? 0

            return a - b
          },
        })
      ),
    ],
    [numberMode, colorMode, allTotal, facultyMap, faculties, getTextIn, faculties]
  )
}
