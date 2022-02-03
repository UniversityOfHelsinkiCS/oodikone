import React from 'react'
import qs from 'query-string'
import _, { uniq } from 'lodash'
import { Link } from 'react-router-dom'
import { connect } from 'react-redux'
import { Header, Icon, Item } from 'semantic-ui-react'

import SortableTable from '../../../../SortableTable'
import { defineCellColor, getGradeSpread, getThesisGradeSpread, isThesisGrades, THESIS_GRADE_KEYS } from '../util'

const getSortableColumn = (key, title, getRowVal, getRowContent) => ({
  key,
  title,
  getRowVal,
  getRowContent,
  getCellProps: s => defineCellColor(s),
})

const getTableData = (stats, notThesisGrades, isRelative) =>
  stats.map(stat => {
    const {
      name,
      code,
      attempts: { grades },
      coursecode,
      rowObfuscated,
    } = stat

    const attempts = Object.values(grades).reduce((cur, acc) => acc + cur, 0)
    const gradeSpread = notThesisGrades
      ? getGradeSpread([grades], isRelative)
      : getThesisGradeSpread([grades], isRelative)

    return {
      name,
      code,
      coursecode,
      passed: stat.attempts.categories.passed,
      failed: stat.attempts.categories.failed,
      passRate: stat.attempts.passRate,
      attempts,
      rowObfuscated,
      ..._.mapValues(gradeSpread, x => x[0]),
    }
  })

const includesHTOrTT = stats =>
  stats.some(({ attempts }) => ['HT', 'TT'].some(grade => Object.keys(attempts.grades).includes(grade)))

const getGradeColumns = (notThesisGrades, addHTAndTT) => {
  if (!notThesisGrades) return THESIS_GRADE_KEYS.map(k => getSortableColumn(k, k, s => (s.rowObfuscated ? 'NA' : s[k])))
  const columns = [
    getSortableColumn('0', '0', s => (s.rowObfuscated ? 'NA' : s['0'])),
    getSortableColumn('1', '1', s => (s.rowObfuscated ? 'NA' : s['1'])),
    getSortableColumn('2', '2', s => (s.rowObfuscated ? 'NA' : s['2'])),
    getSortableColumn('3', '3', s => (s.rowObfuscated ? 'NA' : s['3'])),
    getSortableColumn('4', '4', s => (s.rowObfuscated ? 'NA' : s['4'])),
    getSortableColumn('5', '5', s => (s.rowObfuscated ? 'NA' : s['5'])),
    getSortableColumn('OTHER_PASSED', 'Other passed', s => (s.rowObfuscated ? 'NA' : s['Hyv.'])),
  ]
  if (addHTAndTT)
    columns.splice(
      6,
      0,
      getSortableColumn('HT', 'HT', s => (s.rowObfuscated ? 'NA' : s.HT)),
      getSortableColumn('TT', 'TT', s => (s.rowObfuscated ? 'NA' : s.TT))
    )
  return columns
}

const AttemptsTable = ({
  data: { stats, name },
  settings: { showGrades },
  alternatives,
  separate,
  isRelative,
  userHasAccessToAllStats,
  headerVisible = false,
}) => {
  const {
    attempts: { grades },
  } = stats[0]
  const notThesisGrades = !isThesisGrades(grades)

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
    ...getSortableColumn(
      'TIME',
      'Time',
      s => s.code,
      s => (
        <div>
          {s.name}
          {s.name === 'Total' && !userHasAccessToAllStats && <strong>*</strong>}
          {s.name !== 'Total' && userHasAccessToAllStats && (
            <Item as={Link} to={showPopulation(s.code, s.name, s)}>
              <Icon name="level up alternate" />
            </Item>
          )}
        </div>
      )
    ),
  }

  let columns = [
    timeColumn,
    getSortableColumn('ATTEMPTS', 'Total attempts', s => (s.rowObfuscated ? '5 or less students' : s.attempts)),
    getSortableColumn('PASSED', 'Passed', s => (s.rowObfuscated ? 'NA' : s.passed)),
    getSortableColumn('FAILED', 'Failed', s => (s.rowObfuscated ? 'NA' : s.failed)),
    getSortableColumn(
      'PASSRATE',
      'Pass rate',
      s => (s.rowObfuscated ? 'NA' : s.passRate),
      s => (s.rowObfuscated ? 'NA' : `${Number(s.passRate || 0).toFixed(2)} %`)
    ),
  ]

  if (showGrades) {
    columns = [
      timeColumn,
      getSortableColumn('ATTEMPTS', 'Total attempts', s => (s.rowObfuscated ? '5 or less students' : s.attempts)),
      ...getGradeColumns(notThesisGrades, includesHTOrTT(stats)),
    ]
  }

  const data = getTableData(stats, notThesisGrades, isRelative)

  return (
    <div>
      {headerVisible && (
        <Header as="h3" textAlign="center">
          {name}
        </Header>
      )}
      <SortableTable
        defaultdescending
        getRowKey={s => s.code}
        tableProps={{ celled: true, style: { width: 'auto' } }}
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
