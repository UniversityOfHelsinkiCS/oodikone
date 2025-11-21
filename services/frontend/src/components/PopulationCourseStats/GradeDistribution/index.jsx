import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight'
import ArrowIcon from '@mui/icons-material/NorthEast'
import Box from '@mui/material/Box'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { createColumnHelper, getExpandedRowModel } from '@tanstack/react-table'
import { chain, range } from 'lodash'
import { useMemo, useState } from 'react'

import { Link } from '@/components/common/Link'
import { useLanguage } from '@/components/LanguagePicker/useLanguage'
import { OodiTable } from '@/components/OodiTable'
import { OodiTableExcelExport } from '@/components/OodiTable/excelExport'

import { CourseFilterToggle } from '../CourseFilterToggle'
import { UsePopulationCourseContext } from '../PopulationCourseContext'

const mapCourseData = course => ({
  name: course.course.name,
  code: course.course.code,
  attempts: chain(course.grades).values().map('count').sum().value(),
  otherPassed: chain(course.grades)
    .omit(range(0, 6))
    .filter(grade => grade.status.passingGrade ?? grade.status.improvedGrade)
    .map('count')
    .sum()
    .value(),
  grades: {
    ...course.grades,
    0: {
      count: chain(course.grades)
        .filter(grade => grade.status.failingGrade)
        .map('count')
        .sum()
        .value(),
    },
  },
})

const columnHelper = createColumnHelper()

export const GradeDistribution = ({ onlyIamRights, useModules }) => {
  const { modules, courseStatistics } = UsePopulationCourseContext()
  const { getTextIn } = useLanguage()

  const [expanded, setExpanded] = useState({})

  const [data, excelData] = useMemo(() => {
    const data = useModules
      ? modules.map(({ module, courses }) => ({
          name: module.name,
          code: module.code,
          courses: courses.map(mapCourseData),
        }))
      : courseStatistics.map(mapCourseData)

    const excelData = data
      // Export only the courses, not the modules
      .flatMap(row => row?.courses ?? [row])
      .map(({ name, code, attempts, otherPassed, grades }) => ({
        Name: getTextIn(name),
        Code: code,
        Attempts: attempts ?? 0,
        'Other passed': otherPassed ?? 0,
        ...Object.fromEntries(range(0, 6).map(grade => [grade, grades[grade]?.count ?? 0])),
      }))

    return [data, excelData]
  }, [modules])

  const columns = useMemo(() => {
    return [
      columnHelper.accessor('name', {
        maxSize: '32em', // Hand picked magic number
        header: 'Name',
        cell: ({ row }) => {
          const name = getTextIn(row.original.name)
          const { code } = row.original

          const expansionStyle = row.getIsExpanded() ? { transform: 'rotate(90deg)' } : {}
          const expansionArrow = row.getCanExpand() ? (
            <Box sx={{ p: 1, my: 'auto' }}>
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
      }),
      columnHelper.accessor('code', { header: 'Code' }),
      columnHelper.group({
        id: 'stats',
        header: 'Grade statistics',
        columns: [
          columnHelper.accessor(() => undefined, {
            header: 'Attempts',
            cell: ({ row }) =>
              row.originalSubRows === undefined ? <Typography>{row.original.attempts ?? 0}</Typography> : null,
            sortingFn: (rowA, rowB) => (rowA.original.attempts ?? 0) - (rowB.original.attempts ?? 0),
          }),
          ...range(0, 6).map(grade =>
            columnHelper.accessor(() => undefined, {
              header: `${grade}`,
              cell: ({ row }) =>
                row.originalSubRows === undefined ? (row.original.grades?.[grade]?.count ?? 0) : null,
              sortingFn: (rowA, rowB) =>
                (rowA.original.grades?.[grade]?.count ?? 0) - (rowB.original.grades?.[grade]?.count ?? 0),
            })
          ),
          columnHelper.accessor(() => undefined, {
            header: 'Other passed',
            cell: ({ row }) => (row.originalSubRows === undefined ? row.original.otherPassed : null),
            sortingFn: (rowA, rowB) => (rowA.original.otherPassed ?? 0) - (rowB.original.otherPassed ?? 0),
          }),
        ],
      }),
    ]
  }, [])

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
        <OodiTableExcelExport
          data={excelData}
          exportColumnKeys={columns.flatMap(column => column.columns ?? [column]).map(({ header }) => header)}
        />
      }
    />
  )
}
