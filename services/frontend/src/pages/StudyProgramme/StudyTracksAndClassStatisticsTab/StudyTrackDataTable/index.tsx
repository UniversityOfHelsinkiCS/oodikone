import { Card, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Stack } from '@mui/material'
import { useState } from 'react'

import { InfoBox } from '@/components/material/InfoBox'
import { useGetAuthorizedUserQuery } from '@/redux/auth'
import { Name } from '@/shared/types'
import { getCalendarYears } from '@/util/timeAndDate'
import { Row } from './Row'
import { SingleStudyTrackRow } from './SingleStudyTrackRow'
import { getRowKey } from './util'

const getSpanValue = (combinedProgramme: string, index: number, showPercentages: boolean) => {
  if (combinedProgramme && showPercentages) return index + 2
  if (combinedProgramme) return index + 1
  return index
}

const sortMainDataByYear = (data: (string | number)[][][]) => {
  if (!data?.length) {
    return []
  }

  const sortedData: (string | number)[][][] = []
  data.forEach(arrays => {
    if (arrays.length) {
      const copy = [...arrays]
      const sortedYear = copy.sort((a, b) => {
        if (a[0] === 'Total') return 1
        if (b[0] === 'Total') return -1
        if (a[0] < b[0]) return 1
        if (a[0] > b[0]) return -1
        return 0
      })
      sortedData.push(sortedYear.reverse())
    }
  })

  sortedData.reverse()
  return sortedData
}

const sortTrackDataByYear = (data: (string | number)[][] | null) => {
  if (!data?.length) {
    return []
  }

  const copy = [...data]
  const sortedData = copy.sort((a, b) => {
    if (a[0] === 'Total') return -1
    if (b[0] === 'Total') return 1
    if (a[0] < b[0]) return -1
    if (a[0] > b[0]) return 1
    return 0
  })

  sortedData.reverse()
  return sortedData
}

export const StudyTrackDataTable = ({
  combinedProgramme,
  dataOfAllTracks,
  dataOfSingleTrack,
  otherCountriesStats,
  showPercentages,
  singleTrack,
  studyProgramme,
  studyTracks,
  titles,
  years,
}: {
  combinedProgramme: string
  dataOfAllTracks: Record<string, (string | number)[][]>
  dataOfSingleTrack: (string | number)[][] | null
  otherCountriesStats: Record<string, Record<string, Record<string, number>>>
  showPercentages: boolean
  singleTrack: string | null
  studyProgramme: string
  studyTracks: Record<string, string | Name>
  titles: string[]
  years: string[]
}) => {
  const [show, setShow] = useState<boolean[]>([])
  const { fullAccessToStudentData, programmeRights } = useGetAuthorizedUserQuery()
  const allRights = programmeRights.map(({ code }) => code)

  if (!dataOfAllTracks && !dataOfSingleTrack) {
    return null
  }

  const firstCellClicked = (index: number) => {
    const newShow = [...show]
    show[index] = newShow[index] === undefined ? true : !show[index]
    setShow([...show])
  }

  const sortedMainStats = sortMainDataByYear(Object.values(dataOfAllTracks))
  const sortedTrackStats = sortTrackDataByYear(dataOfSingleTrack)
  const calendarYears = getCalendarYears(years)

  return (
    <TableContainer component={Card} variant="outlined">
      <Table data-cy="study-tracks-and-class-statistics-data-table" size="small">
        <TableHead>
          <TableRow>
            <TableCell colSpan={!showPercentages ? 3 : 4} />
            <TableCell
              colSpan={
                !showPercentages
                  ? getSpanValue(combinedProgramme, 4, showPercentages)
                  : getSpanValue(combinedProgramme, 8, showPercentages)
              }
            >
              Current status
            </TableCell>
            <TableCell colSpan={!showPercentages ? 3 : 6}>Gender</TableCell>
            <TableCell colSpan={!showPercentages ? 2 : 4}>
              <Stack alignItems="center" direction="row" gap={1}>
                Citizenships
                <InfoBox
                  content="Hover over 'Other' cell to see which citizenships (other than Finland) students have"
                  mini
                />
              </Stack>
            </TableCell>
          </TableRow>
          <TableRow>
            {titles.map((title, index) => (
              <TableCell
                align="center"
                colSpan={index === 0 || index === 1 || !showPercentages ? 1 : 2}
                key={getRowKey(title, index)}
              >
                {title}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        {(sortedMainStats || sortedTrackStats) && (
          <TableBody>
            {singleTrack
              ? sortedTrackStats.map((row, index) => (
                  <SingleStudyTrackRow
                    allRights={allRights}
                    calendarYears={calendarYears}
                    code={singleTrack}
                    combinedProgramme={combinedProgramme}
                    fullAccessToStudentData={fullAccessToStudentData}
                    key={getRowKey(singleTrack, index)}
                    otherCountriesStats={otherCountriesStats}
                    row={row}
                    showPercentages={showPercentages}
                    studyProgramme={studyProgramme}
                  />
                ))
              : sortedMainStats?.map((yearlyData, index) =>
                  yearlyData.map(row => (
                    <Row
                      allRights={allRights}
                      calendarYears={calendarYears}
                      combinedProgramme={combinedProgramme}
                      fullAccessToStudentData={fullAccessToStudentData}
                      key={getRowKey(row[0].toString(), index)}
                      otherCountriesStats={otherCountriesStats}
                      row={row}
                      setShow={() => firstCellClicked(index)}
                      show={show[index]}
                      showPercentages={showPercentages}
                      studyProgramme={studyProgramme}
                      studyTracks={studyTracks}
                      yearlyData={yearlyData}
                      years={years}
                    />
                  ))
                )}
          </TableBody>
        )}
      </Table>
    </TableContainer>
  )
}
