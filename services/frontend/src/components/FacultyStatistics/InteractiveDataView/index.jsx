import React, { useEffect, useState } from 'react'
import { Table, Menu } from 'semantic-ui-react'
import CollapsedStackedBar from './CollapsedStackedBar'
import BasicRow from './BasicRow'

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
  yearsVisible,
}) => {
  const [keyOrder, setkeyOrder] = useState({})
  const [sorter, setSorter] = useState('Programme')
  const [sortDir, setSortDir] = useState(1)
  const [sortbyColumn, setSortByColumn] = useState(0)
  const [columnIndex, setSelectedIndex] = useState(0)
  const [visible, setVisible] = useState(yearsVisible)

  const sortBySelectedColumn = () => {
    const keys = {}
    if (!(columnIndex === 0)) {
      const numbersOfYears = dataStats.length
      const data = Object.entries(dataProgrammeStats)
      for (let yearIdx = 0; yearIdx < numbersOfYears; yearIdx++) {
        const yearlySortedKeys = data
          .sort((a, b) => {
            if (sortDir === -1) return a[1][yearIdx][columnIndex] - b[1][yearIdx][columnIndex]
            return b[1][yearIdx][columnIndex] - a[1][yearIdx][columnIndex]
          })
          .map(yearlyProgrammes => yearlyProgrammes[0])
        keys[yearIdx] = yearlySortedKeys
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
                .map((val, idx) => val - programmeData[programme][yearIndex + 1][idx + sliceStart])
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

  const sorterNames = titles.map(title => (title === '' ? 'Programme' : title))

  const differenceToPrevYears = calculatDiffToPrevYear(dataProgrammeStats)

  return (
    <div>
      <Menu compact>
        <Menu.Item style={{ cursor: 'default' }} active color="black">
          Sort by:
        </Menu.Item>
        {sorterNames.map((sorterName, nameIndex) => (
          <Menu.Item
            position="left"
            color={sorter === sorterName ? 'blue' : 'black'}
            key={sorterName}
            active={sorter === sorterName}
            onClick={() => handleClick(sorterName, nameIndex)}
            style={{ borderRadius: '1px', fontSize: '16px', padding: '5px' }}
            icon={sortDir === 1 ? 'triangle down' : 'triangle up'}
            content={sorterName}
          />
        ))}
      </Menu>
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
              <React.Fragment key={`random-fragment-key-${Math.random()}`}>
                <BasicRow
                  icon={visible[yearIndex] ? 'chevron down' : 'chevron right'}
                  yearArray={yearArray}
                  cypress={visible[yearIndex] ? `Hide-${cypress}` : `Show-${cypress}`}
                  yearIndex={yearIndex}
                  toggleVisibility={() => toggleVisibility(yearIndex)}
                />
                <Table.Row key={`stack-row-key-${Math.random()}`} style={{ display: visible[yearIndex] ? '' : 'none' }}>
                  <Table.Cell data-cy={`Cell-${cypress}-${yearIndex}`} key={`stack-cell${Math.random()}`} colSpan={100}>
                    <CollapsedStackedBar
                      data={
                        sortbyColumn === 0
                          ? sortedKeys?.map(programme => dataProgrammeStats[programme][yearIndex].slice(sliceStart))
                          : keyOrder[yearIndex]?.map(programme =>
                              dataProgrammeStats[programme][yearIndex].slice(sliceStart)
                            )
                      }
                      labels={sortbyColumn === 0 ? sortedKeys : keyOrder[yearIndex]}
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
                </Table.Row>
              </React.Fragment>
            ))}
          </Table.Body>
        </Table>
      </div>
    </div>
  )
}

export default InteractiveDataTable
