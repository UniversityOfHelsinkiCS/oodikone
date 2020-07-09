import React, { useState } from 'react'
import { Table, Segment } from 'semantic-ui-react'
import { shape, arrayOf, any, string, number, func } from 'prop-types'
import { sortBy } from 'lodash'

const calculatePassrate = (pass, fail) => (100 * pass) / (pass + fail)

const TeacherStatisticsTable = ({ statistics, onClickFn }) => {
  const [selected, setSelected] = useState('credits')
  const [direction, setDirection] = useState('descending')

  const handleSort = column => () => {
    if (selected === column) {
      const newDirection = direction === 'ascending' ? 'descending' : 'ascending'
      setDirection(newDirection)
    } else {
      setSelected(column)
      setDirection('descending')
    }
  }

  const sortStatistics = statistics => {
    const formatted = statistics.map(stat => ({
      ...stat,
      passrate: calculatePassrate(stat.passed, stat.failed)
    }))
    const sorted = sortBy(formatted, selected)
    return direction === 'ascending' ? sorted : sorted.reverse()
  }

  const roundStatisticCredits = statistics =>
    statistics.map(s => ({
      ...s,
      credits: s.credits.toFixed(2)
    }))

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
            onClick={handleSort('name')}
            sorted={sortDirection('name')}
          />
          <Table.HeaderCell content="Credits" onClick={handleSort('credits')} sorted={sortDirection('credits')} />
          <Table.HeaderCell
            content="Credits transferred"
            onClick={handleSort('transferred')}
            sorted={sortDirection('transferred')}
          />
          <Table.HeaderCell content="Passed" onClick={handleSort('passrate')} sorted={sortDirection('passrate')} />
        </Table.Row>
      </Table.Header>
      <Table.Body>
        {roundStatisticCredits(sortStatistics(statistics)).map(({ id, name, credits, passrate, transferred }) => (
          <Table.Row key={id} onClick={() => onClickFn(id)} style={{ cursor: 'pointer' }}>
            <Table.Cell content={name} textAlign="left" />
            <Table.Cell content={credits} width={2} />
            <Table.Cell content={transferred} width={2} />
            <Table.Cell content={`${parseFloat(passrate).toFixed(2)} %`} width={2} />
          </Table.Row>
        ))}
      </Table.Body>
    </Table>
  )
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
