import React, { Component } from 'react'
import { Table } from 'semantic-ui-react'
import { shape } from 'prop-types'

class CreditStatsTable extends Component {
    state={}

    render() {
      const { statistics } = this.props
      return Object.keys(statistics).length === 0
        ? 'No statistics available. '
        : (
          <Table structured celled textAlign="center">
            <Table.Header>
              <Table.Row>
                <Table.HeaderCell rowSpan="2" content="Code" />
                <Table.HeaderCell rowSpan="2" content="Name" />
                <Table.HeaderCell colSpan="2" content="Passed" />
                <Table.HeaderCell colSpan="2" content="Failed" />
              </Table.Row>
              <Table.Row>
                <Table.HeaderCell content="Attainments" />
                <Table.HeaderCell content="Credits" />
                <Table.HeaderCell content="Attainments" />
                <Table.HeaderCell content="Credits" />
              </Table.Row>
            </Table.Header>
            <Table.Body>
              { Object.entries(statistics).map(([code, stat]) => (
                <Table.Row key={code}>
                  <Table.Cell content={stat.code} />
                  <Table.Cell content={stat.name.en} />
                  <Table.Cell content={stat.passed.attainments} />
                  <Table.Cell content={stat.passed.credits} />
                  <Table.Cell content={stat.failed.attainments} />
                  <Table.Cell content={stat.failed.attainments} />
                </Table.Row>
            ))}
            </Table.Body>
          </Table>
        )
    }
}

CreditStatsTable.propTypes = {
  statistics: shape({}).isRequired
}

export default CreditStatsTable
