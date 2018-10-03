import React from 'react'
import { Table, Header } from 'semantic-ui-react'
import { shape, string, number, oneOfType, arrayOf } from 'prop-types'

const CumulativeTable = ({ stats, name }) => (
  <div>
    <Header as="h3" content={name} textAlign="center" />
    <Table>
      <Table.Header>
        <Table.Row>
          <Table.HeaderCell content="Time" />
          <Table.HeaderCell content="Passed" />
          <Table.HeaderCell content="Failed" />
          <Table.HeaderCell content="Pass rate" />
        </Table.Row>
      </Table.Header>
      <Table.Body>
        {stats.map(stat => (
          <Table.Row key={stat.code}>
            <Table.Cell content={stat.name} />
            <Table.Cell content={stat.cumulative.categories.passed || 0} />
            <Table.Cell content={stat.cumulative.categories.failed || 0} />
            <Table.Cell content={`${Number((100 * stat.cumulative.categories.passed) /
            (stat.cumulative.categories.failed + stat.cumulative.categories.passed)).toFixed(2)} %`}
            />
          </Table.Row>
          ))}
      </Table.Body>
    </Table>
  </div>
)

CumulativeTable.propTypes = {
  stats: arrayOf(shape({})).isRequired,
  name: oneOfType([number, string]).isRequired
}

export default CumulativeTable
