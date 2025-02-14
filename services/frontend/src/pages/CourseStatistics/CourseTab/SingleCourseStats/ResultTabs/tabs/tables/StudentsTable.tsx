import { uniq } from 'lodash'
import { MaterialReactTable, MRT_ColumnDef, useMaterialReactTable } from 'material-react-table'
import qs from 'query-string'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSelector } from 'react-redux'

import { useLanguage } from '@/components/LanguagePicker/useLanguage'
import { ExportToExcelDialog } from '@/components/material/ExportToExcelDialog'
import { TableHeaderWithTooltip } from '@/components/material/TableHeaderWithTooltip'
import { TotalsDisclaimer } from '@/components/material/TotalsDisclaimer'
import { RootState } from '@/redux'
import { getCourseAlternatives } from '@/selectors/courseStats'
import { FormattedStats } from '@/types/courseStat'
import { getDefaultMRTOptions } from '@/util/getDefaultMRTOptions'
import { formatPercentage, resolveGrades } from '../util'
import { ObfuscatedCell } from './ObfuscatedCell'
import { TimeCell } from './TimeCell'

const getGradeColumns = (grades: { key: string; title: string }[]) => {
  return grades.map(({ key, title }) => ({
    id: `students.grades.${key}`,
    accessorFn: row => row.students.grades[key],
    header: title,
    Cell: ({ cell, row }) => (row.original.rowObfuscated ? <ObfuscatedCell /> : cell.getValue() || 0),
  }))
}

export const StudentsTable = ({
  data: { name, stats },
  separate,
  showGrades,
  userHasAccessToAllStats,
}: {
  data: { name: string; stats: FormattedStats[] }
  separate: boolean
  showGrades: boolean
  userHasAccessToAllStats: boolean
}) => {
  const { language } = useLanguage()

  const alternatives = useSelector(getCourseAlternatives)
  const unifyCourses = useSelector((state: RootState) => state.courseSearch.openOrRegular)

  const [exportModalOpen, setExportModalOpen] = useState(false)
  const [exportData, setExportData] = useState<Record<string, unknown>[]>([])

  const showPopulation = useCallback(
    (yearCode: string, years: string) => {
      const queryObject = {
        from: yearCode,
        to: yearCode,
        coursecodes: JSON.stringify(uniq(alternatives.map(course => course.code))),
        years,
        separate,
        unifyCourses,
      }
      const searchString = qs.stringify(queryObject)
      return `/coursepopulation?${searchString}`
    },
    [alternatives, separate, unifyCourses]
  )

  const columns = useMemo<MRT_ColumnDef<any>[]>(
    () => [
      {
        accessorKey: 'name',
        header: 'Time',
        Cell: ({ cell, row }) => (
          <TimeCell
            href={showPopulation(row.original.code, row.original.name)}
            name={cell.getValue<string>()}
            userHasAccessToAllStats={userHasAccessToAllStats}
          />
        ),
        sortingFn: (rowA, rowB) => rowB.original.code - rowA.original.code,
      },
      {
        accessorKey: 'students.total',
        header: 'Total students',
        Header: (
          <TableHeaderWithTooltip
            header="Total students"
            tooltipText="Total count of students, including enrolled students with no grade"
          />
        ),
        Cell: ({ cell, row }) => (row.original.rowObfuscated ? <ObfuscatedCell /> : cell.getValue<number>()),
      },
      {
        accessorKey: 'students.totalPassed',
        header: 'Passed',
        Cell: ({ cell, row }) => (row.original.rowObfuscated ? <ObfuscatedCell /> : cell.getValue<number>() || 0),
      },
      {
        accessorKey: 'students.totalFailed',
        header: 'Failed',
        Cell: ({ cell, row }) => (row.original.rowObfuscated ? <ObfuscatedCell /> : cell.getValue<number>() || 0),
      },
      ...getGradeColumns(resolveGrades(stats)),
      {
        accessorKey: 'students.enrolledStudentsWithNoGrade',
        header: 'Enrolled, no grade',
        Header: (
          <TableHeaderWithTooltip
            header="Enrolled, no grade"
            tooltipText="Total count of students with a valid enrollment and no passing or failing grade"
          />
        ),
        Cell: ({ cell, row }) => (row.original.rowObfuscated ? <ObfuscatedCell /> : cell.getValue<number>()),
      },
      {
        accessorKey: 'students.passRate',
        header: 'Pass rate',
        Cell: ({ cell, row }) =>
          row.original.rowObfuscated ? <ObfuscatedCell /> : formatPercentage(cell.getValue<number>() * 100),
      },
      {
        accessorKey: 'students.failRate',
        header: 'Fail rate',
        Cell: ({ cell, row }) =>
          row.original.rowObfuscated ? <ObfuscatedCell /> : formatPercentage(cell.getValue<number>() * 100),
      },
    ],
    [showPopulation, stats, userHasAccessToAllStats]
  )

  const [columnVisibility, setColumnVisibility] = useState<Record<string, boolean>>({})

  useEffect(() => {
    setColumnVisibility(prev => {
      const updatedVisibility: Record<string, boolean> = { ...prev }

      const gradeColumns = resolveGrades(stats).map(({ key }) => `students.grades.${key}`)

      gradeColumns.forEach(key => {
        updatedVisibility[key] = showGrades
      })

      updatedVisibility['students.totalPassed'] = !showGrades
      updatedVisibility['students.totalFailed'] = !showGrades

      return { ...updatedVisibility }
    })
  }, [showGrades, stats])

  const defaultOptions = getDefaultMRTOptions(setExportData, setExportModalOpen, language)

  const table = useMaterialReactTable({
    ...defaultOptions,
    columns,
    data: stats,
    defaultColumn: { size: 0 },
    enableHiding: false,
    enableDensityToggle: false,
    initialState: {
      ...defaultOptions.initialState,
      sorting: [{ id: 'name', desc: false }],
      showColumnFilters: false,
    },
    state: { columnVisibility },
    onColumnVisibilityChange: setColumnVisibility,
    muiTableBodyCellProps: {
      ...defaultOptions?.muiTableHeadCellProps,
      align: 'right',
    },
  })

  return (
    <div>
      <ExportToExcelDialog
        exportColumns={columns}
        exportData={exportData}
        featureName={`group_statistics_${name}`}
        onClose={() => setExportModalOpen(false)}
        open={exportModalOpen}
      />
      <MaterialReactTable table={table} />
      <TotalsDisclaimer userHasAccessToAllStats={userHasAccessToAllStats} />
    </div>
  )
}
