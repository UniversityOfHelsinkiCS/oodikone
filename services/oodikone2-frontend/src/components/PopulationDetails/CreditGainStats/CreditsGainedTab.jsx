import React, { useState, useMemo, useEffect } from 'react'
import PropTypes from 'prop-types'
import { useLocation } from 'react-router-dom'
import { Table, Progress } from 'semantic-ui-react'
import { getMonths } from '../../../common/query'
import { getStudentTotalCredits } from '../../../common'
import ExternalCreditFilterToggle from './ExternalCreditFilterToggle'
import { useIsAdmin } from '../../../common/hooks'

const CreditsGainedTab = ({ filteredStudents }) => {
  const isAdmin = useIsAdmin()
  const months = getMonths(useLocation())
  const creditList = useMemo(() => filteredStudents.map(student => getStudentTotalCredits(student)), [filteredStudents])

  const studentCount = (min, max = Infinity) =>
    max === 0
      ? creditList.filter(credits => credits === 0).length
      : creditList.filter(credits => credits < max && credits >= min).length

  const initialLimits = [
    [Math.ceil(months * (60 / 12))],
    [Math.ceil(months * (45 / 12)), Math.ceil(months * (60 / 12))],
    [Math.ceil(months * (30 / 12)), Math.ceil(months * (45 / 12))],
    [Math.ceil(months * (15 / 12)), Math.ceil(months * (30 / 12))],
    [0, Math.ceil(months * (15 / 12))]
    // [null, 0]
  ]

  const [limits, setLimits] = useState(initialLimits)
  const [collapsed, setCollapsed] = useState([])

  useEffect(() => {
    const factor = months * (5 / 12)
    const newLimits = []
    initialLimits.forEach(limit => {
      const max = limit[1]
      newLimits.push(limit)
      if (collapsed.includes(max)) {
        ;[0, 1, 2].forEach(n => {
          newLimits.push([Math.ceil(max - n * factor - factor), Math.ceil(max - n * factor), true])
        })
      }
    })

    setLimits(newLimits)
  }, [collapsed])

  const collapse = (min, max) => {
    if (!isAdmin) return
    if (min == null || max == null) return

    if (collapsed.includes(max)) {
      setCollapsed(collapsed.filter(c => c !== max))
    } else {
      setCollapsed(collapsed.concat(max))
    }
  }

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
        {limits.map(([min, max, sub]) => (
          <Table.Row
            style={{ backgroundColor: sub && 'lightgray' }}
            onClick={() => collapse(min, max)}
            key={`table-row-${min}-${max}`}
          >
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
