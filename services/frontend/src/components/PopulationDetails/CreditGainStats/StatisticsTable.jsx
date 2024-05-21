import _ from 'lodash'
import { Table } from 'semantic-ui-react'

import { getStudentTotalCredits } from '@/common'

const calculateMedian = arr => {
  const sortedArr = _.sortBy(arr)
  const midIndex = Math.floor(sortedArr.length / 2)
  return sortedArr.length % 2 !== 0 ? sortedArr[midIndex] : (sortedArr[midIndex - 1] + sortedArr[midIndex]) / 2
}

export const StatisticsTable = ({ filteredStudents, type }) => {
  if (!filteredStudents || !filteredStudents.length) return null
  const credits = filteredStudents.map(student => getStudentTotalCredits(student))
  const average = _.mean(credits)
  const median = calculateMedian(credits)
  const stdev = Math.sqrt(_.mean(credits.map(value => (value - average) ** 2)))

  return (
    <div className="statistics-table">
      <h3 style={{ marginBottom: '0.1em' }}>{type}</h3>
      <div data-cy="credit-stats-population-size">
        <em>n</em> = {credits.length}
      </div>
      <Table celled collapsing>
        <Table.Body>
          <Table.Row>
            <Table.Cell>Total credits</Table.Cell>
            <Table.Cell data-cy="credit-stats-total">{_.sum(credits).toFixed(2)}</Table.Cell>
          </Table.Row>
          <Table.Row>
            <Table.Cell>Average</Table.Cell>
            <Table.Cell data-cy="credit-stats-average">{average.toFixed(2)}</Table.Cell>
          </Table.Row>
          <Table.Row>
            <Table.Cell>Median</Table.Cell>
            <Table.Cell data-cy="credit-stats-median">{median.toFixed(2)}</Table.Cell>
          </Table.Row>
          <Table.Row>
            <Table.Cell>Standard deviation</Table.Cell>
            <Table.Cell data-cy="credit-stats-stdev">{stdev.toFixed(2)}</Table.Cell>
          </Table.Row>
          <Table.Row>
            <Table.Cell>Minimum</Table.Cell>
            <Table.Cell data-cy="credit-stats-min">{_.min(credits)}</Table.Cell>
          </Table.Row>
          <Table.Row>
            <Table.Cell>Maximum</Table.Cell>
            <Table.Cell data-cy="credit-stats-max">{_.max(credits)}</Table.Cell>
          </Table.Row>
        </Table.Body>
      </Table>
    </div>
  )
}
