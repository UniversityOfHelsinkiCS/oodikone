import { TableCell, TableRow } from '@mui/material'

import { useLanguage } from '@/components/LanguagePicker/useLanguage'
import { PopulationLink } from '@/components/material/PopulationLink'
import { Name } from '@/shared/types'
import { BasicCell } from './BasicCell'
import { OtherCountriesCell } from './OtherCountriesCell'
import { getCellKey, shouldBeHidden } from './util'
import { YearCell } from './YearCell'

export const Row = ({
  allRights,
  calendarYears,
  combinedProgramme,
  fullAccessToStudentData,
  otherCountriesStats,
  row,
  setShow,
  show,
  showPercentages,
  studyProgramme,
  studyTracks,
  yearlyData,
  years,
}: {
  allRights: string[]
  calendarYears: number[]
  combinedProgramme: string
  fullAccessToStudentData: boolean
  otherCountriesStats: Record<string, Record<string, Record<string, number>>>
  row: (string | number)[]
  setShow: () => void
  show: boolean
  showPercentages: boolean
  studyProgramme: string
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
                allRights={allRights}
                calendarYears={calendarYears}
                combinedProgramme={combinedProgramme}
                fullAccessToStudentData={fullAccessToStudentData}
                key={getCellKey(year, index)}
                setShow={setShow}
                show={show}
                studyProgramme={studyProgramme}
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
                studyProgramme={studyProgramme}
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
      : `${getTextIn(studyTracks[correctStudyTrack] as Name)}, ${correctStudyTrack}`

  return (
    <TableRow>
      {row.map((value, index) => {
        if (shouldBeHidden(showPercentages, value)) {
          return null
        }
        if (index === 0) {
          return (
            <TableCell align="left" key={getCellKey(year, index)}>
              {title}
              {(fullAccessToStudentData ||
                allRights.includes(studyProgramme) ||
                allRights.includes(combinedProgramme)) && (
                <PopulationLink
                  combinedProgramme={combinedProgramme}
                  cypress={year.split(' - ')[0]}
                  studyProgramme={studyProgramme}
                  studyTrack={correctStudyTrack.toString()}
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
              studyProgramme={correctStudyTrack}
              value={value}
              year={year}
            />
          )
        }
        return <BasicCell key={getCellKey('other-country', index)} value={value} />
      })}
    </TableRow>
  )
}
