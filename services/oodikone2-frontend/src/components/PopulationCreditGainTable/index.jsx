import React, { useCallback } from 'react'
import { connect } from 'react-redux'
import { func, arrayOf, object, number } from 'prop-types'
import { Progress } from 'semantic-ui-react'
import SearchResultTable from '../SearchResultTable'
import { getStudentTotalCredits } from '../../common'
import TSA from '../../common/tsa'

import { creditsLessThan, creditsAtLeast } from '../../populationFilters'
import { setPopulationFilter, removePopulationFilter } from '../../redux/populationFilters'

const getTotal = students => students.map(student => getStudentTotalCredits(student))

const expectedAmountOfCredits = months => [
  [Math.ceil(months * (55 / 12))],
  [Math.ceil(months * (50 / 12)), Math.ceil(months * (55 / 12))],
  [Math.ceil(months * (40 / 12)), Math.ceil(months * (50 / 12))],
  [Math.ceil(months * (30 / 12)), Math.ceil(months * (40 / 12))],
  [Math.ceil(months * (20 / 12)), Math.ceil(months * (30 / 12))],
  [Math.ceil(months * (10 / 12)), Math.ceil(months * (20 / 12))],
  [1, Math.ceil(months * (10 / 12))],
  [0, 0]
]

const filterStudents = (students, minCredits, maxCredits = Infinity) => {
  if (minCredits === 0) {
    return {
      minCredits: '',
      maxCredits,
      amount: students.filter(s => s === minCredits).length
    }
  }
  if (maxCredits === Infinity) {
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

const PopulationCreditGainTable = ({
  translate,
  sample,
  months,
  filters,
  setPopulationFilter,
  removePopulationFilter
}) => {
  const handleCreditBracketRowClicked = useCallback(
    (e, row) => {
      // clear filters & set credit filter for selected range
      TSA.Matomo.sendEvent('Population statistics', '"Credits gained during" row selected', row[0])
      filters.forEach(filter => removePopulationFilter(filter.id))

      const credits = row[0].split(/(\d+)/).map(count => Number(count))
      if (credits[1]) {
        setPopulationFilter(creditsAtLeast({ credit: credits[1] }))
        if (credits[3]) {
          setPopulationFilter(creditsLessThan({ credit: credits[3] }))
        }
      } else {
        setPopulationFilter(creditsLessThan({ credit: 1 }))
      }
    },
    [filters, removePopulationFilter, setPopulationFilter]
  )

  const stats = getTotal(sample)
  const limits = expectedAmountOfCredits(months)
  const arr = limits.map(l => filterStudents(stats, ...l))

  const rows = arr.map(a => {
    if (a.maxCredits === 0) {
      return [
        `${a.maxCredits}`,
        a.amount,
        <Progress
          style={{ margin: '0px' }}
          percent={stats.length === 0 ? 0 : Math.round((a.amount / stats.length) * 100)}
          progress
        />
      ]
    }
    if (a.maxCredits) {
      return [
        `${a.minCredits} ≤ credits < ${a.maxCredits}`,
        a.amount,
        <Progress
          style={{ margin: '0px' }}
          percent={stats.length === 0 ? 0 : Math.round((a.amount / stats.length) * 100)}
          progress
        />
      ]
    }
    return [
      `${a.minCredits} ≤ credits`,
      a.amount,
      <Progress
        style={{ margin: '0px' }}
        percent={stats.length === 0 ? 0 : Math.round((a.amount / stats.length) * 100)}
        progress
      />
    ]
  })

  const headers = [
    `Credits gained during first ${months} months`,
    `Students (all=${stats.length})`,
    'Percentage of population'
  ]
  return (
    <SearchResultTable
      headers={headers}
      rows={rows}
      selectable
      rowClickFn={handleCreditBracketRowClicked}
      noResultText={translate('common.noResults')}
    />
  )
}

const mapStateToProps = state => ({
  months: state.populations.query.months,
  filters: state.populationFilters.filters.filter(f => f.type === 'CreditsLessThan' || f.type === 'CreditsAtLeast')
})

PopulationCreditGainTable.propTypes = {
  translate: func.isRequired,
  sample: arrayOf(object).isRequired,
  months: number.isRequired,
  setPopulationFilter: func.isRequired,
  removePopulationFilter: func.isRequired,
  filters: arrayOf(object).isRequired
}

export default connect(
  mapStateToProps,
  { setPopulationFilter, removePopulationFilter }
)(PopulationCreditGainTable)
