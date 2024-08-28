import _, { uniq } from 'lodash'
import qs from 'query-string'
import { useSelector } from 'react-redux'
import { Link } from 'react-router-dom'
import { Header, Icon, Item } from 'semantic-ui-react'

import {
  getGradeSpread,
  getSortableColumn,
  getThesisGradeSpread,
  isThesisGrades,
  resolveGrades,
} from '@/components/CourseStatistics/ResultTabs/panes/util'
import { SortableTable, row } from '@/components/SortableTable'
import { getCourseAlternatives } from '@/selectors/courseStats'

const getTableData = (stats, useThesisGrades, isRelative) =>
  stats.map(stat => {
    const {
      name,
      code,
      attempts: { grades },
      coursecode,
      rowObfuscated,
    } = stat

    const attempts = Object.values(grades).reduce((cur, acc) => acc + cur, 0)
    const gradeSpread = useThesisGrades
      ? getThesisGradeSpread([grades], isRelative)
      : getGradeSpread([grades], isRelative)

    const mapped = {
      name,
      code,
      coursecode,
      passed: stat.attempts.categories.passed,
      failed: stat.attempts.categories.failed,
      enrollmentsByState: stat.attempts.enrollmentsByState,
      totalEnrollments: stat.attempts.totalEnrollments,
      passRate: stat.attempts.passRate,
      attempts,
      rowObfuscated,
      ..._.mapValues(gradeSpread, x => x[0]),
    }

    if (mapped.name === 'Total') {
      return row(mapped, { ignoreFilters: true })
    }

    return mapped
  })

const getGradeColumns = grades =>
  grades.map(({ key, title }) =>
    getSortableColumn({
      key,
      title,
      getRowVal: s => (s.rowObfuscated ? 'NA' : s[key] || 0),
    })
  )

export const AttemptsTable = ({
  data: { stats, name },
  settings: { showGrades, separate, isRelative },
  userHasAccessToAllStats,
  headerVisible = false,
}) => {
  const {
    attempts: { grades },
  } = stats[0]
  const useThesisGrades = isThesisGrades(grades)
  const alternatives = useSelector(getCourseAlternatives)
  const unifyCourses = useSelector(state => state.courseSearch.openOrRegular)

  const showPopulation = (yearcode, years, unifyCourses) => {
    const queryObject = {
      from: yearcode,
      to: yearcode,
      coursecodes: JSON.stringify(uniq(alternatives)),
      years,
      separate,
      unifyCourses,
    }
    const searchString = qs.stringify(queryObject)
    return `/coursepopulation?${searchString}`
  }

  const timeColumn = {
    key: 'TIME-PARENT',
    merge: true,
    mergeHeader: true,
    children: [
      getSortableColumn({
        key: 'TIME',
        title: 'Time',
        filterType: 'range',
        cellProps: {},
        getRowVal: s => s.code + (2011 - 62),
        getRowExportVal: s => s.name,
        getRowContent: s => (
          <div>
            {s.name}
            {s.name === 'Total' && !userHasAccessToAllStats && <strong>*</strong>}
          </div>
        ),
      }),
      {
        key: 'TIME-ICON',
        export: false,
        getRowContent: s =>
          s.name !== 'Total' &&
          userHasAccessToAllStats && (
            <Item as={Link} to={showPopulation(s.code, s.name, unifyCourses)}>
              <Icon name="level up alternate" />
            </Item>
          ),
      },
    ],
  }

  let columns = [
    timeColumn,
    getSortableColumn({
      key: 'ATTEMPTS',
      title: 'Total\nattempts',
      getRowVal: s => (s.rowObfuscated ? '5 or less students' : s.attempts),
    }),
    getSortableColumn({
      key: 'PASSED',
      title: 'Passed',
      getRowVal: s => (s.rowObfuscated ? 'NA' : s.passed),
    }),
    getSortableColumn({
      key: 'FAILED',
      title: 'Failed',
      getRowVal: s => (s.rowObfuscated ? 'NA' : s.failed),
    }),
    getSortableColumn({
      key: 'PASSRATE',
      title: 'Pass rate',
      getRowVal: s => (s.rowObfuscated ? 'NA' : s.passRate),
      getRowContent: s => (s.rowObfuscated ? 'NA' : `${Number(s.passRate || 0).toFixed(2)} %`),
    }),
    getSortableColumn({
      key: 'TOTAL_ENROLLMENTS',
      title: 'Total\nenrollments',
      helpText: 'All enrollments, including all rejected and aborted states.',
      getRowVal: s => (s.rowObfuscated ? 'NA' : s.totalEnrollments),
    }),
    getSortableColumn({
      key: 'ENROLLMENTS_ENROLLED',
      title: 'Enrolled',
      helpText: 'All enrollments with enrolled or confirmed state.',
      getRowVal: s => (s.rowObfuscated ? 'NA' : s.enrollmentsByState.ENROLLED),
    }),
    getSortableColumn({
      key: 'ENROLLMENTS_REJECTED',
      title: 'Rejected',
      helpText: 'All enrollments with rejected state.',
      getRowVal: s => (s.rowObfuscated ? 'NA' : s.enrollmentsByState.REJECTED),
    }),
    getSortableColumn({
      key: 'ENROLLMENTS_ABORTED',
      title: 'Aborted',
      helpText: 'All enrollments with aborted by student or teacher state.',
      getRowVal: s => (s.rowObfuscated ? 'NA' : s.enrollmentsByState.ABORTED),
    }),
  ]

  if (showGrades)
    columns = [
      timeColumn,
      getSortableColumn({
        key: 'ATTEMPTS',
        title: 'Total attempts',
        getRowVal: s => (s.rowObfuscated ? '5 or less students' : s.attempts),
      }),
      ...getGradeColumns(resolveGrades(stats)),
    ]

  const data = getTableData(stats, useThesisGrades, isRelative)

  return (
    <>
      {headerVisible && (
        <Header as="h3" textAlign="center">
          {name}
        </Header>
      )}
      <SortableTable
        columns={columns}
        data={data}
        defaultSort={['TIME', 'desc']}
        featureName="yearly_attempts"
        maxHeight="40vh"
        title={`Yearly attempt statistics for group ${name}`}
      />
      {!userHasAccessToAllStats && (
        <span className="totalsDisclaimer">* Years with 5 students or less are NOT included in the total</span>
      )}
    </>
  )
}
