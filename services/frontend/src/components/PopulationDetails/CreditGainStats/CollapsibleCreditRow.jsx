import React, { useState } from 'react'
import { Table, Progress, Icon } from 'semantic-ui-react'

import ExternalCreditFilterToggle from './ExternalCreditFilterToggle'

const CollapsibleCreditRow = ({ min, max, studentCount, filteredLength, months }) => {
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
      <Table.Row style={{ cursor: isCollapsible && 'pointer' }} onClick={isCollapsible ? () => collapse() : undefined}>
        <Table.Cell collapsing>
          <ExternalCreditFilterToggle min={min} max={max} />
        </Table.Cell>
        <Table.Cell key={`${min} ≤ credits`}>
          {max === 0 ? 0 : `${min} ≤ credits`}
          {max > 0 && ` < ${max}`}
          {isCollapsible && <Icon name={isCollapsed ? 'caret down' : 'caret right'} color="grey" />}
        </Table.Cell>
        <Table.Cell>{!isCollapsed && studentCount(min, max)}</Table.Cell>
        <Table.Cell>
          {filteredLength && !isCollapsed && (
            <Progress
              percent={Math.round((studentCount(min, max) / filteredLength) * 100)}
              progress
              className="credit-stats-progress-bar"
            />
          )}
        </Table.Cell>
      </Table.Row>
      {limits.map(([imin, imax]) => (
        <Table.Row style={{ backgroundColor: 'lightgray' }} key={`table-row-${imin}-${imax}`}>
          <Table.Cell collapsing>
            <div style={{ display: 'flex' }}>
              <ExternalCreditFilterToggle min={imin} max={imax} />
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
                percent={Math.round((studentCount(imin, imax) / filteredLength) * 100)}
                progress
                className="credit-stats-progress-bar"
              />
            )}
          </Table.Cell>
        </Table.Row>
      ))}
    </>
  )
}

export default CollapsibleCreditRow
