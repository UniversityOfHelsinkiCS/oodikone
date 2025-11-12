import Collapse from '@mui/material/Collapse'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'

import { Fragment, useState } from 'react'

import { StyledTable } from '@/components/common/StyledTable'
import { ExpandableRow } from '@/components/material/ExpandableRow'
import { NameWithCode } from '@oodikone/shared/types'
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
      <StyledTable data-cy={`${cypress}-faculty-progress-table`} showCellBorders size="small">
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
                    cypress={
                      visibleYears[yearIndex]
                        ? `${cypress}-faculty-progress-table-hide-button`
                        : `${cypress}-faculty-progress-table-show-button`
                    }
                    toggleVisibility={() => toggleVisibility(yearIndex)}
                    visible={visibleYears[yearIndex]}
                    yearArray={yearArray}
                    yearIndex={yearIndex}
                  />
                  {visibleYears[yearIndex] ? (
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
                  ) : null}
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
