import TableCell from '@mui/material/TableCell'
import TableRow from '@mui/material/TableRow'

import { useLanguage } from '@/components/LanguagePicker/useLanguage'
import { PopulationLink } from '@/components/material/PopulationLink'
import { Name } from '@oodikone/shared/types'
import { BasicCell } from './BasicCell'
import { OtherCountriesCell } from './OtherCountriesCell'
import { getCellKey, shouldBeHidden } from './util'
import { YearCell } from './YearCell'

export const Row = ({
  calendarYears,
  combinedProgramme,
  otherCountriesStats,
  populationLinkVisible,
  row,
  setShow,
  show,
  showPercentages,
  degreeProgramme,
  studyTracks,
  yearlyData,
  years,
}: {
  calendarYears: number[]
  combinedProgramme: string
  otherCountriesStats: Record<string, Record<string, Record<string, number>>>
  populationLinkVisible: boolean
  row: (string | number)[]
  setShow: () => void
  show: boolean
  showPercentages: boolean
  degreeProgramme: string
  studyTracks: Record<string, string | Name>
  yearlyData: (string | number)[][]
  years: string[]
}) => {
  const { getTextIn } = useLanguage()

  const year = yearlyData?.[0]?.[0].toString()

  if (years.includes(row[0].toString())) {
    return (
      <TableRow>
        {row.map((value, index) => {
          if (shouldBeHidden(showPercentages, value)) {
            return null
          }
          if (index === 0) {
            return (
              <YearCell
                calendarYears={calendarYears}
                combinedProgramme={combinedProgramme}
                degreeProgramme={degreeProgramme}
                key={getCellKey(year, index)}
                populationLinkVisible={populationLinkVisible}
                setShow={setShow}
                show={show}
                year={row[0].toString()}
                yearlyData={yearlyData}
              />
            )
          }
          if (index === row.length - 2 && otherCountriesStats) {
            return (
              <OtherCountriesCell
                key={getCellKey('other-country', index)}
                otherCountriesStats={otherCountriesStats}
                studyProgramme={degreeProgramme}
                value={value}
                year={row[0].toString()}
              />
            )
          }
          return <BasicCell key={getCellKey('basic', index)} value={value} />
        })}
      </TableRow>
    )
  }

  if (!show) {
    return null
  }

  const correctStudyTrack = row[0].toString()
  const title =
    studyTracks[correctStudyTrack] === undefined
      ? correctStudyTrack
      : `${getTextIn(studyTracks[correctStudyTrack] as Name)} (${correctStudyTrack})`

  return (
    <TableRow>
      {row.map((value, index) => {
        if (shouldBeHidden(showPercentages, value)) {
          return null
        }
        if (index === 0) {
          return (
            <TableCell align="right" key={getCellKey(year, index)} sx={{ whiteSpace: 'nowrap' }}>
              {title}
              {populationLinkVisible && (
                <PopulationLink
                  combinedProgramme={combinedProgramme}
                  cypress={year.split(' - ')[0]}
                  programme={degreeProgramme}
                  studyTrack={correctStudyTrack}
                  years={year === 'Total' ? calendarYears : [parseInt(year.split(' ')[0], 10)]}
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
              studyProgramme={correctStudyTrack}
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
