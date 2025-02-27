import { Collapse, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material'
import { Fragment, useState } from 'react'

import { ExpandableRow } from '@/components/material/ExpandableRow'
import { StyledTable } from '@/components/material/StyledTable'
import { NameWithCode } from '@/shared/types'
import { ProgrammeProgressChart } from './ProgrammeProgressChart'

export const FacultyProgressTable = ({
  cypress,
  data,
  programmeNames,
  programmeStats,
  progressTitles,
  sortedKeys,
  titles,
}: {
  cypress: string
  data: (number | string)[][]
  programmeNames: Record<string, NameWithCode>
  programmeStats: Record<string, number[][]>
  progressTitles?: string[][]
  sortedKeys: string[]
  titles: string[]
}) => {
  const [visibleYears, setVisibleYears] = useState(new Array<boolean>(data.length).fill(false))

  const toggleVisibility = (yearIndex: number) => {
    setVisibleYears(prev => prev.map((visible, index) => (index === yearIndex ? !visible : visible)))
  }

  const isTotalRow = (array: (number | string)[]) => {
    const firstValue = array[0] as string
    return firstValue.toLowerCase() === 'total'
  }

  const getKey = (value: number | string, index: number) => `${value}-${index}`

  return (
    <TableContainer>
      <StyledTable data-cy={cypress} showCellBorders size="small">
        <TableHead>
          <TableRow>
            {titles.map(title => (
              <TableCell align="right" key={title}>
                {title}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {data.map((yearArray, yearIndex) => (
            <Fragment key={yearArray[0]}>
              {!isTotalRow(yearArray) ? (
                <>
                  <ExpandableRow
                    cypress={visibleYears[yearIndex] ? `${cypress}-hide-button` : `${cypress}-show-button`}
                    toggleVisibility={() => toggleVisibility(yearIndex)}
                    visible={visibleYears[yearIndex]}
                    yearArray={yearArray}
                    yearIndex={yearIndex}
                  />
                  {visibleYears[yearIndex] && (
                    <TableRow>
                      <TableCell colSpan={100}>
                        <Collapse in={visibleYears[yearIndex]} timeout="auto" unmountOnExit>
                          <ProgrammeProgressChart
                            data={sortedKeys?.map(programme => programmeStats[programme][yearIndex])}
                            labels={sortedKeys}
                            longLabels={programmeNames}
                            names={progressTitles ? progressTitles[yearIndex] : titles.slice(2)}
                          />
                        </Collapse>
                      </TableCell>
                    </TableRow>
                  )}
                </>
              ) : (
                <TableRow>
                  {yearArray.map((value, index) => (
                    <TableCell align="right" key={getKey(value, index)}>
                      <b>{value}</b>
                    </TableCell>
                  ))}
                </TableRow>
              )}
            </Fragment>
          ))}
        </TableBody>
      </StyledTable>
    </TableContainer>
  )
}
