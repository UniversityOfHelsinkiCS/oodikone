import { createColumnHelper, TableOptions } from '@tanstack/react-table'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { TableHeaderWithTooltip } from '@/components/common/TableHeaderWithTooltip'
import { TotalsDisclaimer } from '@/components/common/TotalsDisclaimer'
import { OodiTable } from '@/components/OodiTable'
import { OodiTableExcelExport } from '@/components/OodiTable/excelExport'
import { CourseSearchState } from '@/pages/CourseStatistics'
import { FormattedStats, ProgrammeStats } from '@/types/courseStat'
import { queryParamsToString } from '@/util/queryparams'
import { ObfuscatedCell } from './ObfuscatedCell'
import { TimeCell } from './TimeCell'
import { formatPercentage, getGradeColumns, resolveGrades } from './util'

type TableData = {
  name: string
  code: number
  totalStudents: number
  passed: number
  failed: number
  enrolledNoGrade?: number
  passRate: string
  failRate: string
  grades: Record<string, number>
  rowObfuscated?: boolean
}

const getTableData = (stats: FormattedStats[]): TableData[] => {
  return stats.map(stat => ({
    name: stat.name,
    code: stat.code,
    totalStudents: stat.students.total,
    passed: stat.students.totalPassed,
    failed: stat.students.totalFailed,
    enrolledNoGrade: stat.students.enrolledStudentsWithNoGrade,
    passRate: formatPercentage(stat.students.passRate * 100),
    failRate: formatPercentage(stat.students.failRate * 100),
    grades: stat.students.grades,
    rowObfuscated: stat.rowObfuscated,
  }))
}

export const StudentsTable = ({
  data: { stats },
  separate,
  showGrades,
  userHasAccessToAllStats,

  openOrRegular,
  combineSubstitutions,
  courseCodes,
}: {
  data: ProgrammeStats
  separate: boolean
  showGrades: boolean
  userHasAccessToAllStats: boolean

  openOrRegular: CourseSearchState
  combineSubstitutions: boolean
  courseCodes: string[]
}) => {
  const [columnVisibility, setColumnVisibility] = useState<Record<string, boolean>>({})

  const showPopulation = useCallback(
    (yearCode: number) => {
      const queryObject = {
        from: yearCode,
        to: yearCode,
        coursecodes: JSON.stringify(courseCodes),
        separate,
        unifyCourses: openOrRegular,
        includeSubstitutions: combineSubstitutions,
      }
      const searchString = queryParamsToString(queryObject)
      return `/coursepopulation?${searchString}`
    },
    [courseCodes, separate, openOrRegular]
  )

  const data = useMemo(() => getTableData(stats), [stats])
  const excelData = useMemo(() => {
    return data.map(({ grades, ...rest }) => ({
      ...rest,
      ...Object.fromEntries(Object.entries(grades).map(([key, val]) => [key, val])),
    }))
  }, [data])

  useEffect(() => {
    setColumnVisibility(prev => {
      const updatedVisibility: Record<string, boolean> = { ...prev }

      resolveGrades(stats)
        .map(({ key }) => `grades.${key}`)
        .forEach(key => {
          updatedVisibility[key] = showGrades
        })

      updatedVisibility.passed = !showGrades
      updatedVisibility.failed = !showGrades

      return {
        ...updatedVisibility,
        name: true,
        totalStudents: true,
        enrolledNoGrade: true,
        passRate: true,
        failRate: true,
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
            isEmptyRow={ctx.row.original.totalStudents === 0}
            name={ctx.getValue()}
            userHasAccessToAllStats={userHasAccessToAllStats}
          />
        ),
        sortingFn: (rowA, rowB) => rowB.original.code - rowA.original.code,
      }),
      columnHelper.accessor('totalStudents', {
        header: _ => (
          <TableHeaderWithTooltip
            header="Total students"
            tooltipText="Total count of students, including enrolled students with no grade"
          />
        ),
        cell: ctx => (ctx.row.original.rowObfuscated ? <ObfuscatedCell /> : ctx.getValue() || 0),
      }),
      columnHelper.accessor('passed', {
        header: 'Passed',
        cell: ctx => (ctx.row.original.rowObfuscated ? <ObfuscatedCell /> : ctx.getValue() || 0),
      }),
      columnHelper.accessor('failed', {
        header: 'Failed',
        cell: ctx => (ctx.row.original.rowObfuscated ? <ObfuscatedCell /> : ctx.getValue() || 0),
      }),
      ...getGradeColumns<TableData>(resolveGrades(stats)),
      columnHelper.accessor('enrolledNoGrade', {
        header: _ => (
          <TableHeaderWithTooltip
            header="Enrolled, no grade"
            tooltipText="Total count of students with a valid enrollment and no passing or failing grade"
          />
        ),
        cell: ctx => (ctx.row.original.rowObfuscated ? <ObfuscatedCell /> : ctx.getValue()),
      }),
      columnHelper.accessor('passRate', {
        header: 'Pass rate',
        cell: ctx => (ctx.row.original.rowObfuscated ? <ObfuscatedCell /> : ctx.getValue()),
      }),
      columnHelper.accessor('failRate', {
        header: 'Fail rate',
        cell: ctx => (ctx.row.original.rowObfuscated ? <ObfuscatedCell /> : ctx.getValue()),
      }),
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
