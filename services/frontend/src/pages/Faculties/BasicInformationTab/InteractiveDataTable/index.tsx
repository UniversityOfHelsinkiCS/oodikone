import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TableSortLabel } from '@mui/material'
import { Fragment, useState } from 'react'

import { facultyToolTips } from '@/common/InfoToolTips'
import { ExpandableRow } from '@/components/material/ExpandableRow'
import { InfoBox } from '@/components/material/InfoBox'
import { Section } from '@/components/material/Section'
import { NameWithCode } from '@/shared/types'
import { CollapsedStackedBar } from './CollapsedStackedBar'

export const InteractiveDataTable = ({
  cypress,
  dataProgrammeStats,
  dataStats,
  plotLinePlaces = [],
  programmeNames,
  shortNames,
  sliceStart,
  sortedKeys,
  titles,
}: {
  cypress: string
  dataProgrammeStats?: Record<string, number[][]>
  dataStats?: (number | string)[][]
  plotLinePlaces?: string[][]
  programmeNames: Record<string, NameWithCode>
  shortNames?: string[]
  sliceStart: number
  sortedKeys: string[]
  titles?: string[]
}) => {
  const [sorter, setSorter] = useState('Code')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
  const [columnIndex, setSelectedIndex] = useState(0)
  const [visible, setVisible] = useState<boolean[]>(new Array(dataStats?.length ?? 0).fill(false))

  if (!dataStats || !titles || !dataProgrammeStats) {
    return null
  }

  const handleSortClick = (sorterName: string, nameIndex: number) => {
    if (sorter === sorterName) {
      setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'))
    } else {
      setSorter(sorterName)
      setSortDirection('asc')
      setSelectedIndex(nameIndex)
    }
  }

  const keyOrder: Record<number, string[]> = {}
  if (columnIndex !== 0) {
    const numbersOfYears = dataStats.length
    const data = sortedKeys?.map(programme => [programme, dataProgrammeStats[programme]])
    const groupIndices =
      plotLinePlaces && plotLinePlaces.length > 0 ? plotLinePlaces.map(value => Number(value[0])) : []
    for (let yearIndex = 0; yearIndex < numbersOfYears; yearIndex++) {
      let yearlySortedKeys: string[] = []
      if (groupIndices.length > 0) {
        for (let i = 0; i < groupIndices.length; i++) {
          const ending = i === groupIndices.length - 1 ? data.length : groupIndices[i + 1]
          yearlySortedKeys = [
            ...yearlySortedKeys,
            ...data
              .slice(groupIndices[i], ending)
              .sort((a, b) =>
                sortDirection === 'asc'
                  ? Number(a[1][yearIndex][columnIndex]) - Number(b[1][yearIndex][columnIndex])
                  : Number(b[1][yearIndex][columnIndex]) - Number(a[1][yearIndex][columnIndex])
              )
              .map(yearlyProgrammes => yearlyProgrammes[0] as string),
          ]
        }
      } else {
        yearlySortedKeys = data
          .sort((a, b) =>
            sortDirection === 'asc'
              ? Number(a[1][yearIndex][columnIndex]) - Number(b[1][yearIndex][columnIndex])
              : Number(b[1][yearIndex][columnIndex]) - Number(a[1][yearIndex][columnIndex])
          )
          .map(yearlyProgrammes => yearlyProgrammes[0] as string)
      }
      keyOrder[yearIndex] = yearlySortedKeys
    }
  }

  const calculateDiffToPrevYear = (programmeData: Record<string, number[][]>) => {
    const differenceMatrix = Object.keys(programmeData).reduce(
      (differenceMatrix, programme) => ({
        ...differenceMatrix,
        [programme]: programmeData[programme].map((_yearlyValues, yearIndex) =>
          yearIndex < programmeData[programme].length - 1
            ? programmeData[programme][yearIndex]
                .slice(sliceStart)
                .map((value, index) => value - programmeData[programme][yearIndex + 1][index + sliceStart])
            : new Array(programmeData[programme][yearIndex].length - sliceStart).fill(0)
        ),
      }),
      {}
    )
    return differenceMatrix
  }

  const toggleVisibility = (yearIndex: number) => {
    const arrayToModify = [...visible]
    arrayToModify[yearIndex] = !visible[yearIndex]
    setVisible(arrayToModify)
  }

  const sorterNames = shortNames ?? titles.map(title => (title === '' ? 'Code' : title))
  const differenceToPrevYears = calculateDiffToPrevYear(dataProgrammeStats)

  return (
    <Section>
      <TableContainer>
        <Table data-cy={`${cypress}InteractiveDataTable`} size="small">
          <TableHead>
            <TableRow>
              {titles.map((title, index) => (
                <TableCell align={index === 0 ? 'left' : 'right'} key={title}>
                  {index === 0 && <InfoBox content={facultyToolTips.interactiveDataTable} mini />}
                  <TableSortLabel
                    active={sorter === sorterNames[index]}
                    direction={sortDirection}
                    onClick={() => handleSortClick(sorterNames[index], index)}
                  >
                    {title}
                  </TableSortLabel>
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {dataStats?.map((yearArray, yearIndex) => (
              <Fragment key={yearArray[0]}>
                <ExpandableRow
                  cypress={visible[yearIndex] ? `Hide-${cypress}` : `Show-${cypress}`}
                  toggleVisibility={() => toggleVisibility(yearIndex)}
                  visible={visible[yearIndex]}
                  yearArray={yearArray}
                  yearIndex={yearIndex}
                />
                <TableRow style={{ display: visible[yearIndex] ? '' : 'none' }}>
                  <TableCell colSpan={100}>
                    <CollapsedStackedBar
                      data={
                        columnIndex === 0
                          ? sortedKeys
                              ?.map(programme =>
                                dataProgrammeStats[programme]
                                  ? dataProgrammeStats[programme][yearIndex].slice(sliceStart)
                                  : null
                              )
                              .filter(programme => !!programme)
                          : keyOrder[yearIndex]
                              ?.map(programme =>
                                dataProgrammeStats[programme]
                                  ? dataProgrammeStats[programme][yearIndex].slice(sliceStart)
                                  : null
                              )
                              .filter(programme => !!programme)
                      }
                      differenceData={Object.keys(differenceToPrevYears)?.reduce(
                        (yearlyObject, programme) => ({
                          ...yearlyObject,
                          [programme]: differenceToPrevYears[programme][yearIndex],
                        }),
                        {}
                      )}
                      labels={columnIndex === 0 ? sortedKeys : keyOrder[yearIndex]}
                      longLabels={programmeNames}
                      names={titles?.slice(sliceStart)}
                      plotLinePlaces={plotLinePlaces}
                    />
                  </TableCell>
                </TableRow>
              </Fragment>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Section>
  )
}
