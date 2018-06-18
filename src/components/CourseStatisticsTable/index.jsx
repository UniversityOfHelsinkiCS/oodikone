import React from 'react'
import PropTypes from 'prop-types'
import { Table } from 'semantic-ui-react'

const { shape, arrayOf } = PropTypes


const CourseStatisticsTable = ({ stats }) =>
  (
    <Table>
      <Table.Header>
        <Table.Row>
          <Table.HeaderCell>
            Time
          </Table.HeaderCell>
          <Table.HeaderCell>
            Passed Students
          </Table.HeaderCell>
          <Table.HeaderCell>
            Failed Students
          </Table.HeaderCell>
          <Table.HeaderCell>
            Failure %
          </Table.HeaderCell>
        </Table.Row>
      </Table.Header>
      <Table.Body>
        {stats.map(year => (
          <Table.Row key={year.time}>
            <Table.Cell>
              {year.time}
            </Table.Cell>
            <Table.Cell>
              {year.passed}
            </Table.Cell>
            <Table.Cell>
              {year.failed}
            </Table.Cell>
            <Table.Cell>
              {Math.round((year.failed /
                (year.passed + year.failed)) * 100) / 100}
            </Table.Cell>
          </Table.Row>
        ))}

      </Table.Body>
    </Table>
  )


CourseStatisticsTable.propTypes = {
  stats: arrayOf(shape({})).isRequired
}

export default CourseStatisticsTable
