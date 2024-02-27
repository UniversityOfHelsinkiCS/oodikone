import React, { useState } from 'react'
import { Table } from 'semantic-ui-react'

import { ExpandableRow } from '../InteractiveDataView/ExpandableRow'
import { ProgrammeProgressChart } from './ProgrammeProgressChart'

export const FacultyProgressTable = ({
  data,
  programmeStats,
  titles,
  sortedKeys,
  programmeNames,
  cypress,
  progressTitles,
}) => {
  const [visibleYears, setVisibleYears] = useState(new Array(data.length).fill(false))
  const toggleVisibility = yearIndex => {
    setVisibleYears(visibleYears.map((year, index) => (index === yearIndex ? !year : year)))
  }

  const isTotalRow = yearArray => yearArray[0].toLowerCase() === 'total'

  return (
    <Table data-cy={cypress} compact celled>
      <Table.Header>
        <Table.Row textAlign="center">
          {titles.map(title => (
            <Table.HeaderCell key={title}>{title}</Table.HeaderCell>
          ))}
        </Table.Row>
      </Table.Header>

      <Table.Body>
        {data.map((yearArray, yearIndex) => (
          <React.Fragment key={yearArray[0]}>
            {!isTotalRow(yearArray) ? (
              <ExpandableRow
                icon={visibleYears[yearIndex] ? 'angle down' : 'angle right'}
                yearArray={yearArray}
                cypress={visibleYears[yearIndex] ? `Hide-${cypress}` : `Show-${cypress}`}
                yearIndex={yearIndex}
                toggleVisibility={() => toggleVisibility(yearIndex)}
              />
            ) : (
              <Table.Row>
                {yearArray.map((value, index) => (
                  /* eslint-disable-next-line react/no-array-index-key */
                  <Table.Cell className="total-row-cell" key={`${index}-${value}`}>
                    {value}
                  </Table.Cell>
                ))}
              </Table.Row>
            )}
            {!isTotalRow(yearArray) && (
              <Table.Row style={{ display: visibleYears[yearIndex] ? '' : 'none' }}>
                <Table.Cell data-cy={`Cell-${cypress}-${yearIndex}`} colSpan={100}>
                  <ProgrammeProgressChart
                    data={sortedKeys?.map(programme => programmeStats[programme][yearIndex])}
                    longLabels={programmeNames}
                    labels={sortedKeys}
                    names={progressTitles ? progressTitles[yearIndex] : titles.slice(2)}
                  />
                </Table.Cell>
              </Table.Row>
            )}
          </React.Fragment>
        ))}
      </Table.Body>
    </Table>
  )
}
