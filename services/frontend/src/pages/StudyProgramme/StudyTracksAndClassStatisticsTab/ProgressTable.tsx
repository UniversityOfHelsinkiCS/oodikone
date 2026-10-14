import Box from '@mui/material/Box'
import Collapse from '@mui/material/Collapse'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'

import { Fragment, useState } from 'react'

import { ExpandableRow } from '@/components/common/ExpandableRow'
import { StyledTable } from '@/components/common/StyledTable'
import { ProgrammeProgressChart } from '@/components/Faculties/ProgrammeProgressChart'
import { getCellKey, getRowKey } from '@/pages/StudyProgramme/StudyTracksAndClassStatisticsTab/StudyTrackDataTable/util'
import { Name } from '@oodikone/shared/types'

/** Progress category counts of each study track by starting year, e.g. `{ 'MAT-MAT': { '2020 - 2021': [2, 1, 0] } }` */
export type StudyTrackProgressStats = Record<string, Record<string, number[]>>

export const ProgressTable = ({
  data,
  studyTrackStats,
  studyTracks,
  titles,
}: {
  data: (string | number)[][]
  studyTrackStats?: StudyTrackProgressStats | null
  studyTracks?: Record<string, string | Name>
  titles: string[]
}) => {
  const [visibleYears, setVisibleYears] = useState<Record<string, boolean>>({})

  if (!data.length || !titles) {
    return null
  }

  const sortedData = data.toSorted((a, b) => {
    if (a[0] === 'Total') return 1
    if (b[0] === 'Total') return -1
    return parseInt(String(b[0]).split(' - ')[0], 10) - parseInt(String(a[0]).split(' - ')[0], 10)
  })

  const studyTrackCodes = Object.keys(studyTrackStats ?? {}).toSorted()
  const isExpandable = !!studyTrackStats && studyTrackCodes.length > 0

  const toggleVisibility = (year: string) => setVisibleYears(prev => ({ ...prev, [year]: !prev[year] }))

  return (
    <TableContainer component={Box}>
      <StyledTable data-cy="study-programme-progress-data-table" nowrapBody showCellBorders>
        <TableHead>
          <TableRow>
            {titles?.map((title, index) => (
              <TableCell align="center" key={getCellKey(title, index)}>
                {title}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {sortedData.map((row, index) => {
            const year = row[0].toString()

            if (isExpandable && year !== 'Total') {
              return (
                <Fragment key={getRowKey(year, index)}>
                  <ExpandableRow
                    cypress={
                      visibleYears[year]
                        ? 'study-programme-progress-hide-button'
                        : 'study-programme-progress-show-button'
                    }
                    toggleVisibility={() => toggleVisibility(year)}
                    visible={!!visibleYears[year]}
                    yearArray={row}
                    yearIndex={index}
                  />
                  {visibleYears[year] ? (
                    <TableRow>
                      <TableCell colSpan={100}>
                        <Collapse in={visibleYears[year]} timeout="auto" unmountOnExit>
                          <ProgrammeProgressChart
                            data={studyTrackCodes.map(
                              code => studyTrackStats[code][year] ?? new Array(titles.length - 2).fill(0)
                            )}
                            labels={studyTrackCodes}
                            longLabels={studyTracks ?? {}}
                            names={titles.slice(2)}
                          />
                        </Collapse>
                      </TableCell>
                    </TableRow>
                  ) : null}
                </Fragment>
              )
            }

            return (
              <TableRow key={getRowKey(year, index)}>
                {row.map((value, index) => (
                  <TableCell align={index === 0 ? 'center' : 'right'} key={getCellKey(value.toString(), index)}>
                    {value}
                  </TableCell>
                ))}
              </TableRow>
            )
          })}
        </TableBody>
      </StyledTable>
    </TableContainer>
  )
}
