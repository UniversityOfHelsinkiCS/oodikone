import React, { useMemo } from 'react'
import PropTypes from 'prop-types'
import { useLocation } from 'react-router-dom'
import { Table } from 'semantic-ui-react'
import { getMonths } from '../../../common/query'
import { getStudentTotalCredits } from '../../../common'
import CollapsibleCreditRow from './CollapsibleCreditRow'

const CreditsGainedTab = ({ filteredStudents }) => {
  const months = getMonths(useLocation())
  const creditList = useMemo(() => filteredStudents.map(student => getStudentTotalCredits(student)), [filteredStudents])

  const studentCount = (min, max = Infinity) =>
    max === 0
      ? creditList.filter(credits => credits === 0).length
      : creditList.filter(credits => credits < max && credits >= min).length

  const limits = [
    [Math.ceil(months * (60 / 12))],
    [Math.ceil(months * (45 / 12)), Math.ceil(months * (60 / 12))],
    [Math.ceil(months * (30 / 12)), Math.ceil(months * (45 / 12))],
    [Math.ceil(months * (15 / 12)), Math.ceil(months * (30 / 12))],
    [1, Math.ceil(months * (15 / 12))],
    [null, 0],
  ]

  return (
    <Table celled>
      <Table.Header>
        <Table.Row>
          <Table.HeaderCell collapsing />
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
          <CollapsibleCreditRow
            key={`table-row-${min}-${max}`}
            min={min}
            max={max}
            studentCount={studentCount}
            filteredLength={filteredStudents.length}
            months={Number(months)}
          />
        ))}
      </Table.Body>
    </Table>
  )
}

CreditsGainedTab.propTypes = {
  filteredStudents: PropTypes.arrayOf(PropTypes.object).isRequired,
}

export default CreditsGainedTab
