import { uniq } from 'lodash'
import { MaterialReactTable, MRT_ColumnDef, useMaterialReactTable } from 'material-react-table'
import qs from 'query-string'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSelector } from 'react-redux'

import { useLanguage } from '@/components/LanguagePicker/useLanguage'
import { ExportToExcelDialog } from '@/components/material/ExportToExcelDialog'
import { TotalsDisclaimer } from '@/components/material/TotalsDisclaimer'
import { RootState } from '@/redux'
import { getCourseAlternatives } from '@/selectors/courseStats'
import { FormattedStats } from '@/types/courseStat'
import { getDefaultMRTOptions } from '@/util/getDefaultMRTOptions'
import { getGradeSpread, getThesisGradeSpread, isThesisGrades } from '../util'
import { ObfuscatedCell } from './ObfuscatedCell'
import { TimeCell } from './TimeCell'
import { formatPercentage, getGradeColumns, resolveGrades } from './util'

const getTableData = (stats: FormattedStats[], useThesisGrades: boolean) =>
  stats.map(stat => {
    const {
      name,
      code,
      attempts: { grades, totalEnrollments },
      coursecode,
      rowObfuscated,
    } = stat

    const attemptsWithGrades = Object.values(grades).reduce((cur, acc) => acc + cur, 0)
    const attempts = totalEnrollments ?? attemptsWithGrades

    const mapped = {
      name,
      code,
      coursecode,
      passed: stat.attempts.categories.passed,
      failed: stat.attempts.categories.failed,
      enrollments: stat.attempts.totalEnrollments,
      passRate: stat.attempts.passRate,
      attempts: stat.attempts.totalAttempts ?? attempts,
      rowObfuscated,
      students: {
        grades: useThesisGrades ? getThesisGradeSpread([grades]) : getGradeSpread([grades]),
      },
    }

    return mapped
  })

export const AttemptsTable = ({
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
  const [columnVisibility, setColumnVisibility] = useState<Record<string, boolean>>({})

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

  const useThesisGrades = isThesisGrades(stats[0].attempts.grades)
  const data = useMemo(() => getTableData(stats, useThesisGrades), [stats, useThesisGrades])

  const columns = useMemo<MRT_ColumnDef<any>[]>(
    () => [
      {
        accessorKey: 'name',
        header: 'Time',
        Cell: ({ cell, row }) => (
          <TimeCell
            href={showPopulation(row.original.code, row.original.name)}
            isEmptyRow={row.original.attempts.total === 0}
            name={cell.getValue<string>()}
            userHasAccessToAllStats={userHasAccessToAllStats}
          />
        ),
        sortingFn: (rowA, rowB) => rowB.original.code - rowA.original.code,
      },
      {
        accessorKey: 'attempts',
        header: 'Total attempts',
        Cell: ({ cell, row }) => (row.original.rowObfuscated ? <ObfuscatedCell /> : cell.getValue<number>()),
      },
      {
        accessorKey: 'passed',
        header: 'Passed',
        Cell: ({ cell, row }) => (row.original.rowObfuscated ? <ObfuscatedCell /> : cell.getValue<number>() || 0),
      },
      {
        accessorKey: 'failed',
        header: 'Failed',
        Cell: ({ cell, row }) => (row.original.rowObfuscated ? <ObfuscatedCell /> : cell.getValue<number>() || 0),
      },
      {
        accessorKey: 'passRate',
        header: 'Pass rate',
        Cell: ({ cell, row }) =>
          row.original.rowObfuscated ? <ObfuscatedCell /> : formatPercentage(cell.getValue<number>()),
      },
      {
        accessorKey: 'enrollments',
        header: 'Enrollments',
        Cell: ({ cell, row }) => (row.original.rowObfuscated ? <ObfuscatedCell /> : cell.getValue<number>()),
      },
      ...getGradeColumns(resolveGrades(stats)),
    ],
    [showPopulation, stats, userHasAccessToAllStats]
  )

  useEffect(() => {
    setColumnVisibility(prev => {
      const updatedVisibility: Record<string, boolean> = { ...prev }

      const gradeColumns = resolveGrades(stats).map(({ key }) => `students.grades.${key}`)

      gradeColumns.forEach(key => {
        updatedVisibility[key] = showGrades
      })

      updatedVisibility.passed = !showGrades
      updatedVisibility.failed = !showGrades
      updatedVisibility.passRate = !showGrades
      updatedVisibility.enrollments = !showGrades

      return { ...updatedVisibility }
    })
  }, [showGrades, stats])

  const defaultOptions = getDefaultMRTOptions(setExportData, setExportModalOpen, language)

  const table = useMaterialReactTable({
    ...defaultOptions,
    columns,
    data,
    defaultColumn: { size: 0 },
    enableHiding: false,
    enableDensityToggle: false,
    initialState: {
      ...defaultOptions.initialState,
      sorting: [{ id: 'name', desc: false }],
      showColumnFilters: false,
    },
    state: {
      columnVisibility,
      columnOrder: [
        'name',
        'attempts',
        'passed',
        'failed',
        ...resolveGrades(stats).map(({ key }) => `students.grades.${key}`),
        'passRate',
        'enrollments',
      ],
    },
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
        featureName={`attempt_statistics_${name}`}
        onClose={() => setExportModalOpen(false)}
        open={exportModalOpen}
      />
      <MaterialReactTable table={table} />
      <TotalsDisclaimer userHasAccessToAllStats={userHasAccessToAllStats} />
    </div>
  )
}
