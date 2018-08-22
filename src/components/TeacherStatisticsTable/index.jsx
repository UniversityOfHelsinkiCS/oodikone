import React, { Component } from 'react'
import { Table } from 'semantic-ui-react'
import { shape, arrayOf, any, string, number } from 'prop-types'

const passrate = (pass, fail) => parseFloat((100 * pass) / (pass + fail)).toFixed(2)

class TeacherStatisticsTable extends Component {
    state={}

    render() {
      const { statistics } = this.props
      return (statistics.length === 0 ? 'No statistics found for the given query.' :
      <Table structured celled textAlign="center" sortable>
        <Table.Header>
          <Table.Row>
            <Table.HeaderCell content="ID" />
            <Table.HeaderCell content="Name" textAlign="left" />
            <Table.HeaderCell content="Credits" />
            <Table.HeaderCell content="Passed" />
          </Table.Row>
        </Table.Header>
        <Table.Body>
          { statistics.map(({ id, name, credits, passed, failed }) => (
            <Table.Row key={id}>
              <Table.Cell content={id} width={1} />
              <Table.Cell content={name} textAlign="left" />
              <Table.Cell content={credits} width={2} />
              <Table.Cell content={`${passrate(passed, failed)} %`} width={2} />
            </Table.Row>
            ))}
        </Table.Body>
      </Table>
      )
    }
}

TeacherStatisticsTable.propTypes = {
  statistics: arrayOf(shape({
    id: any,
    name: string,
    credits: any,
    failed: number,
    passed: number
  })).isRequired
}

export default TeacherStatisticsTable
