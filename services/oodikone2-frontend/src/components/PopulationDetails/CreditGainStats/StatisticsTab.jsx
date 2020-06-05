import React from 'react'
import { jStat } from 'jStat'
import { sortBy } from 'lodash'
import { func, arrayOf, object } from 'prop-types'
import { Table } from 'semantic-ui-react'
import { getStudentTotalCredits } from '../../../common'

const getStudentSampleInSplitQuartiles = students => {
  const sortedStudents = sortBy(students, student => getStudentTotalCredits(student))
  const quartileSize = Math.floor(sortedStudents.length / 4)
  return [
    sortedStudents.slice(0, quartileSize),
    sortedStudents.slice(quartileSize, quartileSize * 2),
    sortedStudents.slice(quartileSize * 2, quartileSize * 3),
    sortedStudents.slice(quartileSize * 3, sortedStudents.length)
  ]
}

const getValues = students => {
  const creditsList = students.map(student => getStudentTotalCredits(student))

  const n2z = value => (isNaN(value) ? 0 : value) // eslint-disable-line

  return {
    n: creditsList.length,
    min: n2z(jStat.min(creditsList)),
    max: n2z(jStat.max(creditsList)),
    average: n2z(jStat.mean(creditsList)).toFixed(2),
    median: n2z(jStat.median(creditsList)),
    standardDeviation: n2z(jStat.stdev(creditsList)).toFixed(2)
  }
}

const StatisticsTab = ({ translate, sample }) => {

  return (
    <Table celled collapsing className="statistics-table">
      <Table.Header>
        <Table.Row>
          <Table.HeaderCell>Statistic for n = 219 Students</Table.HeaderCell>
          <Table.HeaderCell>Credits Earned in First 35 Months</Table.HeaderCell>
        </Table.Row>
      </Table.Header>

      <Table.Body>
        <Table.Row>
          <Table.Cell>Average</Table.Cell>
          <Table.Cell>1</Table.Cell>
        </Table.Row>
        <Table.Row>
          <Table.Cell>Standard Deviation</Table.Cell>
          <Table.Cell>1</Table.Cell>
        </Table.Row>
        <Table.Row>
          <Table.Cell>Min</Table.Cell>
          <Table.Cell>1</Table.Cell>
        </Table.Row>
        <Table.Row>
          <Table.Cell>
            Q<sub>1</sub> (25%)
          </Table.Cell>
          <Table.Cell>1</Table.Cell>
        </Table.Row>
        <Table.Row>
          <Table.Cell>
            Q<sub>2</sub> (50%)
          </Table.Cell>
          <Table.Cell>1</Table.Cell>
        </Table.Row>
        <Table.Row>
          <Table.Cell>
            Q<sub>3</sub> (75%)
          </Table.Cell>
          <Table.Cell>1</Table.Cell>
        </Table.Row>
        <Table.Row>
          <Table.Cell>Max</Table.Cell>
          <Table.Cell>1</Table.Cell>
        </Table.Row>
      </Table.Body>
    </Table>
  )
}

StatisticsTab.propTypes = {
  translate: func.isRequired,
  sample: arrayOf(object).isRequired
}

export default StatisticsTab
