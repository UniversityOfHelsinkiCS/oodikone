import React from 'react'
import qs from 'query-string'
import { Link } from 'react-router-dom'
import { arrayOf, number, oneOfType, shape, string, bool } from 'prop-types'
import { connect } from 'react-redux'
import { Header, Icon, Item } from 'semantic-ui-react'
import { uniq } from 'lodash'
import SortableTable from '../../../../SortableTable'
import { getGradeSpread, getThesisGradeSpread, isThesisGrades, THESIS_GRADE_KEYS } from '../util'

const getSortableColumn = (key, title, getRowVal, getRowContent) => ({
  key,
  title,
  getRowVal,
  getRowContent
})

const getTableData = (stats, isGradeSeries, isRelative) =>
  stats.map(stat => {
    const {
      name,
      code,
      cumulative: { grades },
      coursecode,
      obfuscated
    } = stat

    if (obfuscated) {
      return {
        name,
        code,
        coursecode,
        attempts: '5 or less students',
        0: ['NA'],
        1: ['NA'],
        2: ['NA'],
        3: ['NA'],
        4: ['NA'],
        5: ['NA'],
        HT: ['NA'],
        TT: ['NA'],
        'Hyv.': ['NA']
      }
    }

    const attempts = Object.values(grades).reduce((cur, acc) => acc + cur, 0)
    const gradeSpread = isGradeSeries ? getGradeSpread([grades], isRelative) : getThesisGradeSpread([grades], isRelative)

    return {
      name,
      code,
      coursecode,
      attempts,
      ...gradeSpread
    }
  })

const includesHTOrTT = stats =>
  stats.some(({ cumulative }) => ['HT', 'TT'].some(grade => Object.keys(cumulative.grades).includes(grade)))

const getGradeColumns = (isGradeSeries, addHTAndTT) => {
  if (!isGradeSeries) return THESIS_GRADE_KEYS.map(k => getSortableColumn(k, k, s => s[k]))
  const columns = [
    getSortableColumn('0', '0', s => s['0']),
    getSortableColumn('1', '1', s => s['1']),
    getSortableColumn('2', '2', s => s['2']),
    getSortableColumn('3', '3', s => s['3']),
    getSortableColumn('4', '4', s => s['4']),
    getSortableColumn('5', '5', s => s['5']),
    getSortableColumn('OTHER_PASSED', 'Other passed', s => s['Hyv.'])
  ]
  if (addHTAndTT)
    columns.splice(6, 0, getSortableColumn('HT', 'HT', s => s.HT), getSortableColumn('TT', 'TT', s => s.TT))
  return columns
}

const GradesTable = ({ stats, name, alternatives, separate, isRelative }) => {
  const {
    cumulative: { grades }
  } = stats[0]
  const isGradeSeries = !isThesisGrades(grades)

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

  const columns = [
    getSortableColumn(
      'TIME',
      'Time',
      s => s.code,
      s => (
        <div>
          {s.name}
          {s.name !== 'Total' ? (
            <Item as={Link} to={showPopulation(s.code, s.name, s)}>
              <Icon name="level up alternate" />
            </Item>
          ) : null}
        </div>
      )
    ),
    getSortableColumn('ATTEMPTS', 'Attempts', s => s.attempts),
    ...getGradeColumns(isGradeSeries, includesHTOrTT(stats))
  ]

  const data = getTableData(stats, isGradeSeries, isRelative)

  return (
    <div>
      <Header as="h3" textAlign="center">
        {name}
      </Header>
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
  isRelative: bool.isRequired
}

GradesTable.defaultProps = {
  separate: false
}

export default connect(null)(GradesTable)
