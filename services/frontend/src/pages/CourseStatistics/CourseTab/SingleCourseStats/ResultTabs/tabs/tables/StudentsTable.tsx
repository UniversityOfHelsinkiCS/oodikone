import { cloneDeep, uniq } from 'lodash'
import qs from 'query-string'
import { useMemo } from 'react'
import { useSelector } from 'react-redux'
import { Link } from 'react-router'
import { Icon, Item } from 'semantic-ui-react'

import { isDefaultServiceProvider } from '@/common'
import { TotalsDisclaimer } from '@/components/material/TotalsDisclaimer'
import { SortableTable, row } from '@/components/SortableTable'
import { getCourseAlternatives } from '@/selectors/courseStats'
import { defineCellColor, formatPercentage, getSortableColumn, resolveGrades } from '../util'
import { RootState } from '@/redux'

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
                <Item as={Link} to={showPopulation(s.code, s.name, s)}>
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

export const StudentsTable = ({ data: { name, stats }, separate, showGrades, userHasAccessToAllStats }) => {
  const alternatives = useSelector(getCourseAlternatives)
  const unifyCourses = useSelector((state: RootState) => state.courseSearch.openOrRegular)

  const columns = useMemo(
    () => getColumns(stats, showGrades, userHasAccessToAllStats, alternatives, separate, unifyCourses),
    [stats, showGrades, userHasAccessToAllStats, alternatives, separate, unifyCourses]
  )

  const data = stats.map(stats => {
    if (stats.name === 'Total') {
      return row(stats, { ignoreFilters: true })
    }
    return stats
  })

  return (
    <div>
      <SortableTable
        columns={columns}
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
