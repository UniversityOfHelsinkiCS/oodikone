import React from 'react'
import { func, arrayOf, object } from 'prop-types'

import SearchResultTable from '../SearchResultTable'
import { getStudentFirstyearCredits } from '../../common'

const getValues = students => students.map(student => getStudentFirstyearCredits(student))

const PopulationCreditGainTable = (props) => {
  const { translate, sample } = props

  const stats = getValues(sample)

  const headers = [
    'Credits dained during first year',
    `Students (all=${stats.length})`,
    'Percentage of population'
  ]

  const rows = [
    ['55-', stats.filter(s => s >= 55).length, `${Math.round((stats.filter(s => s >= 55).length / stats.length) * 100)}%`],
    ['40-54', stats.filter(s => s >= 40 && s < 55).length, `${Math.round((stats.filter(s => s >= 40 && s < 55).length / stats.length) * 100)}%`],
    ['25-39', stats.filter(s => s >= 25 && s < 40).length, `${Math.round((stats.filter(s => s >= 25 && s < 40).length / stats.length) * 100)}%`],
    ['10-24', stats.filter(s => s >= 10 && s < 25).length, `${Math.round((stats.filter(s => s >= 10 && s < 25).length / stats.length) * 100)}%`],
    ['1-9', stats.filter(s => s >= 1 && s < 10).length, `${Math.round((stats.filter(s => s >= 1 && s < 10).length / stats.length) * 100)}%`],
    ['0', stats.filter(s => s === 0).length, `${Math.round((stats.filter(s => s === 0).length / stats.length) * 100)}%`]

  ]

  return (
    <SearchResultTable
      headers={headers}
      rows={rows}
      noResultText={translate('common.noResults')}
    />
  )
}

PopulationCreditGainTable.propTypes = {
  translate: func.isRequired,
  sample: arrayOf(object).isRequired
}

export default PopulationCreditGainTable
