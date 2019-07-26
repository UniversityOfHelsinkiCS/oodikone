import React from 'react'
import qs from 'query-string'
import { arrayOf, number, oneOfType, shape, string } from 'prop-types'
import { Header, Icon } from 'semantic-ui-react'
import SortableTable from '../../../../SortableTable'
import { userIsAdmin } from '../../../../../common'
import { getGradeSpread, getThesisGradeSpread, isThesisGrades, THESIS_GRADE_KEYS } from '../util'

const getSortableColumn = (key, title, getRowVal, getRowContent) => (
  {
    key,
    title,
    getRowVal,
    getRowContent
  })

const getTableData = (stats, isGradeSeries) => stats.map(((stat) => {
  const { name, code, cumulative: { grades } } = stat

  const spread = isGradeSeries
    ? getGradeSpread([grades])
    : getThesisGradeSpread([grades])

  const attempts = Object.values(grades)
    .reduce((cur, acc) => (acc + cur), 0)
  return {
    name,
    code,
    attempts,
    ...spread
  }
}))

const getGradeColumns = isGradeSeries => (isGradeSeries
  ? [
    getSortableColumn('0', '0', s => s['0']),
    getSortableColumn('1', '1', s => s['1']),
    getSortableColumn('2', '2', s => s['2']),
    getSortableColumn('3', '3', s => s['3']),
    getSortableColumn('4', '4', s => s['4']),
    getSortableColumn('5', '5', s => s['5']),
    getSortableColumn('OTHER_PASSED', 'Other passed', s => s['Hyv.'])
  ]
  : THESIS_GRADE_KEYS.map(k => getSortableColumn(k, k, s => s[k]))
)

const GradesTable = ({ stats, name, history, coursecode }) => {
  const { cumulative: { grades } } = stats[0]
  const isGradeSeries = !isThesisGrades(grades)
  const admin = userIsAdmin()

  const showPopulation = (yearcode) => {
    const queryObject = { yearcode, coursecode }
    const searchString = qs.stringify(queryObject)
    history.push(`/coursepopulation?${searchString}`)
  }

  const columns = [
    getSortableColumn('TIME', 'Time', s => s.code, s => (admin ? (<div>{s.name}<Icon name="level up alternate" onClick={() => showPopulation(s.code)} /></div>) : s.name)),
    getSortableColumn('ATTEMPTS', 'Attempts', s => s.attempts),
    ...getGradeColumns(isGradeSeries)
  ]

  const data = getTableData(stats, isGradeSeries)

  return (
    <div>
      <Header as="h3" content={name} textAlign="center" />
      <SortableTable
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
  coursecode: string.isRequired,
  history: shape({}).isRequired
}
export default GradesTable
