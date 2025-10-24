import { MaterialReactTable, MRT_ColumnDef, useMaterialReactTable } from 'material-react-table'
import { useCallback, useMemo } from 'react'

import { useLanguage } from '@/components/LanguagePicker/useLanguage'
import { Name, StudyProgrammeCourse } from '@oodikone/shared/types'
import { CodeCell } from './CodeCell'
import { HeaderCell } from './HeaderCell'
import { filterDataByYear } from './util'

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

  // TODO: Filters don't work for most of the columns
  const getCommonColumns = useCallback(
    (): MRT_ColumnDef<any>[] => [
      {
        accessorKey: 'isStudyModule',
        header: 'Type',
        Cell: ({ cell }) => (cell.getValue<boolean>() ? 'Module' : 'Course'),
        filterVariant: 'select',
        filterSelectOptions: [
          { label: 'Module', value: true },
          { label: 'Course', value: false },
        ],
      },
      {
        accessorKey: 'code',
        header: 'Code',
        Cell: ({ cell }) => <CodeCell code={cell.getValue<string>()} />,
      },
      {
        accessorKey: 'name',
        header: 'Name',
        Cell: ({ cell }) => getTextIn(cell.getValue<Name>()),
      },
      {
        accessorKey: 'totalAllStudents',
        header: showStudents ? 'Total' : 'Total credits',
        Header: <HeaderCell value={showStudents ? 'Total' : 'Total credits'} />,
        Cell: ({ cell }) => cell.getValue<number>(),
        muiTableHeadCellProps: {
          align: 'right',
        },
        muiTableBodyCellProps: {
          align: 'right',
        },
      },
    ],
    [getTextIn, showStudents]
  )

  const getCreditColumns = (): MRT_ColumnDef<any>[] => [
    {
      accessorKey: 'totalProgrammeCredits',
      header: 'Major credits',
      Header: <HeaderCell value="Major credits" />,
      Cell: ({ cell }) => cell.getValue<number>(),
      muiTableHeadCellProps: {
        align: 'right',
      },
      muiTableBodyCellProps: {
        align: 'right',
      },
    },
    {
      accessorKey: 'totalOtherProgrammeCredits',
      header: 'Non-major credits',
      Header: <HeaderCell value="Non-major credits" />,
      Cell: ({ cell }) => cell.getValue<number>(),
      muiTableHeadCellProps: {
        align: 'right',
      },
      muiTableBodyCellProps: {
        align: 'right',
      },
    },
    {
      accessorKey: 'totalWithoutStudyRightCredits',
      header: 'Non-degree credits',
      Header: <HeaderCell value="Non-degree credits" />,
      Cell: ({ cell }) => cell.getValue<number>(),
      muiTableHeadCellProps: {
        align: 'right',
      },
      muiTableBodyCellProps: {
        align: 'right',
      },
    },
    {
      accessorKey: 'totalTransferCredits',
      header: 'Transferred credits',
      Header: <HeaderCell value="Transferred credits" />,
      Cell: ({ cell }) => cell.getValue<number>(),
      muiTableHeadCellProps: {
        align: 'right',
      },
      muiTableBodyCellProps: {
        align: 'right',
      },
    },
  ]

  const getStudentColumns = (): MRT_ColumnDef<any>[] => [
    {
      id: 'breakdown',
      header: 'Breakdown of total',
      columns: [
        {
          accessorKey: 'totalAllPassed',
          header: 'Passed',
          Header: <HeaderCell value="Passed" />,
          Cell: ({ cell }) => cell.getValue<number>(),
          muiTableHeadCellProps: {
            align: 'right',
          },
          muiTableBodyCellProps: {
            align: 'right',
          },
        },
        {
          accessorKey: 'totalAllNotCompleted',
          header: 'Not completed',
          Header: <HeaderCell value="Not completed" />,
          Cell: ({ cell }) => cell.getValue<number>(),
          muiTableHeadCellProps: {
            align: 'right',
          },
          muiTableBodyCellProps: {
            align: 'right',
          },
        },
      ],
    },
    {
      id: 'breakdown-passed',
      header: 'Breakdown of passed students',
      columns: [
        {
          accessorKey: 'totalProgrammeStudents',
          header: 'Major students',
          Header: <HeaderCell value="Major students" />,
          Cell: ({ cell }) => cell.getValue<number>(),
          muiTableHeadCellProps: {
            align: 'right',
          },
          muiTableBodyCellProps: {
            align: 'right',
          },
        },
        {
          accessorKey: 'totalOtherProgrammeStudents',
          header: 'Non-major students',
          Header: <HeaderCell value="Non-major students" />,
          Cell: ({ cell }) => cell.getValue<number>(),
          muiTableHeadCellProps: {
            align: 'right',
          },
          muiTableBodyCellProps: {
            align: 'right',
          },
        },
        {
          accessorKey: 'totalWithoutStudyRightStudents',
          header: 'Non-degree students',
          Header: <HeaderCell value="Non-degree students" />,
          Cell: ({ cell }) => cell.getValue<number>(),
          muiTableHeadCellProps: {
            align: 'right',
          },
          muiTableBodyCellProps: {
            align: 'right',
          },
        },
      ],
    },
    {
      id: 'excluded',
      header: 'Not included in total or passed',
      columns: [
        {
          accessorKey: 'totalTransferStudents',
          header: 'Transferred\nstudents',
          Cell: ({ cell }) => cell.getValue<number>(),
          muiTableHeadCellProps: {
            align: 'right',
          },
          muiTableBodyCellProps: {
            align: 'right',
          },
        },
      ],
    },
  ]

  const columns = useMemo<MRT_ColumnDef<any>[]>(
    () => [...getCommonColumns(), ...(showStudents ? getStudentColumns() : getCreditColumns())],
    [getCommonColumns, showStudents]
  )

  const paginationChoices = [50, 100, 250, 500, filteredData.length].filter(num => num <= filteredData.length)
  const pageSize = Math.min(100, filteredData.length)

  const table = useMaterialReactTable({
    columns,
    data: filteredData,
    defaultColumn: { size: 0 },
    enableDensityToggle: false,
    enableHiding: false,
    muiPaginationProps: {
      rowsPerPageOptions: paginationChoices,
    },
    initialState: {
      density: 'compact',
      pagination: {
        pageSize,
        pageIndex: 0,
      },
      sorting: [
        {
          id: 'totalAllStudents',
          desc: true,
        },
      ],
    },
  })

  return <MaterialReactTable data-cy="overall-stats-table" table={table} />
}
