import Tooltip from '@mui/material/Tooltip'
import { ColumnDef, createColumnHelper } from '@tanstack/react-table'
import { useMemo } from 'react'

import { useLanguage } from '@/components/LanguagePicker/useLanguage'
import { OodiTable } from '@/components/OodiTable'
import { OodiTableExcelExport } from '@/components/OodiTable/excelExport'
import { StudyProgrammeCourse } from '@oodikone/shared/types'
import { CodeCell } from './CodeCell'
import { filterDataByYear } from './util'

type FilteredColumnData = ReturnType<typeof filterDataByYear>[number]

export const OverallStatsTable = ({
  data,
  fromYear,
  showStudents,
  toYear,
}: {
  data: StudyProgrammeCourse[]
  fromYear: number
  showStudents: boolean
  toYear: number
}) => {
  const { getTextIn } = useLanguage()

  const filteredData = useMemo(
    () => filterDataByYear(data, fromYear, toYear, getTextIn),
    [data, fromYear, toYear, getTextIn]
  )

  const columnHelper = createColumnHelper<FilteredColumnData>()
  const commonColumns = [
    columnHelper.accessor('isStudyModule', {
      header: 'Type',
      invertSorting: true,
      cell: ({ row }) => (row.original.isStudyModule ? 'Module' : 'Course'),
    }),
    columnHelper.accessor('code', {
      header: 'Code',
      cell: ({ row }) => <CodeCell code={row.original.code} />,
    }),
    columnHelper.accessor('name', {
      header: 'Name',
      cell: ({ row }) => {
        const text = row.original.name
        return (
          <Tooltip arrow title={text}>
            <span style={{ display: 'block', textOverflow: 'ellipsis', overflow: 'hidden' }}>{text}</span>
          </Tooltip>
        )
      },
    }),
  ]

  const creditColumns = [
    columnHelper.accessor(`allCredits`, {
      header: 'Total credits',
    }),
    columnHelper.group({
      header: 'Credits produced by',
      columns: [
        columnHelper.accessor('degreeStudentsCredits', {
          header: 'Degree students',
        }),
        columnHelper.accessor('openStudentsCredits', {
          header: 'Open university',
        }),
        columnHelper.accessor('exchangeStudentsCredits', {
          header: 'Exchange students',
        }),
        columnHelper.accessor('otherUniversityCredits', {
          header: 'Other universities',
        }),
        columnHelper.accessor('separateStudentsCredits', {
          header: 'Separate studies',
        }),
        columnHelper.accessor('otherStudentsCredits', {
          header: 'Other', // TODO clarify
        }),
      ],
    }),
    columnHelper.accessor('transferStudentsCredits', {
      header: 'Transferred credits',
    }),
  ]

  const studentColumns = [
    columnHelper.accessor('allStudents', {
      header: 'Total',
    }),
    columnHelper.group({
      id: 'breakdown',
      header: 'Breakdown of total',
      columns: [
        columnHelper.accessor('allPassed', {
          header: 'Passed',
        }),
        columnHelper.accessor('allNotPassed', {
          header: 'Not completed',
        }),
      ],
    }),
    columnHelper.group({
      id: 'breakdown-passed',
      header: 'Breakdown of passed students',
      columns: [
        columnHelper.accessor('degreeStudents', {
          header: 'Degree students',
        }),
        columnHelper.accessor('openStudents', {
          header: 'Open uni students',
        }),
        columnHelper.accessor('exchangeStudents', {
          header: 'Exchange students',
        }),
        columnHelper.accessor('otherUniversityStudents', {
          header: 'Other university students',
        }),
        columnHelper.accessor('separateStudents', {
          header: 'Separate studies',
        }),
        columnHelper.accessor('otherStudents', {
          header: 'Other students', // TODO clarify
        }),
      ],
    }),
    columnHelper.group({
      id: 'excluded',
      header: 'Not included in total or passed',
      columns: [
        columnHelper.accessor('transferStudents', {
          header: 'Transferred students',
        }),
      ],
    }),
  ]

  const columns = useMemo(
    () => [...commonColumns, ...(showStudents ? studentColumns : creditColumns)],
    [showStudents]
  ) as ColumnDef<FilteredColumnData>[]

  const options = {
    state: {
      useZebrastripes: false,
    },
  }

  const columnKeys = useMemo(() => {
    const squashGroups = column => {
      if (column.columns) return column.columns.flatMap(squashGroups)
      return [column.accessorKey]
    }
    return columns.flatMap(squashGroups)
  }, [columns])

  return (
    <OodiTable
      columns={columns}
      cy="overall-stats-table"
      data={filteredData}
      options={options}
      toolbarContent={<OodiTableExcelExport data={filteredData} exportColumnKeys={columnKeys} />}
    />
  )
}
