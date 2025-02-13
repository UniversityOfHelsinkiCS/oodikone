import { cloneDeep, uniq } from 'lodash'
import { MaterialReactTable, MRT_ColumnDef, useMaterialReactTable } from 'material-react-table'
import qs from 'query-string'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSelector } from 'react-redux'
import { Link } from 'react-router'
import { Icon, Item } from 'semantic-ui-react'

import { isDefaultServiceProvider } from '@/common'
import { useLanguage } from '@/components/LanguagePicker/useLanguage'
import { ExportToExcelDialog } from '@/components/material/ExportToExcelDialog'
import { TableHeaderWithTooltip } from '@/components/material/TableHeaderWithTooltip'
import { TotalsDisclaimer } from '@/components/material/TotalsDisclaimer'
import { SortableTable, row } from '@/components/SortableTable'
import { RootState } from '@/redux'
import { getCourseAlternatives } from '@/selectors/courseStats'
import { FormattedStats } from '@/types/courseStat'
import { getDefaultMRTOptions } from '@/util/getDefaultMRTOptions'
import { defineCellColor, formatPercentage, getSortableColumn, resolveGrades } from '../util'
import { ObfuscatedCell } from './ObfuscatedCell'
import { TimeCell } from './TimeCell'

const getNewGradeColumns = (grades: { key: string; title: string }[]) => {
  return grades.map(({ key, title }) => ({
    id: `students.grades.${key}`,
    accessorFn: row => row.students.grades[key],
    header: title,
    Cell: ({ cell, row }) => (row.original.rowObfuscated ? <ObfuscatedCell na /> : cell.getValue() || 0),
  }))
}

const getGradeColumns = grades => {
  return grades.map(({ key, title }) =>
    getSortableColumn({
      key,
      title,
      getRowVal: s => (s.rowObfuscated ? 'NA' : s.students.grades[key] || 0),
      onlyInGradeView: true,
    })
  )
}

const getColumns = (stats, showGrades, userHasAccessToAllStats, alternatives, separate, unifyCourses) => {
  const showPopulation = (yearCode, years) => {
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
  }

  const toskaColumns = [
    {
      key: 'TIME_PARENT',
      merge: true,
      mergeHeader: true,
      children: [
        {
          key: 'TIME',
          title: 'Time',
          filterType: 'range',
          getRowVal: s => s.code + 1949,
          getRowExportVal: s => s.name,
          getRowContent: s => (
            <div style={{ whiteSpace: 'nowrap' }}>
              {s.name}
              {s.name === 'Total' && !userHasAccessToAllStats && <strong>*</strong>}
            </div>
          ),
        },
        {
          key: 'TIME_ICON',
          export: false,
          getRowContent: s => {
            if (s.name !== 'Total' && userHasAccessToAllStats) {
              return (
                <Item as={Link} to={showPopulation(s.code, s.name)}>
                  <Icon name="level up alternate" />
                </Item>
              )
            }
            return null
          },
        },
      ],
    },
    {
      key: 'TOTAL_STUDENTS',
      title: 'Total\nstudents',
      helpText: 'Total count of students, including enrolled students with no grade',
      cellProps: s => ({
        style: {
          textAlign: 'right',
          color: s.rowObfuscated ? 'gray' : 'inherit',
        },
      }),
      filterType: 'range',
      getRowVal: s => (s.rowObfuscated ? 5 : s.students.total),
      getRowContent: s => (s.rowObfuscated ? '5 or fewer students' : s.students.total),
      getCellProps: s => defineCellColor(s.rowObfuscated),
    },
    {
      key: 'TOTAL_PASSED',
      title: 'Passed',
      filterType: 'range',
      getRowVal: s => (s.rowObfuscated ? 'NA' : s.students.totalPassed || 0),
      cellProps: s => ({
        style: {
          textAlign: 'right',
          color: s.rowObfuscated ? 'gray' : 'inherit',
        },
      }),
      hideWhenGradesVisible: true,
    },
    {
      key: 'TOTAL_FAILED',
      title: 'Failed',
      filterType: 'range',
      getRowVal: s => (s.rowObfuscated ? 'NA' : s.students.totalFailed || 0),
      cellProps: s => ({
        style: {
          textAlign: 'right',
          color: s.rowObfuscated ? 'gray' : 'inherit',
        },
      }),
      hideWhenGradesVisible: true,
    },
    ...getGradeColumns(resolveGrades(stats)),
    {
      key: 'ENROLLED_NO_GRADE',
      title: 'Enrolled,\nno grade',
      filterType: 'range',
      helpText: 'Total count of students with a valid enrollment and no passing or failing grade',
      getRowVal: s => (s.rowObfuscated ? 5 : s.students.enrolledStudentsWithNoGrade),
      getRowContent: s => (s.rowObfuscated ? '5 or fewer students' : s.students.enrolledStudentsWithNoGrade),
      cellProps: s => ({
        style: {
          textAlign: 'right',
          color: s.rowObfuscated ? 'gray' : 'inherit',
        },
      }),
    },
    {
      key: 'PASS_RATE',
      title: 'Pass rate',
      getRowVal: s => (s.rowObfuscated ? 0 : s.students.passRate * 100),
      getRowContent: s => (s.rowObfuscated ? '5 or fewer students' : formatPercentage(s.students.passRate * 100)),
      filterType: 'range',
      cellProps: s => ({
        style: {
          textAlign: 'right',
          color: s.rowObfuscated ? 'gray' : 'inherit',
        },
      }),
    },
    {
      key: 'FAIL_RATE',
      title: 'Fail rate',
      filterType: 'range',
      getRowVal: s => (s.rowObfuscated ? 'NA' : (s.students.failRate || 0) * 100),
      getRowContent: s => (s.rowObfuscated ? 'NA' : formatPercentage(s.students.failRate * 100)),
      cellProps: s => ({
        style: {
          textAlign: 'right',
          color: s.rowObfuscated ? 'gray' : 'inherit',
        },
      }),
    },
  ]

  const fdColums = cloneDeep(toskaColumns)
  const index = fdColums.findIndex(o => o.key === 'TIME_PARENT')
  if (index !== -1) {
    fdColums[index].children = fdColums[index].children.filter(o => o.key === 'TIME')
  }

  const columns = isDefaultServiceProvider() ? toskaColumns : fdColums
  return columns.filter(column => {
    if (showGrades && column.onlyInGradeView) return true
    if (showGrades && column.hideWhenGradesVisible) return false
    return !column.onlyInGradeView
  })
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

  const oldColumns = useMemo(
    () => getColumns(stats, showGrades, userHasAccessToAllStats, alternatives, separate, unifyCourses),
    [stats, showGrades, userHasAccessToAllStats, alternatives, separate, unifyCourses]
  )

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

  const data = stats.map(stats => {
    if (stats.name === 'Total') {
      return row(stats, { ignoreFilters: true })
    }
    return stats
  })

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
        Cell: ({ cell, row }) => (row.original.rowObfuscated ? <ObfuscatedCell na /> : cell.getValue<number>() || 0),
      },
      {
        accessorKey: 'students.totalFailed',
        header: 'Failed',
        Cell: ({ cell, row }) => (row.original.rowObfuscated ? <ObfuscatedCell na /> : cell.getValue<number>() || 0),
      },
      ...getNewGradeColumns(resolveGrades(stats)),
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
          row.original.rowObfuscated ? <ObfuscatedCell na /> : formatPercentage(cell.getValue<number>() * 100),
      },
      {
        accessorKey: 'students.failRate',
        header: 'Fail rate',
        Cell: ({ cell, row }) =>
          row.original.rowObfuscated ? <ObfuscatedCell na /> : formatPercentage(cell.getValue<number>() * 100),
      },
    ],
    [showPopulation, stats, userHasAccessToAllStats]
  )

  const [columnVisibility, setColumnVisibility] = useState<Record<string, boolean>>({})

  useEffect(() => {
    setColumnVisibility(prev => {
      const updatedVisibility: Record<string, boolean> = { ...prev }

      resolveGrades(stats).forEach(({ key }) => {
        updatedVisibility[`students.grades.${key}`] = showGrades
      })

      updatedVisibility['students.totalPassed'] = !showGrades
      updatedVisibility['students.totalFailed'] = !showGrades

      return updatedVisibility
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
        featureName={`student_statistics_for_group_${name}`}
        onClose={() => setExportModalOpen(false)}
        open={exportModalOpen}
      />
      <MaterialReactTable table={table} />
      <SortableTable
        columns={oldColumns}
        data={data}
        defaultSort={['TIME', 'desc']}
        featureName="group_statistics"
        maxHeight="40vh"
        title={`Student statistics for group ${name}`}
      />
      <TotalsDisclaimer userHasAccessToAllStats={userHasAccessToAllStats} />
    </div>
  )
}
