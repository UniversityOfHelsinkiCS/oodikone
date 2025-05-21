import TableCell from '@mui/material/TableCell'
import TableRow from '@mui/material/TableRow'

import { PopulationLink } from '@/components/material/PopulationLink'
import { BasicCell } from './BasicCell'
import { OtherCountriesCell } from './OtherCountriesCell'
import { getCellKey, shouldBeHidden } from './util'

export const SingleStudyTrackRow = ({
  calendarYears,
  code,
  combinedProgramme,
  otherCountriesStats,
  populationLinkVisible,
  row,
  showPercentages,
  studyProgramme,
}: {
  calendarYears: number[]
  code: string
  combinedProgramme: string
  otherCountriesStats: Record<string, Record<string, Record<string, number>>>
  populationLinkVisible: boolean
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
        if (index === 0) {
          return (
            <TableCell align="right" key={getCellKey(code, index)} sx={{ whiteSpace: 'nowrap' }}>
              {value}
              {populationLinkVisible && (
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
        return <BasicCell key={getCellKey('basic-cell', index)} value={value} />
      })}
    </TableRow>
  )
}
