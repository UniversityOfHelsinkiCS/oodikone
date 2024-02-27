import _ from 'lodash'
import React from 'react'
import { Table } from 'semantic-ui-react'

import { getStudentTotalCredits } from '@/common'

export const StatisticsTable = ({ filteredStudents, type }) => {
  if (!filteredStudents || !filteredStudents.length) return null
  const credits = filteredStudents.map(student => getStudentTotalCredits(student))
  const formatNumber = (x, decimals) => (Number.isNaN(x) || !x ? 0 : x).toFixed(decimals)
  const mean = _.mean(credits)
  const stdev = Math.sqrt(_.sum(_.map(credits, c => (c - mean) * (c - mean))) / credits.length)

  return (
    <div className="statistics-table">
      <h3>{type}</h3>
      <Table celled collapsing>
        <Table.Header>
          <Table.Row>
            <Table.HeaderCell data-cy="credit-stats-table-name-header">
              {`Statistic for n = ${credits.length} Students`}
            </Table.HeaderCell>
            <Table.HeaderCell>Credits Earned</Table.HeaderCell>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          <Table.Row>
            <Table.Cell>Total</Table.Cell>
            <Table.Cell data-cy="credit-stats-total">{formatNumber(_.sum(credits))}</Table.Cell>
          </Table.Row>
          <Table.Row>
            <Table.Cell>Average</Table.Cell>
            <Table.Cell data-cy="credit-stats-mean">{formatNumber(mean, 2)}</Table.Cell>
          </Table.Row>
          <Table.Row>
            <Table.Cell>Standard Deviation</Table.Cell>
            <Table.Cell data-cy="credit-stats-stdev">{formatNumber(stdev, 2)}</Table.Cell>
          </Table.Row>
          <Table.Row>
            <Table.Cell>Min</Table.Cell>
            <Table.Cell data-cy="credit-stats-min">{formatNumber(_.min(credits), 0)}</Table.Cell>
          </Table.Row>
          <Table.Row>
            <Table.Cell>Max</Table.Cell>
            <Table.Cell data-cy="credit-stats-max">{formatNumber(_.max(credits), 0)}</Table.Cell>
          </Table.Row>
        </Table.Body>
      </Table>
    </div>
  )
}
