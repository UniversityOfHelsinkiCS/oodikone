import Tooltip from '@mui/material/Tooltip'
import { ColumnDef, createColumnHelper } from '@tanstack/react-table'
import { useMemo } from 'react'

import { useLanguage } from '@/components/LanguagePicker/useLanguage'
import { OodiTable } from '@/components/OodiTable'
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
  const filteredData = useMemo(() => filterDataByYear(data, fromYear, toYear), [data, fromYear, toYear])

  const columnHelper = createColumnHelper<FilteredColumnData>()

  const commonColumns = [
    columnHelper.accessor('isStudyModule', {
      header: 'Type',
      cell: ({ row }) => (row.original.isStudyModule ? 'Module' : 'Course'),
    }),
    columnHelper.accessor('code', {
      header: 'Code',
      cell: ({ row }) => <CodeCell code={row.original.code} />,
    }),
    columnHelper.accessor('name', {
      header: 'Name',
      cell: ({ row }) => {
        const text = getTextIn(row.original.name)
        return (
          <Tooltip arrow title={text}>
            <span style={{ display: 'block', textOverflow: 'ellipsis', overflow: 'hidden' }}>{text}</span>
          </Tooltip>
        )
      },
    }),
  ]

  const creditColumns = [
    columnHelper.accessor(`totalAllCredits`, {
      header: 'Total credits',
    }),
    columnHelper.accessor('totalProgrammeCredits', {
      header: 'Major credits',
    }),
    columnHelper.accessor('totalOtherProgrammeCredits', {
      header: 'Non-major credits',
    }),
    columnHelper.accessor('totalWithoutStudyRightCredits', {
      header: 'Non-degree credits',
    }),
    columnHelper.accessor('totalTransferCredits', {
      header: 'Transferred credits',
    }),
  ]

  const studentColumns = [
    columnHelper.accessor('totalAllStudents', {
      header: 'Total',
    }),
    columnHelper.group({
      id: 'breakdown',
      header: 'Breakdown of total',
      columns: [
        columnHelper.accessor('totalAllPassed', {
          header: 'Passed',
        }),
        columnHelper.accessor('totalAllNotCompleted', {
          header: 'Not completed',
        }),
      ],
    }),
    columnHelper.group({
      id: 'breakdown-passed',
      header: 'Breakdown of passed students',
      columns: [
        columnHelper.accessor('totalProgrammeStudents', {
          header: 'Major students',
        }),
        columnHelper.accessor('totalOtherProgrammeStudents', {
          header: 'Non-major students',
        }),
        columnHelper.accessor('totalWithoutStudyRightStudents', {
          header: 'Non-degree students',
        }),
      ],
    }),
    columnHelper.group({
      id: 'excluded',
      header: 'Not included in total or passed',
      columns: [
        columnHelper.accessor('totalTransferStudents', {
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

  return <OodiTable columns={columns} cy="overall-stats-table" data={filteredData} options={options} />
}
