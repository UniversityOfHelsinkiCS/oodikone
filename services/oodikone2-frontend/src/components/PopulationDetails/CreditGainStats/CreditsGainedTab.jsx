import React from 'react'
import PropTypes from 'prop-types'
import { useLocation } from 'react-router-dom'
import { Table, Progress } from 'semantic-ui-react'
import { getMonths } from '../../../common/query'
import { getStudentTotalCredits } from '../../../common'
import ExternalCreditFilterToggle from './ExternalCreditFilterToggle'

const CreditsGainedTab = ({ filteredStudents }) => {
  const months = getMonths(useLocation())
  const creditList = filteredStudents.map(student => getStudentTotalCredits(student))

  const studentCount = (min, max = Infinity) =>
    max === 0
      ? creditList.filter(credits => credits === 0).length
      : creditList.filter(credits => credits < max && credits >= min).length

  const limits = [
    [Math.ceil(months * (55 / 12)), null],
    [Math.ceil(months * (50 / 12)), Math.ceil(months * (55 / 12))],
    [Math.ceil(months * (40 / 12)), Math.ceil(months * (50 / 12))],
    [Math.ceil(months * (30 / 12)), Math.ceil(months * (40 / 12))],
    [Math.ceil(months * (20 / 12)), Math.ceil(months * (30 / 12))],
    [Math.ceil(months * (10 / 12)), Math.ceil(months * (20 / 12))],
    [1, Math.ceil(months * (10 / 12))],
    [null, 0]
  ]

  return (
    <Table celled>
      <Table.Header>
        <Table.Row>
          <Table.HeaderCell collapsing></Table.HeaderCell>
          <Table.HeaderCell>Credits Gained During First {months} Months</Table.HeaderCell>
          <Table.HeaderCell>
            Number of Students
            <br />
            <span style={{ fontWeight: 100 }}>(n={filteredStudents.length})</span>
          </Table.HeaderCell>
          <Table.HeaderCell>Percentage of Population</Table.HeaderCell>
        </Table.Row>
      </Table.Header>

      <Table.Body>
        {limits.map(([min, max]) => (
          <Table.Row key={`table-row-${min}-${max}`}>
            <Table.Cell collapsing>
              <ExternalCreditFilterToggle min={min} max={max} />
            </Table.Cell>
            <Table.Cell>
              {max === 0 ? 0 : `${min} ≤ credits`}
              {max > 0 && ` < ${max}`}
            </Table.Cell>
            <Table.Cell>{studentCount(min, max)}</Table.Cell>
            <Table.Cell>
              {filteredStudents.length && (
                <Progress
                  percent={Math.round((studentCount(min, max) / filteredStudents.length) * 100)}
                  progress
                  className="credit-stats-progress-bar"
                />
              )}
            </Table.Cell>
          </Table.Row>
        ))}
      </Table.Body>
    </Table>
  )
}

CreditsGainedTab.propTypes = {
  filteredStudents: PropTypes.arrayOf(PropTypes.object).isRequired
}

export default CreditsGainedTab
