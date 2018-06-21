import React from 'react'
import { connect } from 'react-redux'
import { func, arrayOf, object, number } from 'prop-types'
import { Progress } from 'semantic-ui-react'
import SearchResultTable from '../SearchResultTable'
import { getStudentTotalCredits } from '../../common'

const getTotal = students => students.map(student => getStudentTotalCredits(student))

const expectedAmountOfCredits = months => ([
  [months * 5],
  [months * 4, (months * 5) - 1],
  [months * 3, (months * 4) - 1],
  [months * 2, (months * 3) - 1],
  [months * 1, (months * 2) - 1],
  [1, (months * 1) - 1],
  [0, 0]
])

const filterStudents = (students, minCredits, maxCredits = Infinity) => {
  if (minCredits === 0) {
    return {
      minCredits: '',
      maxCredits,
      amount: students.filter(s => s === minCredits).length
    }
  } else if (maxCredits === Infinity) {
    return {
      minCredits,
      maxCredits: '',
      amount: students.filter(s => s >= minCredits).length
    }
  }
  return {
    minCredits,
    maxCredits,
    amount: students.filter(s => s >= minCredits && s < maxCredits).length
  }
}

const PopulationCreditGainTable = (props) => {
  const { translate, sample, months } = props
  const stats = getTotal(sample)
  const limits = expectedAmountOfCredits(months)
  const arr = limits.map(l => filterStudents(stats, ...l))
  const rows = arr.map(a => [`${a.minCredits}-${a.maxCredits}`, a.amount, <Progress percent={Math.round((a.amount / stats.length) * 100)} progress />])
  const headers = [
    `Credits gained during first ${months} months`,
    `Students (all=${stats.length})`,
    'Percentage of population'
  ]

  return (
    <SearchResultTable
      headers={headers}
      rows={rows}
      noResultText={translate('common.noResults')}
    />
  )
}

const mapStateToProps = state => ({
  months: state.populations.query.months
})

PopulationCreditGainTable.propTypes = {
  translate: func.isRequired,
  sample: arrayOf(object).isRequired,
  months: number.isRequired
}

export default connect(mapStateToProps)(PopulationCreditGainTable)
