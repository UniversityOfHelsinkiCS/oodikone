import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { createColumnHelper, getExpandedRowModel } from '@tanstack/react-table'
import { range } from 'lodash-es'
import { useMemo, useState } from 'react'

import { Link } from '@/components/common/Link'
import { useLanguage } from '@/components/LanguagePicker/useLanguage'
import { OodiTable } from '@/components/OodiTable'
import { OodiTableExcelExport } from '@/components/OodiTable/excelExport'
import { NorthEastIcon, KeyboardArrowRightIcon } from '@/theme'
import { CourseFilterToggle } from '../CourseFilterToggle'

const columnHelper = createColumnHelper()

const semesterColumn = (year, semester, cumulative) =>
  columnHelper.accessor(() => undefined, {
    id: `semester-${year}-${semester}`,
    header: semester,
    cell: ({ row }) =>
      /* eslint-disable-next-line @typescript-eslint/prefer-optional-chain */
      ((cumulative ? row.original.stats?.passingSemestersCumulative : row.original.stats?.passingSemesters) ?? {})[
        `${year}-${semester.toUpperCase()}`
      ],
  })

const yearColumn = (year, cumulative) =>
  columnHelper.group({
    header: `${year + 1}${['st', 'nd', 'rd'][year] ?? 'th'} year`,
    columns: [semesterColumn(year, 'Fall', cumulative), semesterColumn(year, 'Spring', cumulative)],
  })

export const PassingSemesters = ({ onlyIamRights, courseStatistics }) => {
  const { getTextIn } = useLanguage()

  const [expanded, setExpanded] = useState({})
  const [cumulativeStats, setCumulativeStats] = useState(false)

  const [data, excelData] = useMemo(() => {
    const excelData = courseStatistics
      // Export only the courses, not the modules
      .flatMap(row => row?.courses ?? [row])
      .map(({ name, code, stats }) => ({
        Name: getTextIn(name),
        Code: code,
        Students: stats.students,
        Passed: stats.passed,
        'Before 1st year': (cumulativeStats ? stats.passingSemesters : stats.passingSemestersCumulative)?.BEFORE,
        ...Object.fromEntries(
          range(0, 6).flatMap(i => {
            const year = `${i + 1}${['st', 'nd', 'rd'][i] ?? 'th'}`
            return [
              [
                `${year} Fall`,
                (cumulativeStats ? stats.passingSemestersCumulative : stats.passingSemesters)?.[`${i}-FALL`],
              ],
              [
                `${year} Spring`,
                (cumulativeStats ? stats.passingSemestersCumulative : stats.passingSemesters)?.[`${i}-SPRING`],
              ],
            ]
          })
        ),
      }))

    return [courseStatistics, excelData]
  }, [courseStatistics, cumulativeStats])

  const accessorKeys = useMemo(
    () => [
      'Name',
      'Code',
      'Students',
      'Passed',
      'Before 1st year',
      ...range(0, 6).flatMap(i => {
        const year = `${i + 1}${['st', 'nd', 'rd'][i] ?? 'th'}`
        return [`${year} Fall`, `${year} Spring`]
      }),
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
                    <NorthEastIcon sx={{ ml: 1 }} />
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
            header: 'Students',
            cell: ({ row }) => row.original.stats?.students,
          }),
          columnHelper.accessor(() => undefined, {
            header: 'Passed',
            cell: ({ row }) => row.original.stats?.passed,
          }),
          columnHelper.accessor(() => undefined, {
            header: 'Before 1st year',
            cell: ({ row }) =>
              (cumulativeStats ? row.original.stats?.passingSemesters : row.original.stats?.passingSemestersCumulative)
                ?.BEFORE,
          }),
          ...range(0, 6).map(i => yearColumn(i, cumulativeStats)),
        ],
      }),
    ],
    [cumulativeStats]
  )

  const tableOptions = {
    getExpandedRowModel: getExpandedRowModel(),
    getSubRows: row => row.courses,
    paginateExpandedRows: false,
    onExpandedChange: setExpanded,
    state: { expanded },
  }

  return (
    <OodiTable
      columns={columns}
      data={data}
      options={tableOptions}
      toolbarContent={
        <>
          <OodiTableExcelExport data={excelData} exportColumnKeys={accessorKeys} />
          <Button onClick={() => setCumulativeStats(!cumulativeStats)} sx={{ my: 'auto', mx: 1 }} variant="outlined">
            {cumulativeStats ? 'Show yearly stats' : 'Show cumulative stats'}
          </Button>
        </>
      }
    />
  )
}
