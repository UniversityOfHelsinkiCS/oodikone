import React from 'react'
import { Table } from 'semantic-ui-react'
import CollapsedStackedBar from './CollapsedStackedBar'
import ToggleTableView from './ToggleTableView'

const InteractiveDataTable = ({
  cypress,
  dataStats,
  dataProgrammeStats,
  programmeNames,
  sortedKeys,
  titles,
  wideTable,
  language,
  sliceStart,
  extraHeight,
}) => {
  if (!dataStats || !titles || !dataProgrammeStats) return null

  /* Calculation works as follows
   1. Calculate difference between current and previous year: current year - previous year
   2. Calculations are done for the values starting from the index 2 (index 0: year, index 1: total)
   3. Last year, currently 2017 is initialized to zeros
   4. A new object with programme names as keys and the difference array as value is created
  */
  const calculatDiffToPrevYear = programmeData => {
    const differenceMatrix = Object.keys(programmeData).reduce(
      (differenceMatrix, programme) => ({
        ...differenceMatrix,
        [programme]: programmeData[programme].map((_yearlyValues, yearIndex) =>
          yearIndex < programmeData[programme].length - 1
            ? programmeData[programme][yearIndex]
                .slice(sliceStart)
                .map((val, idx) => val - programmeData[programme][yearIndex + 1][idx + sliceStart])
            : new Array(programmeData[programme][yearIndex].length - sliceStart).fill(0)
        ),
      }),
      {}
    )
    return differenceMatrix
  }

  const differenceToPrevYears = calculatDiffToPrevYear(dataProgrammeStats)
  const yearRef = React.createRef()
  return (
    <div className={`table-container${wideTable ? '-wide' : ''}`}>
      <Table data-cy={`Table-${cypress}`} celled>
        <Table.Header>
          <Table.Row key={`randow-header-row-${Math.random()}`}>
            {titles?.map(title => (
              <Table.HeaderCell key={title}>{title}</Table.HeaderCell>
            ))}
          </Table.Row>
        </Table.Header>

        <Table.Body>
          {dataStats?.map((yearArray, yearIndex) => (
            <ToggleTableView
              yearArray={yearArray}
              cypress={cypress}
              yearIndex={yearIndex}
              ref={yearRef}
              key={`togglable-${Math.random()}`}
            >
              <Table.Cell data-cy={`Cell-${cypress}-${yearIndex}`} key={`stack-cell${Math.random()}`} colSpan={100}>
                <CollapsedStackedBar
                  data={sortedKeys?.map(programme => dataProgrammeStats[programme][yearIndex].slice(sliceStart))}
                  labels={sortedKeys}
                  differenceData={Object.keys(differenceToPrevYears)?.reduce(
                    (yearlyObject, programme) => ({
                      ...yearlyObject,
                      [programme]: differenceToPrevYears[programme][yearIndex],
                    }),
                    {}
                  )}
                  longLabels={programmeNames}
                  language={language}
                  names={titles?.slice(sliceStart)}
                  extraHeight={extraHeight}
                />
              </Table.Cell>
            </ToggleTableView>
          ))}
        </Table.Body>
      </Table>
    </div>
  )
}

export default InteractiveDataTable
