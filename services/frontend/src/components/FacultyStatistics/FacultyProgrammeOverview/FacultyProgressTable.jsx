import React, { useState } from 'react'
import { Table } from 'semantic-ui-react'
import { ProgrammeProgressChart } from './ProgrammeProgressChart'
import { BasicRow } from '../InteractiveDataView/BasicRow'

export const FacultyProgressTable = ({
  data,
  programmeStats,
  titles,
  sortedKeys,
  progressYearsVisible,
  programmeNames,
  cypress,
  progressTitles,
  needsExtra = 'NO EXTRA',
}) => {
  const [visible, setVisible] = useState(progressYearsVisible)
  if (!data) return null
  const toggleVisibility = yearIndex => {
    const arrayToModify = [...visible]
    arrayToModify[yearIndex] = !visible[yearIndex]
    setVisible(arrayToModify)
  }

  const lenOfYearArray = data.length - 1
  return (
    <div>
      <Table data-cy={cypress} compact celled>
        <Table.Header>
          <Table.Row key={`${cypress}-${Math.random()}`} textAlign="center">
            {titles?.map(title => (
              <Table.HeaderCell key={title}>{title}</Table.HeaderCell>
            ))}
          </Table.Row>
        </Table.Header>

        <Table.Body>
          {data?.map((yearArray, yearIndex) => (
            <React.Fragment key={`random-fragment-key-${Math.random()}`}>
              {yearIndex < lenOfYearArray ? (
                <BasicRow
                  icon={visible[yearIndex] ? 'angle down' : 'angle right'}
                  yearArray={yearArray}
                  cypress={visible[yearIndex] ? `Hide-${cypress}` : `Show-${cypress}`}
                  yearIndex={yearIndex}
                  toggleVisibility={() => toggleVisibility(yearIndex)}
                />
              ) : (
                <Table.Row>
                  {yearArray?.map(value => (
                    <Table.Cell key={`last-row-${Math.random()}`}>{value}</Table.Cell>
                  ))}
                </Table.Row>
              )}
              {yearIndex < lenOfYearArray ? (
                <Table.Row
                  key={`${cypress}-row-${Math.random()}`}
                  style={{ display: visible[yearIndex] ? '' : 'none' }}
                >
                  <Table.Cell data-cy={`Cell-${cypress}-${yearIndex}`} colSpan={100}>
                    <ProgrammeProgressChart
                      data={sortedKeys?.map(programme => programmeStats[programme][yearIndex])}
                      longLabels={programmeNames}
                      labels={sortedKeys}
                      names={progressTitles ? progressTitles[yearIndex] : titles?.slice(2)}
                      needsExtra={needsExtra === 'EXTRA HEIGHT'}
                    />
                  </Table.Cell>
                </Table.Row>
              ) : null}
            </React.Fragment>
          ))}
        </Table.Body>
      </Table>
    </div>
  )
}
