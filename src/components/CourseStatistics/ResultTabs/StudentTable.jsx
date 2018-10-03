import React from 'react'
import { Table, Header } from 'semantic-ui-react'
import { shape, string, number, oneOfType, arrayOf } from 'prop-types'

const StudentTable = ({ stats, name }) => (
  <div>
    <Header as="h3" content={name} textAlign="center" />
    <Table>
      <Table.Header>
        <Table.Row>
          <Table.HeaderCell content="Time" />
          <Table.HeaderCell content="Passed on first try" />
          <Table.HeaderCell content="Passed after retry" />
          <Table.HeaderCell content="Failed on first try" />
          <Table.HeaderCell content="Failed after retry" />
        </Table.Row>
      </Table.Header>
      <Table.Body>
        {stats.map(stat => (
          <Table.Row key={stat.code}>
            <Table.Cell content={stat.name} singleLine />
            <Table.Cell content={stat.students.categories.passedFirst || 0} />
            <Table.Cell content={stat.students.categories.passedRetry || 0} />
            <Table.Cell content={stat.students.categories.failedFirst || 0} />
            <Table.Cell content={stat.students.categories.failedRetry || 0} />
          </Table.Row>
          ))}
      </Table.Body>
    </Table>
  </div>
)

StudentTable.propTypes = {
  stats: arrayOf(shape({})).isRequired,
  name: oneOfType([number, string]).isRequired
}

export default StudentTable
