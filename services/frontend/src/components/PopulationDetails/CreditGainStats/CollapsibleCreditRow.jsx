import { useState } from 'react'
import { Table, Icon } from 'semantic-ui-react'

import { ProgressBarWithLabel } from '@/components/common/ProgressBarWithLabel'
import { ExternalCreditFilterToggle } from './ExternalCreditFilterToggle'

export const CollapsibleCreditRow = ({
  min,
  max,
  getStudentsInCreditCategory,
  filteredLength,
  months,
  monthsFromStart,
  studyPlanFilterIsActive,
}) => {
  const [limits, setLimits] = useState([])

  const collapse = () => {
    if (limits.length > 0) {
      setLimits([])
      return
    }

    const factor = months * (5 / 12)
    const newLimits = [0, 1, 2].reduce((acc, n) => {
      const min = Math.ceil(max - n * factor - factor)
      acc.push([min === 0 ? 1 : min, Math.ceil(max - n * factor), true])
      return acc
    }, [])

    setLimits(newLimits)
  }

  const isCollapsed = limits.length > 0
  const isCollapsible = typeof min === 'number' && typeof max === 'number'
  const categoryStudents = getStudentsInCreditCategory(min, max)
  const filterHelpText = studyPlanFilterIsActive
    ? 'Rajaa opiskelijat HOPSiin sijoitettujen suoritusten perusteella'
    : `Rajaa opiskelijat ensimmäisen ${monthsFromStart} kuukauden aikana saatujen opintopisteiden perusteella`

  return (
    <>
      <Table.Row onClick={isCollapsible ? collapse : undefined} style={{ cursor: isCollapsible && 'pointer' }}>
        <Table.Cell collapsing>
          <ExternalCreditFilterToggle helpText={filterHelpText} students={categoryStudents} />
        </Table.Cell>
        <Table.Cell key={`${min} ≤ credits`}>
          {max === 0 ? 0 : `${min} ≤ credits`}
          {max > 0 && ` < ${max}`}
          {isCollapsible && <Icon color="grey" name={isCollapsed ? 'caret down' : 'caret right'} />}
        </Table.Cell>
        <Table.Cell>{!isCollapsed && categoryStudents.length}</Table.Cell>
        <Table.Cell>
          {filteredLength && !isCollapsed && (
            <ProgressBarWithLabel total={filteredLength} value={categoryStudents.length} />
          )}
        </Table.Cell>
      </Table.Row>
      {limits.map(([imin, imax]) => {
        const categoryStudents = getStudentsInCreditCategory(imin, imax)
        return (
          <Table.Row key={`table-row-${imin}-${imax}`} style={{ backgroundColor: '#e1e1e1' }}>
            <Table.Cell collapsing>
              <ExternalCreditFilterToggle helpText={filterHelpText} students={categoryStudents} />
            </Table.Cell>
            <Table.Cell style={{ paddingLeft: '2em' }}>
              {imax === 0 ? 0 : `${imin} ≤ credits`}
              {imax > 0 && ` < ${imax}`}
            </Table.Cell>
            <Table.Cell>{categoryStudents.length}</Table.Cell>
            <Table.Cell>
              {filteredLength && <ProgressBarWithLabel total={filteredLength} value={categoryStudents.length} />}
            </Table.Cell>
          </Table.Row>
        )
      })}
    </>
  )
}
