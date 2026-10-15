import { alpha } from '@mui/material/styles'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'

import { PopulationLink } from '@/components/common/PopulationLink'
import { StartingYearStatsTable, StatsTableGroup } from '@/components/common/StartingYearStatsTable'
import { useLanguage } from '@/components/LanguagePicker/useLanguage'
import { DegreeProgramme } from '@/types/api/faculty'
import { getCalendarYears } from '@/util/timeAndDate'
import { DegreeProgrammeType } from '@oodikone/shared/types'

const degreeToIndex = {
  [DegreeProgrammeType.BACHELOR]: 'bachelor',
  [DegreeProgrammeType.MASTER]: 'master',
  [DegreeProgrammeType.LICENTIATE]: 'licentiate',
  [DegreeProgrammeType.DOCTOR]: 'doctor',
  [DegreeProgrammeType.POSTGRADUATE_PROFESSIONAL]: 'postgrad',
} as const

export const FacultyStudentDataTable = ({
  extraTableStats,
  programmeNames,
  programmeStats,
  requiredRights,
  showPercentages,
  sortedKeys,
  tableStats,
  titles,
  years,
}: {
  extraTableStats: Record<string, Record<string, Record<string, number>>>
  programmeNames: Record<string, DegreeProgramme>
  programmeStats: Record<string, Record<string, (number | string)[]>>
  requiredRights: {
    fullAccessToStudentData: boolean
    programmeRights: string[]
  }
  showPercentages: boolean
  sortedKeys: string[]
  tableStats: Record<string, (number | string)[]>
  titles: string[]
  years: string[]
}) => {
  'use memo'
  const { getTextIn } = useLanguage()

  const calendarYears = getCalendarYears(years).sort((a, b) => a - b)

  const groups: StatsTableGroup[] = years
    .filter(year => tableStats[year])
    .map(year => ({
      key: year,
      label: year,
      values: tableStats[year].slice(1),
      children: sortedKeys
        .filter(programme => !!programmeStats[programme][year]?.length)
        .map(programme => {
          const { code, degreeProgrammeType, name, progId } = programmeNames[programme]
          const hasAccess = requiredRights.fullAccessToStudentData || requiredRights.programmeRights?.includes(code)

          return {
            key: programme,
            label: (
              <>
                <Tooltip title={`${code} – ${getTextIn(name)}`}>
                  <Typography component="span" fontSize="inherit" fontWeight="bold">
                    {progId}
                  </Typography>
                </Tooltip>
                {hasAccess ? (
                  <PopulationLink
                    programme={code}
                    years={year === 'Total' ? calendarYears : [Number(year.slice(0, 4))]}
                  />
                ) : null}
              </>
            ),
            values: programmeStats[programme][year],
            otherCountries: extraTableStats?.[year]?.[code],
            sx: theme => ({
              backgroundColor: alpha(theme.palette.degreeProgrammeType[degreeToIndex[degreeProgrammeType]], 0.3),
            }),
          }
        }),
    }))

  return (
    <StartingYearStatsTable
      citizenshipInfo="Hover over 'Other' cell to see which citizenships (other than Finland) students have. Shown only for degree programmes."
      cypress="faculty-student-stats-table"
      groups={groups}
      showPercentages={showPercentages}
      titles={titles}
    />
  )
}
