import React from 'react'
import PropTypes from 'prop-types'
import { Table } from 'semantic-ui-react'

const { shape, arrayOf } = PropTypes

const CourseStatisticsTable = ({ stats }) =>
  ((stats.some(year => year.c_passed > 0) || stats.some(year => year.c_failed > 0)) ?
    (
      <Table celled padded>
        <Table.Header>
          <Table.Row>
            <Table.HeaderCell colSpan={4}>Programme</Table.HeaderCell>
            <Table.HeaderCell colSpan={3}>Compared</Table.HeaderCell>
          </Table.Row>
          <Table.Row>
            <Table.HeaderCell>Time</Table.HeaderCell>
            <Table.HeaderCell>Passed Students</Table.HeaderCell>
            <Table.HeaderCell>Failed Students</Table.HeaderCell>
            <Table.HeaderCell>Pass rate</Table.HeaderCell>
            <Table.HeaderCell>Passed Students</Table.HeaderCell>
            <Table.HeaderCell>Failed Students</Table.HeaderCell>
            <Table.HeaderCell>Pass rate</Table.HeaderCell>

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
                {`${year.passed + year.failed > 0 ? Math.round((year.passed /
                  (year.passed + year.failed)) * 100) : 0} %`}
              </Table.Cell>
              <Table.Cell>
                {year.c_passed}
              </Table.Cell>
              <Table.Cell>
                {year.c_failed}
              </Table.Cell>
              <Table.Cell>
                {`${year.c_passed + year.c_failed > 0 ? Math.round((year.c_passed /
                  (year.c_passed + year.c_failed)) * 100) : 0} %`}
              </Table.Cell>
            </Table.Row>
          ))}

        </Table.Body>
      </Table>
    )
    :
    (
      <Table>
        <Table.Header>
          <Table.Row>
            <Table.HeaderCell>Time</Table.HeaderCell>
            <Table.HeaderCell>Passed Students</Table.HeaderCell>
            <Table.HeaderCell>Failed Students</Table.HeaderCell>
            <Table.HeaderCell>Pass rate</Table.HeaderCell>
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
                {`${year.passed + year.failed > 0 ? Math.round((year.passed /
                  (year.passed + year.failed)) * 100) : 0} %`}
              </Table.Cell>
            </Table.Row>
          ))}

        </Table.Body>
      </Table>
    ))

CourseStatisticsTable.propTypes = {
  stats: arrayOf(shape({})).isRequired
}

export default CourseStatisticsTable
