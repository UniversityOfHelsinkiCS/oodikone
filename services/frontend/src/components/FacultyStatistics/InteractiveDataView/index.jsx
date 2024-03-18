import React, { useEffect, useState } from 'react'
import { Table, Menu, Popup, Icon } from 'semantic-ui-react'
import { CollapsedStackedBar } from './CollapsedStackedBar'
import { ExpandableRow } from './ExpandableRow'

export const InteractiveDataTable = ({
  cypress,
  dataStats,
  dataProgrammeStats,
  programmeNames,
  sortedKeys,
  plotLinePlaces,
  titles,
  sliceStart,
  yearsVisible,
  shortNames,
  studentsTable,
}) => {
  const [keyOrder, setkeyOrder] = useState({})
  const [sorter, setSorter] = useState('Code')
  const [sortDir, setSortDir] = useState(1)
  const [sortbyColumn, setSortByColumn] = useState(0)
  const [columnIndex, setSelectedIndex] = useState(0)
  const [visible, setVisible] = useState(yearsVisible)

  // Note: sorting is happening inside of the degree levels, e.g. bachelors, masters, etc...
  const sortBySelectedColumn = () => {
    const keys = {}
    if (!(columnIndex === 0)) {
      const numbersOfYears = dataStats.length
      const data = sortedKeys?.map(programme => [programme, dataProgrammeStats[programme]])
      const groupIndices = plotLinePlaces.length > 0 ? plotLinePlaces.map(val => val[0]) : []
      for (let yearIndex = 0; yearIndex < numbersOfYears; yearIndex++) {
        let yearlySortedKeys = []
        if (groupIndices.length > 0) {
          for (let i = 0; i < groupIndices.length; i++) {
            const ending = i === groupIndices.length - 1 ? data.length : groupIndices[i + 1]
            yearlySortedKeys = [
              ...yearlySortedKeys,
              ...data
                .slice(groupIndices[i], ending)
                .sort((a, b) => {
                  if (sortDir === -1) return a[1][yearIndex][columnIndex] - b[1][yearIndex][columnIndex]
                  return b[1][yearIndex][columnIndex] - a[1][yearIndex][columnIndex]
                })
                .map(yearlyProgrammes => yearlyProgrammes[0]),
            ]
          }
        } else {
          yearlySortedKeys = data
            .sort((a, b) => {
              if (sortDir === -1) return a[1][yearIndex][columnIndex] - b[1][yearIndex][columnIndex]
              return b[1][yearIndex][columnIndex] - a[1][yearIndex][columnIndex]
            })
            .map(yearlyProgrammes => yearlyProgrammes[0])
        }
        keys[yearIndex] = yearlySortedKeys
      }
    }
    setkeyOrder(keys)
    setSortByColumn(columnIndex)
  }
  useEffect(sortBySelectedColumn, [columnIndex, dataStats, sortDir])

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
                .map((val, index) => val - programmeData[programme][yearIndex + 1][index + sliceStart])
            : new Array(programmeData[programme][yearIndex].length - sliceStart).fill(0)
        ),
      }),
      {}
    )
    return differenceMatrix
  }

  const handleClick = (sorterName, nameIndex) => {
    if (sorterName === sorter) setSortDir(-1 * sortDir)
    setSorter(sorterName)
    setSelectedIndex(nameIndex)
  }

  const toggleVisibility = yearIndex => {
    const arrayToModify = [...visible]
    arrayToModify[yearIndex] = !visible[yearIndex]
    setVisible(arrayToModify)
  }

  const sorterNames = shortNames || titles.map(title => (title === '' ? 'Code' : title))

  const differenceToPrevYears = calculatDiffToPrevYear(dataProgrammeStats)

  return (
    <div style={{ marginTop: '20px' }}>
      <Menu compact>
        <Menu.Item color="black" style={{ cursor: 'default', borderRadius: '1px', padding: '0 10px' }}>
          <Popup
            content="Sort bars in the yearly charts by programme code or other column values. Sort is done inside the degree group."
            trigger={
              <div>
                <Icon name="question circle" /> Sort by
              </div>
            }
          />
        </Menu.Item>
        {sorterNames.map((sorterName, nameIndex) => (
          <Menu.Item
            active={sorter === sorterName}
            color={sorter === sorterName ? 'blue' : 'black'}
            content={sorterName}
            data-cy={`Menu-${cypress}-${sorterName}`}
            icon={sortDir === 1 ? 'triangle down' : 'triangle up'}
            key={sorterName}
            onClick={() => handleClick(sorterName, nameIndex)}
            style={{ borderRadius: '1px', fontSize: '14px', padding: '0 10px' }}
          />
        ))}
      </Menu>
      <Table celled data-cy={`Table-${cypress}`}>
        <Table.Header>
          <Table.Row key={`random-header-row-${Math.random()}`} textAlign="center">
            {titles?.map(title => (
              <Table.HeaderCell key={title}>{title}</Table.HeaderCell>
            ))}
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {dataStats?.map((yearArray, yearIndex) => (
            <React.Fragment key={`random-fragment-key-${Math.random()}`}>
              <ExpandableRow
                cypress={visible[yearIndex] ? `Hide-${cypress}` : `Show-${cypress}`}
                icon={visible[yearIndex] ? 'angle down' : 'angle right'}
                toggleVisibility={() => toggleVisibility(yearIndex)}
                yearArray={yearArray}
                yearIndex={yearIndex}
              />
              <Table.Row key={`stack-row-key-${Math.random()}`} style={{ display: visible[yearIndex] ? '' : 'none' }}>
                <Table.Cell colSpan={100} data-cy={`Cell-${cypress}-${yearIndex}`} key={`stack-cell${Math.random()}`}>
                  <CollapsedStackedBar
                    data={
                      sortbyColumn === 0
                        ? sortedKeys
                            ?.map(programme =>
                              dataProgrammeStats[programme]
                                ? dataProgrammeStats[programme][yearIndex].slice(sliceStart)
                                : null
                            )
                            .filter(prog => !!prog)
                        : keyOrder[yearIndex]
                            ?.map(programme =>
                              dataProgrammeStats[programme]
                                ? dataProgrammeStats[programme][yearIndex].slice(sliceStart)
                                : null
                            )
                            .filter(prog => !!prog)
                    }
                    differenceData={Object.keys(differenceToPrevYears)?.reduce(
                      (yearlyObject, programme) => ({
                        ...yearlyObject,
                        [programme]: differenceToPrevYears[programme][yearIndex],
                      }),
                      {}
                    )}
                    labels={sortbyColumn === 0 ? sortedKeys : keyOrder[yearIndex]}
                    longLabels={programmeNames}
                    names={titles?.slice(sliceStart)}
                    plotLinePlaces={plotLinePlaces}
                    studentsTable={studentsTable}
                  />
                </Table.Cell>
              </Table.Row>
            </React.Fragment>
          ))}
        </Table.Body>
      </Table>
    </div>
  )
}
