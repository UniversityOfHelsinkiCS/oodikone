import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight'
import ArrowIcon from '@mui/icons-material/NorthEast'
import Box from '@mui/material/Box'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { createColumnHelper, getExpandedRowModel } from '@tanstack/react-table'
import { useMemo, useState } from 'react'

import { calculatePercentage } from '@/common'
import { Link } from '@/components/common/Link'
import { useLanguage } from '@/components/LanguagePicker/useLanguage'
import { OodiTable } from '@/components/OodiTable'
import { OodiTableExcelExport } from '@/components/OodiTable/excelExport'
import { CourseFilterToggle } from '../CourseFilterToggle'

const columnHelper = createColumnHelper()

export const PassFailEnrollments = ({ onlyIamRights, courseStatistics }) => {
  const { getTextIn } = useLanguage()

  const [expanded, setExpanded] = useState({})

  const [data, excelData] = useMemo(() => {
    const excelData = courseStatistics
      // Export only the courses, not the modules
      .flatMap(row => row?.courses ?? [row])
      .map(({ name, code, stats }) => ({
        Name: getTextIn(name),
        Code: code,
        'Total students': stats.totalStudents,
        Passed: stats.passed,
        Failed: stats.failed,
        'Enrolled, no grade': stats.totalEnrolledNoGrade,
        'Pass rate': calculatePercentage(stats.passed, stats.totalStudents),
        'Attempts total': stats.attempts,
        'Attempts per student': stats.perStudent,
        'Passed%': calculatePercentage(stats.passedOfPopulation, 100),
        'Attempted%': calculatePercentage(stats.triedOfPopulation, 100),
      }))

    return [courseStatistics, excelData]
  }, [courseStatistics, getTextIn, calculatePercentage])

  const accessorKeys = useMemo(
    () => [
      'Name',
      'Code',
      'Total students',
      'Passed',
      'Failed',
      'Enrolled, no grade',
      'Pass rate',
      'Attempts total',
      'Attempts per student',
      'Passed%',
      'Attempted%',
    ],
    []
  )

  const columns = useMemo(
    () => [
      columnHelper.accessor('name', {
        maxSize: '32em', // Hand picked magic number
        header: 'Name',
        cell: ({ row }) => {
          const name = getTextIn(row.original.name)
          const { code } = row.original

          const expansionStyle = row.getIsExpanded() ? { transform: 'rotate(90deg)' } : {}
          const expansionArrow = row.getCanExpand() ? (
            <Box sx={{ p: 1, pl: 0, my: 'auto' }}>
              <KeyboardArrowRightIcon
                data-cy={`toggle-group-module-${code}`}
                onClick={row.getToggleExpandedHandler()}
                sx={{
                  cursor: 'pointer',
                  ...expansionStyle,
                }}
              />
            </Box>
          ) : null

          const linkComponent =
            row.originalSubRows === undefined ? (
              <Stack flexDirection="row" sx={{ m: 'auto', mr: '0' }}>
                <CourseFilterToggle courseCode={code} courseName={name} />
                {!onlyIamRights ? (
                  <Link
                    to={`/coursestatistics?courseCodes=["${encodeURIComponent(code)}"]&separate=false&unifyOpenUniCourses=false`}
                  >
                    <ArrowIcon sx={{ ml: 1 }} />
                  </Link>
                ) : null}
              </Stack>
            ) : null

          return (
            <Stack
              flexDirection="row"
              sx={{
                '.ot-data-cell:has(> &)': {
                  width: '100%',
                  whiteSpace: 'normal',
                },
              }}
            >
              {expansionArrow}
              <Typography sx={{ minWidth: '20em', my: 'auto' }} variant="body2">
                {name}
              </Typography>
              {linkComponent}
            </Stack>
          )
        },
        sortingFn: (rowA, rowB) => getTextIn(rowA.original.name)?.localeCompare(getTextIn(rowB.original.name)) ?? 0,
      }),
      columnHelper.accessor('code', { header: 'Code' }),
      columnHelper.group({
        id: 'stats',
        header: 'Enrollment statistics',
        columns: [
          columnHelper.accessor(() => undefined, {
            header: 'Total students',
            cell: ({ row }) => row.original.stats?.totalStudents,
            sortingFn: (rowA, rowB) =>
              (rowA.original.stats?.totalStudents ?? 0) - (rowB.original.stats?.totalStudents ?? 0),
          }),
          columnHelper.accessor(() => undefined, {
            header: 'Passed',
            cell: ({ row }) => row.original.stats?.passed,
            sortingFn: (rowA, rowB) => (rowA.original.stats?.passed ?? 0) - (rowB.original.stats?.passed ?? 0),
          }),
          columnHelper.accessor(() => undefined, {
            header: 'Failed',
            cell: ({ row }) => row.original.stats?.failed,
            sortingFn: (rowA, rowB) => (rowA.original.stats?.failed ?? 0) - (rowB.original.stats?.failed ?? 0),
          }),
          columnHelper.accessor(() => undefined, {
            header: 'Enrolled, no grade',
            cell: ({ row }) => row.original.stats?.totalEnrolledNoGrade,
            sortingFn: (rowA, rowB) =>
              (rowA.original.stats?.totalEnrolledNoGrade ?? 0) - (rowB.original.stats?.totalEnrolledNoGrade ?? 0),
          }),
          columnHelper.accessor(() => undefined, {
            header: 'Pass rate',
            cell: ({ row }) =>
              row.original.stats
                ? calculatePercentage(row.original.stats?.passed, row.original.stats?.totalStudents)
                : null,
            sortingFn: (rowA, rowB) => {
              const a = rowA.original.stats ? rowA.original.stats.passed / rowA.original.stats.totalStudents : 0
              const b = rowB.original.stats ? rowB.original.stats.passed / rowB.original.stats.totalStudents : 0

              return a - b
            },
          }),
          columnHelper.group({
            id: 'attempts',
            header: 'Attempts',
            columns: [
              columnHelper.accessor(() => undefined, {
                header: 'Total',
                cell: ({ row }) => row.original.stats?.attempts,
                sortingFn: (rowA, rowB) => (rowA.original.stats?.attempts ?? 0) - (rowB.original.stats?.attempts ?? 0),
              }),
              columnHelper.accessor(() => undefined, {
                header: 'Per student',
                cell: ({ row }) => row.original.stats?.perStudent,
                sortingFn: (rowA, rowB) =>
                  (rowA.original.stats?.perStudent ?? 0) - (rowB.original.stats?.perStudent ?? 0),
              }),
            ],
          }),
          columnHelper.group({
            id: 'ofPopulation',
            header: 'Percentage of population',
            columns: [
              columnHelper.accessor(() => undefined, {
                id: 'passedPercentage',
                header: 'Passed',
                cell: ({ row }) =>
                  row.original.stats ? calculatePercentage(row.original.stats?.passedOfPopulation, 100) : null,
                sortingFn: (rowA, rowB) =>
                  (rowA.original.stats?.passedOfPopulation ?? 0) - (rowB.original.stats?.passedOfPopulation ?? 0),
              }),
              columnHelper.accessor(() => undefined, {
                header: 'Attempted',
                cell: ({ row }) =>
                  row.original.stats ? calculatePercentage(row.original.stats?.triedOfPopulation, 100) : null,
                sortingFn: (rowA, rowB) =>
                  (rowA.original.stats?.triedOfPopulation ?? 0) - (rowB.original.stats?.triedOfPopulation ?? 0),
              }),
            ],
          }),
        ],
      }),
    ],
    []
  )

  const tableOptions = {
    getExpandedRowModel: getExpandedRowModel(),
    getSubRows: row => row.courses,
    paginateExpandedRows: false,
    onExpandedChange: setExpanded,
    state: { expanded },
  }

  if (!data.length) return null

  return (
    <OodiTable
      columns={columns}
      data={data}
      options={tableOptions}
      toolbarContent={<OodiTableExcelExport data={excelData} exportColumnKeys={accessorKeys} />}
    />
  )
}
