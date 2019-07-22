import React from 'react'
import { connect } from 'react-redux'
import { Table } from 'semantic-ui-react'
import { shape } from 'prop-types'
import selector from '../../selectors/oodilearnPopulations'

const GRADES = ['Hyl.', 'TT', 'HT', 'Hyv.', '0', '1', '2', '3', '4', '5']

const PopulationStats = ({ stats }) => (
  <Table structured celled textAlign="center" className="fixed-header">
    <Table.Header>
      <Table.Row>
        <Table.HeaderCell rowSpan={2} content="N" />
        <Table.HeaderCell colSpan={2} content="Credits" />
        <Table.HeaderCell colSpan={GRADES.length} content="Grades" />
      </Table.Row>
      <Table.Row>
        <Table.HeaderCell content="Total" />
        <Table.HeaderCell content="Average" />
        {GRADES.map(grade => (
          <Table.HeaderCell key={grade} content={grade} />
          ))}
      </Table.Row>
    </Table.Header>
    <Table.Body>
      <Table.Row>
        <Table.Cell content={stats.students} width={2} />
        <Table.Cell content={stats.credits.total} width={2} />
        <Table.Cell content={stats.credits.average} width={2} />
        {GRADES.map(grade => (
          <Table.Cell
            key={grade}
            content={stats.grades[grade] || 0}
            width={1}
          />
          ))}
      </Table.Row>
    </Table.Body>
  </Table>
)

PopulationStats.propTypes = {
  stats: shape({}).isRequired
}

const mapStateToProps = state => ({
  stats: selector.getFilteredPopulationStats(state)
})

export default connect(mapStateToProps)(PopulationStats)
