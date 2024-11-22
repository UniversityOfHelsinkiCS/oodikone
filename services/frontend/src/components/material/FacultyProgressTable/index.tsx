import { KeyboardArrowDown, KeyboardArrowRight } from '@mui/icons-material'
import { Box, Collapse, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material'
import { Fragment, useState } from 'react'

import { Name } from '@/shared/types'
import { ExpandableRow } from './ExpandableRow'
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
  programmeNames: Record<string, Name>
  programmeStats: Record<string, number[]>
  progressTitles?: string[][]
  sortedKeys: string[]
  titles: string[]
}) => {
  const [visibleYears, setVisibleYears] = useState(new Array(data.length).fill(false))

  const toggleVisibility = (yearIndex: number) => {
    setVisibleYears(prev => prev.map((visible, index) => (index === yearIndex ? !visible : visible)))
  }

  const isTotalRow = (array: (number | string)[]) => {
    const firstValue = array[0] as string
    return firstValue.toLowerCase() === 'total'
  }

  const getKey = (value: number | string, index: number) => `${value}-${index}`

  return (
    <Paper sx={{ padding: 2 }} variant="outlined">
      <TableContainer>
        <Table data-cy={cypress} size="small">
          <TableHead>
            <TableRow>
              {titles.map(title => (
                <TableCell align="center" key={title}>
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
                      cypress={visibleYears[yearIndex] ? `Hide-${cypress}` : `Show-${cypress}`}
                      icon={visibleYears[yearIndex] ? <KeyboardArrowDown /> : <KeyboardArrowRight />}
                      toggleVisibility={() => toggleVisibility(yearIndex)}
                      yearArray={yearArray}
                      yearIndex={yearIndex}
                    />
                    <TableRow>
                      <TableCell
                        colSpan={100}
                        style={{
                          padding: 0,
                          borderBottom: visibleYears[yearIndex] ? '' : 'none',
                        }}
                      >
                        <Collapse in={visibleYears[yearIndex]} timeout="auto" unmountOnExit>
                          <Box data-cy={`Cell-${cypress}-${yearIndex}`} padding={1}>
                            <ProgrammeProgressChart
                              data={sortedKeys?.map(programme => programmeStats[programme][yearIndex])}
                              labels={sortedKeys}
                              longLabels={programmeNames}
                              names={progressTitles ? progressTitles[yearIndex] : titles.slice(2)}
                            />
                          </Box>
                        </Collapse>
                      </TableCell>
                    </TableRow>
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
        </Table>
      </TableContainer>
    </Paper>
  )
}
