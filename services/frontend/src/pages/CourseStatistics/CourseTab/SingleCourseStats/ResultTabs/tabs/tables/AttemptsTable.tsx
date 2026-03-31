import { createColumnHelper, TableOptions } from '@tanstack/react-table'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { TotalsDisclaimer } from '@/components/common/TotalsDisclaimer'
import { OodiTable } from '@/components/OodiTable'
import { OodiTableExcelExport } from '@/components/OodiTable/excelExport'
import { CourseSearchState } from '@/pages/CourseStatistics'
import { FormattedStats, ProgrammeStats } from '@/types/courseStat'

import { queryParamsToString } from '@/util/queryparams'
import { getGradeSpread, getThesisGradeSpread, isThesisGrades } from '../util'
import { ObfuscatedCell } from './ObfuscatedCell'
import { TimeCell } from './TimeCell'
import { formatPercentage, getGradeColumns, resolveGrades } from './util'

type TableData = {
  name: string
  code: number
  totalAttempts: number
  passed: number
  failed: number
  passRate: string
  enrollments?: number
  rowObfuscated?: boolean
  grades: Record<string, number>
}

const getTableData = (stats: FormattedStats[], useThesisGrades: boolean): TableData[] => {
  return stats.map(stat => {
    const {
      name,
      code,
      attempts: { grades, totalEnrollments },
      rowObfuscated,
    } = stat

    const attemptsWithGrades = Object.values(grades).reduce((cur, acc) => acc + cur, 0)
    const attempts = totalEnrollments ?? attemptsWithGrades
    const gradeSpread = useThesisGrades ? getThesisGradeSpread([grades]) : getGradeSpread([grades])

    const mapped = {
      name,
      code,
      totalAttempts: stat.attempts.totalAttempts ?? attempts,
      passed: stat.attempts.categories.passed,
      failed: stat.attempts.categories.failed,
      passRate: formatPercentage(stat.attempts.passRate),
      enrollments: stat.attempts.totalEnrollments,
      rowObfuscated: rowObfuscated ?? false,
      grades: Object.fromEntries(Object.entries(gradeSpread).map(([key, value]) => [key, value[0]])),
    }

    return mapped
  })
}

export const AttemptsTable = ({
  data: { stats },
  separate,
  showGrades,
  userHasAccessToAllStats,

  openOrRegular,
  alternatives,
}: {
  data: ProgrammeStats
  separate: boolean
  showGrades: boolean
  userHasAccessToAllStats: boolean

  openOrRegular: CourseSearchState
  alternatives: string[]
}) => {
  const [columnVisibility, setColumnVisibility] = useState<Record<string, boolean>>({})

  const showPopulation = useCallback(
    (yearCode: number) => {
      const queryObject = {
        from: yearCode,
        to: yearCode,
        coursecodes: JSON.stringify(alternatives),
        separate,
        unifyCourses: openOrRegular,
      }
      const searchString = queryParamsToString(queryObject)
      return `/coursepopulation?${searchString}`
    },
    [alternatives, separate, openOrRegular]
  )

  const useThesisGrades = isThesisGrades(stats[0].attempts.grades)
  const data = useMemo(() => getTableData(stats, useThesisGrades), [stats, useThesisGrades])
  const excelData = useMemo(() => {
    return data.map(({ grades, ...rest }) => ({
      ...rest,
      ...Object.fromEntries(Object.entries(grades).map(([key, val]) => [key, val])),
    }))
  }, [data])

  useEffect(() => {
    setColumnVisibility(prev => {
      const updatedVisibility: Record<string, boolean> = { ...prev }

      const gradeColumns = resolveGrades(stats).map(({ key }) => `grades.${key}`)

      gradeColumns.forEach(key => {
        updatedVisibility[key] = showGrades
      })

      updatedVisibility.passed = !showGrades
      updatedVisibility.failed = !showGrades
      updatedVisibility.passRate = !showGrades
      updatedVisibility.enrollments = !showGrades

      return {
        ...updatedVisibility,
        name: true,
        totalAttempts: true,
      }
    })
  }, [showGrades, stats])

  const columnHelper = createColumnHelper<TableData>()
  const ooditable_columns = useMemo(
    () => [
      columnHelper.accessor('name', {
        header: 'Time',
        cell: ctx => (
          <TimeCell
            href={showPopulation(ctx.row.original.code)}
            isEmptyRow={ctx.row.original.totalAttempts === 0}
            name={ctx.getValue()}
            userHasAccessToAllStats={userHasAccessToAllStats}
          />
        ),
        sortingFn: (rowA, rowB) => rowB.original.code - rowA.original.code,
      }),
      columnHelper.accessor('totalAttempts', {
        header: 'Total attempts',
        cell: ctx => (ctx.row.original.rowObfuscated ? <ObfuscatedCell /> : ctx.getValue()),
      }),
      columnHelper.accessor('passed', {
        header: 'Passed',
        cell: ctx => (ctx.row.original.rowObfuscated ? <ObfuscatedCell /> : ctx.getValue() || 0),
      }),
      columnHelper.accessor('failed', {
        header: 'Failed',
        cell: ctx => (ctx.row.original.rowObfuscated ? <ObfuscatedCell /> : ctx.getValue() || 0),
      }),
      columnHelper.accessor('passRate', {
        header: 'Pass rate',
        cell: ctx => (ctx.row.original.rowObfuscated ? <ObfuscatedCell /> : ctx.getValue()),
      }),
      columnHelper.accessor('enrollments', {
        header: 'Enrollments',
        cell: ctx => (ctx.row.original.rowObfuscated ? <ObfuscatedCell /> : ctx.getValue()),
      }),
      ...getGradeColumns<TableData>(resolveGrades(stats)),
    ],
    [showPopulation, stats, userHasAccessToAllStats]
  )

  const ooditable_table: Partial<TableOptions<TableData>> = {
    enableSortingRemoval: false,
    initialState: {
      sorting: [{ id: 'name', desc: false }],
    },
    state: { columnVisibility },
    onColumnVisibilityChange: setColumnVisibility,
  }

  return (
    <>
      <OodiTable
        columns={ooditable_columns}
        data={data}
        options={ooditable_table}
        toolbarContent={
          <OodiTableExcelExport data={excelData} exportColumnKeys={ooditable_table.state?.columnOrder ?? []} />
        }
      />
      <TotalsDisclaimer userHasAccessToAllStats={userHasAccessToAllStats} />
    </>
  )
}
