import React, { useState } from 'react'
import { Table } from 'semantic-ui-react'

import { ExpandableRow } from '@/components/FacultyStatistics/InteractiveDataView/ExpandableRow'
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
    <Table celled compact data-cy={cypress}>
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
                cypress={visibleYears[yearIndex] ? `Hide-${cypress}` : `Show-${cypress}`}
                icon={visibleYears[yearIndex] ? 'angle down' : 'angle right'}
                toggleVisibility={() => toggleVisibility(yearIndex)}
                yearArray={yearArray}
                yearIndex={yearIndex}
              />
            ) : (
              <Table.Row style={{ textAlign: 'right' }}>
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
                <Table.Cell colSpan={100} data-cy={`Cell-${cypress}-${yearIndex}`}>
                  <ProgrammeProgressChart
                    data={sortedKeys?.map(programme => programmeStats[programme][yearIndex])}
                    labels={sortedKeys}
                    longLabels={programmeNames}
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
