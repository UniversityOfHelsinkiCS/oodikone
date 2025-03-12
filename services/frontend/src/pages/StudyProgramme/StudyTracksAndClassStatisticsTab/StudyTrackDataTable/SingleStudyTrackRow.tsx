import { TableCell, TableRow } from '@mui/material'

import { PopulationLink } from '@/components/material/PopulationLink'
import { OtherCountriesCell } from './OtherCountriesCell'
import { getCellKey, shouldBeHidden } from './util'

export const SingleStudyTrackRow = ({
  allRights,
  calendarYears,
  code,
  combinedProgramme,
  fullAccessToStudentData,
  otherCountriesStats,
  row,
  showPercentages,
  studyProgramme,
}: {
  allRights: string[]
  calendarYears: number[]
  code: string
  combinedProgramme: string
  fullAccessToStudentData: boolean
  otherCountriesStats: Record<string, Record<string, Record<string, number>>>
  row: (string | number)[]
  showPercentages: boolean
  studyProgramme: string
}) => {
  const year = row[0].toString()

  return (
    <TableRow>
      {row.map((value, index) => {
        if (shouldBeHidden(showPercentages, value)) {
          return null
        }
        if (index === row.length - 2 && otherCountriesStats) {
          return (
            <OtherCountriesCell
              key={getCellKey('other-country', index)}
              otherCountriesStats={otherCountriesStats}
              studyProgramme={code}
              value={value}
              year={year}
            />
          )
        }
        return (
          <TableCell align="right" key={getCellKey(code, index)}>
            {value}
            {index === 0 &&
              (fullAccessToStudentData ||
                allRights.includes(studyProgramme) ||
                allRights.includes(combinedProgramme)) && (
                <PopulationLink
                  combinedProgramme={combinedProgramme}
                  cypress={year.split(' - ')[0]}
                  studyProgramme={studyProgramme}
                  studyTrack={code}
                  year={year}
                  years={calendarYears}
                />
              )}
          </TableCell>
        )
      })}
    </TableRow>
  )
}
