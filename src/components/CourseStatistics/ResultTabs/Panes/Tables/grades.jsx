import React from 'react'
import { arrayOf, number, oneOfType, shape, string } from 'prop-types'
import { Header } from 'semantic-ui-react'
import SortableTable from '../../../SortableTable'
import { getGradeSpread } from '../util'

const getSortableColumn = (key, title, getRowVal, getRowContent) => (
  {
    key,
    title,
    getRowVal,
    getRowContent
  })

const getTableData = stats => stats.map(((stat) => {
  const { name, code, cumulative: { grades } } = stat
  const spread = getGradeSpread([grades])
  const attempts = Object.values(grades)
    .reduce((cur, acc) => (acc + cur), 0)
  return {
    name,
    code,
    attempts,
    ...spread
  }
}))


const GradesTable = ({ stats, name }) => {
  const columns = [
    getSortableColumn('TIME', 'Time', s => s.code, s => s.name),
    getSortableColumn('ATTEMPTS', 'Attempts', s => s.attempts),
    getSortableColumn('0', '0', s => s['0']),
    getSortableColumn('1', '1', s => s['1']),
    getSortableColumn('2', '2', s => s['2']),
    getSortableColumn('3', '3', s => s['3']),
    getSortableColumn('4', '4', s => s['4']),
    getSortableColumn('5', '5', s => s['5']),
    getSortableColumn('OTHER_PASSED', 'Other passed', s => s['Hyv.'])
  ]

  const data = getTableData(stats)

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
  name: oneOfType([number, string]).isRequired
}
export default GradesTable
