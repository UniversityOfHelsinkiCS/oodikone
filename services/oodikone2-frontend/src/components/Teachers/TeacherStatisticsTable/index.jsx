import React, { Component } from 'react'
import { Table, Segment } from 'semantic-ui-react'
import { shape, arrayOf, any, string, number, func } from 'prop-types'
import { sortBy } from 'lodash'

const calculatePassrate = (pass, fail) => (100 * pass) / (pass + fail)

class TeacherStatisticsTable extends Component {
  state = {
    selected: 'credits',
    direction: 'descending'
  }

  handleSort = column => () => {
    const { selected, direction } = this.state
    if (selected === column) {
      this.setState({
        direction: direction === 'ascending' ? 'descending' : 'ascending'
      })
    } else {
      this.setState({
        selected: column,
        direction: 'descending'
      })
    }
  }

  sortStatistics = statistics => {
    const { selected, direction } = this.state
    const formatted = statistics.map(stat => ({
      ...stat,
      passrate: calculatePassrate(stat.passed, stat.failed)
    }))
    const sorted = sortBy(formatted, selected)
    return direction === 'ascending' ? sorted : sorted.reverse()
  }

  roundStatisticCredits = statistics =>
    statistics.map(s => ({
      ...s,
      credits: s.credits.toFixed(2)
    }))

  render() {
    const { statistics, onClickFn } = this.props
    const { selected, direction } = this.state

    const sortDirection = name => (selected === name ? direction : null)

    return statistics.length === 0 ? (
      <Segment basic content="No statistics found for the given query." />
    ) : (
      <Table structured celled textAlign="center" sortable selectable className="fixed-header">
        <Table.Header>
          <Table.Row>
            <Table.HeaderCell
              content="Name"
              textAlign="left"
              onClick={this.handleSort('name')}
              sorted={sortDirection('name')}
            />
            <Table.HeaderCell
              content="Credits"
              onClick={this.handleSort('credits')}
              sorted={sortDirection('credits')}
            />
            <Table.HeaderCell
              content="Credits transferred"
              onClick={this.handleSort('transferred')}
              sorted={sortDirection('transferred')}
            />
            <Table.HeaderCell
              content="Passed"
              onClick={this.handleSort('passrate')}
              sorted={sortDirection('passrate')}
            />
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {this.roundStatisticCredits(this.sortStatistics(statistics)).map(
            ({ id, name, credits, passrate, transferred }) => (
              <Table.Row key={id} onClick={() => onClickFn(id)} style={{ cursor: 'pointer' }}>
                <Table.Cell content={name} textAlign="left" />
                <Table.Cell content={credits} width={2} />
                <Table.Cell content={transferred} width={2} />
                <Table.Cell content={`${parseFloat(passrate).toFixed(2)} %`} width={2} />
              </Table.Row>
            )
          )}
        </Table.Body>
      </Table>
    )
  }
}
TeacherStatisticsTable.propTypes = {
  statistics: arrayOf(
    shape({
      id: any,
      name: string,
      transferred: number,
      credits: any,
      failed: number,
      passed: number
    })
  ).isRequired,
  onClickFn: func.isRequired
}

export default TeacherStatisticsTable
