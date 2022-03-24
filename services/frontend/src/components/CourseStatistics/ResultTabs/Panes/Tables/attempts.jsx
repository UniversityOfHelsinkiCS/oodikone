import React from 'react'
import qs from 'query-string'
import _, { uniq, flatten } from 'lodash'
import { Link } from 'react-router-dom'
import { connect } from 'react-redux'
import { Header, Icon, Item } from 'semantic-ui-react'

import SortableTable from '../../../../SortableTable'
import { getGradeSpread, getThesisGradeSpread, isThesisGrades, sortGrades } from '../util'

const getSortableColumn = opts => ({
  filterType: 'range',
  cellProps: s => ({
    style: {
      textAlign: 'right',
      color: s.rowObfuscated ? 'gray' : 'inherit',
    },
  }),
  ...opts,
})

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

    return {
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
  })

const resolveGrades = stats => {
  const failedGrades = ['eisa', 'hyl.', 'hyl', '0', 'luop']
  const otherPassedGrades = ['hyv.', 'hyv']

  const allGrades = [
    '0',
    ...flatten(
      stats.map(({ attempts }) =>
        [...Object.keys(attempts.grades)].map(grade => {
          const parsedGrade = Number(grade) ? Math.round(Number(grade)).toString() : grade
          if (failedGrades.includes(parsedGrade.toLowerCase())) return '0'
          if (parsedGrade === 'LA') return 'LUB' // merge LA and LUB grades
          return parsedGrade
        })
      )
    ),
  ]

  // If any of grades 1-5 is present, make sure that full the grade scale is present
  if (allGrades.filter(grade => ['1', '2', '3', '4', '5'].includes(grade)).length)
    allGrades.push(...['1', '2', '3', '4', '5'])
  const grades = [...new Set(allGrades)]

  return grades.sort(sortGrades).map(grade => {
    if (grade === '0') return { key: grade, title: 'Failed' }
    if (otherPassedGrades.includes(grade.toLowerCase())) return { key: grade, title: 'Other passed' }
    return { key: grade, title: grade.charAt(0).toUpperCase() + grade.slice(1) }
  })
}

const getGradeColumns = grades =>
  grades.map(({ key, title }) =>
    getSortableColumn({
      key,
      title,
      getRowVal: s => (s.rowObfuscated ? 'NA' : s[key] || 0),
    })
  )

const AttemptsTable = ({
  data: { stats, name },
  settings: { showGrades, showEnrollments, separate },
  alternatives,
  isRelative,
  userHasAccessToAllStats,
  headerVisible = false,
}) => {
  const {
    attempts: { grades },
  } = stats[0]
  const useThesisGrades = isThesisGrades(grades)

  const showPopulation = (yearcode, years) => {
    const queryObject = {
      from: yearcode,
      to: yearcode,
      coursecodes: JSON.stringify(uniq(alternatives)),
      years,
      separate,
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
        filterType: 'default',
        cellProps: {},
        getRowVal: s => s.code,
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
            <Item as={Link} to={showPopulation(s.code, s.name, s)}>
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
      title: 'Total attempts',
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

  if (showEnrollments) {
    columns = [
      ...columns,
      getSortableColumn({
        key: 'TOTAL_ENROLLMENTS',
        title: 'Total enrollments',
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
  }

  const data = getTableData(stats, useThesisGrades, isRelative)

  return (
    <div>
      {headerVisible && (
        <Header as="h3" textAlign="center">
          {name}
        </Header>
      )}
      <SortableTable
        title={`Yearly attempt statistics for group ${name}`}
        defaultSort={['TIME', 'desc']}
        columns={columns}
        data={data}
      />
      {!userHasAccessToAllStats && (
        <span className="totalsDisclaimer">* Years with 5 students or less are NOT included in the total</span>
      )}
    </div>
  )
}

export default connect(null)(AttemptsTable)
