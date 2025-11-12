import ArrowIcon from '@mui/icons-material/NorthEast'
import Typography from '@mui/material/Typography'
import { createColumnHelper } from '@tanstack/react-table'
import { useMemo } from 'react'

import { calculatePercentage, isDefaultServiceProvider } from '@/common'
import { Link } from '@/components/material/Link'
import { OodiTable } from '@/components/OodiTable'
import { OodiTableExcelExport } from '@/components/OodiTable/excelExport'

const columnHelper = createColumnHelper()

const createColumnWithTitle = title =>
  columnHelper.display({
    key: title,
    header: title[0].toUpperCase() + title.slice(1),
    cell: ({ row }) => row.original.name,
  })

export const TeacherStatisticsTable = ({ statistics, variant }) => {
  const columns = [
    columnHelper.accessor('credits', {
      header: 'Credits',
      cell: ({ row }) => row.original.credits,
    }),
    columnHelper.accessor('transferred', {
      header: 'Credits transferred',
      cell: ({ row }) => row.original.transferred,
    }),
    columnHelper.accessor('passrate', {
      header: 'Passed',
      cell: ({ row }) => row.original.passrate,
    }),
  ]

  switch (variant) {
    case 'leaderboard':
      columns.unshift(
        columnHelper.display({
          key: 'name',
          header: 'Name',
          cell: ({ row }) => (
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.5em' }}>
              {row.original.name}
              {isDefaultServiceProvider() && (
                <Link target="_blank" to={`/teachers/${row.original.id}`}>
                  <ArrowIcon />
                </Link>
              )}
            </div>
          ),
        })
      )
      break
    case 'course':
      columns.unshift(createColumnWithTitle('course name'))
      columns.unshift(
        columnHelper.display({
          key: 'code',
          header: 'Course code',
          cell: ({ row }) => (
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.5em' }}>
              {row.original.id}
              <Link
                target="_blank"
                to={`/coursestatistics?combineSubstitutions=true&courseCodes=["${row.original.id}"]&separate=false`}
              >
                <ArrowIcon />
              </Link>
            </div>
          ),
        })
      )
      break
    case 'semester':
      columns.unshift(createColumnWithTitle('semester'))
      break
    case 'year':
      columns.unshift(createColumnWithTitle('year'))
      break
  }

  const [data, excelData] = useMemo(() => {
    const data = statistics.map(stat => ({
      ...stat,
      passrate: calculatePercentage(stat.passed, stat.passed + stat.failed),
    }))

    const excelData = data.map(stat => ({
      code: stat?.id, // if stats provides code, do not override it
      year: stat?.name,
      semester: stat?.name,
      'course name': stat?.name,
      ...stat,
    }))

    return [data, excelData]
  }, [statistics])

  const accessorKeys = useMemo(() => columns.map(col => col.accessorKey ?? col.key), [columns])

  if (!statistics.length) return <Typography>No statistics found for the given query.</Typography>

  const tableOptions = {
    initialState: {
      sorting: [variant === 'leaderboard' ? { id: 'credits', desc: true } : {}],
    },
  }

  return (
    <>
      <OodiTableExcelExport data={excelData} exportColumnKeys={accessorKeys} />
      <OodiTable columns={columns} data={data} options={tableOptions} />
    </>
  )
}
