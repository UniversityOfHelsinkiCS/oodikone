import React, { useState } from 'react'
import { Table, Progress, Icon } from 'semantic-ui-react'

import { ExternalCreditFilterToggle } from './ExternalCreditFilterToggle'

export const CollapsibleCreditRow = ({ min, max, studentCount, filteredLength, months }) => {
  const [limits, setLimits] = useState([])

  const collapse = () => {
    if (limits.length > 0) {
      setLimits([])
      return
    }

    const factor = months * (5 / 12)
    const newLimits = []
    ;[0, 1, 2].forEach(n => {
      const min = Math.ceil(max - n * factor - factor)
      newLimits.push([min === 0 ? 1 : min, Math.ceil(max - n * factor), true])
    })

    setLimits(newLimits)
  }

  const isCollapsed = limits.length > 0
  const isCollapsible = typeof min === 'number' && typeof max === 'number'

  return (
    <>
      <Table.Row onClick={isCollapsible ? () => collapse() : undefined} style={{ cursor: isCollapsible && 'pointer' }}>
        <Table.Cell collapsing>
          <ExternalCreditFilterToggle max={max} min={min} />
        </Table.Cell>
        <Table.Cell key={`${min} ≤ credits`}>
          {max === 0 ? 0 : `${min} ≤ credits`}
          {max > 0 && ` < ${max}`}
          {isCollapsible && <Icon color="grey" name={isCollapsed ? 'caret down' : 'caret right'} />}
        </Table.Cell>
        <Table.Cell>{!isCollapsed && studentCount(min, max)}</Table.Cell>
        <Table.Cell>
          {filteredLength && !isCollapsed && (
            <Progress
              className="credit-stats-progress-bar"
              percent={Math.round((studentCount(min, max) / filteredLength) * 100)}
              progress
            />
          )}
        </Table.Cell>
      </Table.Row>
      {limits.map(([imin, imax]) => (
        <Table.Row key={`table-row-${imin}-${imax}`} style={{ backgroundColor: 'lightgray' }}>
          <Table.Cell collapsing>
            <div style={{ display: 'flex' }}>
              <ExternalCreditFilterToggle max={imax} min={imin} />
            </div>
          </Table.Cell>
          <Table.Cell>
            {/* TODO NO NO NO NO */}
            <span style={{ color: 'lightgray', userSelect: 'none' }}>AAA</span>
            {imax === 0 ? 0 : `${imin} ≤ credits`}
            {imax > 0 && ` < ${imax}`}
          </Table.Cell>
          <Table.Cell>{studentCount(imin, imax)}</Table.Cell>
          <Table.Cell>
            {filteredLength && (
              <Progress
                className="credit-stats-progress-bar"
                percent={Math.round((studentCount(imin, imax) / filteredLength) * 100)}
                progress
              />
            )}
          </Table.Cell>
        </Table.Row>
      ))}
    </>
  )
}
