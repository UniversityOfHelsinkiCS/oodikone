import React from 'react'
import qs from 'query-string'
import { Link } from 'react-router-dom'
import { arrayOf, number, oneOfType, shape, string, bool } from 'prop-types'
import { connect } from 'react-redux'
import { Header, Icon, Item } from 'semantic-ui-react'
import { uniq } from 'lodash'
import SortableTable from '../../../../SortableTable'
import { defineCellColor, getGradeSpread, getThesisGradeSpread, isThesisGrades, THESIS_GRADE_KEYS } from '../util'

const getSortableColumn = (key, title, getRowVal, getRowContent) => ({
  key,
  title,
  getRowVal,
  getRowContent,
  getCellProps: s => defineCellColor(s)
})

const getTableData = (stats, notThesisGrades, isRelative) =>
  stats.map(stat => {
    const {
      name,
      code,
      attempts: { grades },
      coursecode,
      rowObfuscated
    } = stat

    const attempts = Object.values(grades).reduce((cur, acc) => acc + cur, 0)
    const gradeSpread = notThesisGrades
      ? getGradeSpread([grades], isRelative)
      : getThesisGradeSpread([grades], isRelative)

    return {
      name,
      code,
      coursecode,
      attempts,
      rowObfuscated,
      ...gradeSpread
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
    getSortableColumn('OTHER_PASSED', 'Other passed', s => (s.rowObfuscated ? 'NA' : s['Hyv.']))
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

const GradesTable = ({
  stats,
  name,
  alternatives,
  separate,
  isRelative,
  populationsShouldBeVisible,
  headerVisible
}) => {
  const {
    attempts: { grades }
  } = stats[0]
  const notThesisGrades = !isThesisGrades(grades)

  const showPopulation = (yearcode, years) => {
    const queryObject = {
      from: yearcode,
      to: yearcode,
      coursecodes: JSON.stringify(uniq(alternatives)),
      years,
      separate
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
          {s.name !== 'Total' && populationsShouldBeVisible ? (
            <Item as={Link} to={showPopulation(s.code, s.name, s)}>
              <Icon name="level up alternate" />
            </Item>
          ) : null}
        </div>
      )
    ),
    cellProps: { width: 3 }
  }

  const columns = [
    timeColumn,
    getSortableColumn('ATTEMPTS', 'Attempts', s => (s.rowObfuscated ? '5 or less students' : s.attempts)),
    ...getGradeColumns(notThesisGrades, includesHTOrTT(stats))
  ]

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
        tableProps={{ celled: true, structured: true }}
        columns={columns}
        data={data}
      />
    </div>
  )
}

GradesTable.propTypes = {
  stats: arrayOf(shape({})).isRequired,
  name: oneOfType([number, string]).isRequired,
  alternatives: arrayOf(string).isRequired,
  separate: bool,
  isRelative: bool.isRequired,
  populationsShouldBeVisible: bool.isRequired,
  headerVisible: bool.isRequired
}

GradesTable.defaultProps = {
  separate: false
}

export default connect(null)(GradesTable)
