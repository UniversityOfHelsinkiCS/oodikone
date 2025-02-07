import { mapValues, uniq } from 'lodash'
import qs from 'query-string'
import { useSelector } from 'react-redux'
import { Link } from 'react-router'
import { Header, Icon, Item } from 'semantic-ui-react'

import { TotalsDisclaimer } from '@/components/material/TotalsDisclaimer'
import { SortableTable, row } from '@/components/SortableTable'
import { getCourseAlternatives } from '@/selectors/courseStats'
import { getGradeSpread, getSortableColumn, getThesisGradeSpread, isThesisGrades, resolveGrades } from '../util'

const getTableData = (stats, useThesisGrades, isRelative) =>
  stats.map(stat => {
    const {
      name,
      code,
      attempts: { grades, totalEnrollments },
      coursecode,
      rowObfuscated,
    } = stat

    const attemptsWithGrades = Object.values(grades).reduce((cur, acc) => acc + cur, 0)
    const attempts = totalEnrollments || attemptsWithGrades
    const gradeSpread = useThesisGrades
      ? getThesisGradeSpread([grades], isRelative)
      : getGradeSpread([grades], isRelative)

    const mapped = {
      name,
      code,
      coursecode,
      passed: stat.attempts.categories.passed,
      failed: stat.attempts.categories.failed,
      totalEnrollments: stat.attempts.totalEnrollments,
      passRate: stat.attempts.passRate,
      attempts: stat.attempts.totalAttempts || attempts,
      rowObfuscated,
      ...mapValues(gradeSpread, x => x[0]),
    }

    if (mapped.name === 'Total') {
      return row(mapped, { ignoreFilters: true })
    }

    return mapped
  })

const getGradeColumns = grades => {
  return grades.map(({ key, title }) =>
    getSortableColumn({
      key,
      title,
      getRowVal: s => (s.rowObfuscated ? 'NA' : s[key] || 0),
    })
  )
}

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

  const showPopulation = (yearCode, years, unifyCourses) => {
    const queryObject = {
      from: yearCode,
      to: yearCode,
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
        getRowVal: s => s.code + 1949,
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
      getRowVal: s => (s.rowObfuscated ? '5 or fewer students' : s.attempts),
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
      key: 'ENROLLMENTS',
      title: 'Enrollments',
      helpText: 'All enrollments with enrolled state',
      getRowVal: s => (s.rowObfuscated ? 'NA' : s.totalEnrollments),
    }),
  ]

  if (showGrades) {
    columns = [
      timeColumn,
      getSortableColumn({
        key: 'ATTEMPTS',
        title: 'Total\nattempts',
        getRowVal: s => (s.rowObfuscated ? '5 or fewer students' : s.attempts),
      }),
      ...getGradeColumns(resolveGrades(stats)),
    ]
  }

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
      <TotalsDisclaimer userHasAccessToAllStats={userHasAccessToAllStats} />
    </>
  )
}
