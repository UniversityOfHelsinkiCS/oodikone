import { Box, Stack, Typography } from '@mui/material'

import {
  FacultyClassSizes,
  GraduationStats,
  Name,
  NameWithCode,
  ProgrammeClassSizes,
  ProgrammeMedians,
} from '@oodikone/shared/types'
import { MedianBarChart } from './MedianBarChart'

export const MedianDisplay = ({
  classSizes,
  data,
  goal,
  goalExceptions,
  groupBy,
  handleClick,
  level,
  levelProgrammeData,
  mode,
  names,
  programmeDataVisible,
  title,
  year,
  yearLabel,
}: {
  classSizes: FacultyClassSizes | ProgrammeClassSizes
  data: GraduationStats[]
  goal: number
  goalExceptions: Record<string, number> | { needed: boolean }
  groupBy: 'byGradYear' | 'byStartYear'
  handleClick: (event, isFacultyGraph: boolean, seriesCategory?: number) => void
  level: string
  levelProgrammeData: ProgrammeMedians
  mode: 'faculty' | 'programme' | 'study track'
  names: Record<string, Name | NameWithCode> | Record<string, string | Name>
  programmeDataVisible: boolean
  title: string
  year: number | null
  yearLabel: 'Graduation year' | 'Start year'
}) => {
  return (
    <Box>
      {level === 'bcMsCombo' && groupBy === 'byStartYear' && (
        <Typography>
          Programme class sizes for recent years are not reliable as students might still lack relevant master studies
          data in Sisu
        </Typography>
      )}
      {goalExceptions.needed && ['master', 'bcMsCombo'].includes(level) && (
        <Typography>
          <b>Different goal times</b> have been taken into account in all numbers and programme level bar coloring, but
          the faculty level bar color is based on the typical goal time of {goal} months
        </Typography>
      )}
      <Typography>Click a bar to view that year's {mode} level breakdown</Typography>
      <Stack direction={{ sm: 'column', md: 'row' }}>
        <MedianBarChart
          classSizes={classSizes?.[level] ?? {}}
          cypress={`${level}-median-bar-chart`}
          data={data}
          goal={goal}
          handleClick={handleClick}
          mode={mode}
          names={mode === 'faculty' ? (names as Record<string, Name | NameWithCode>) : undefined}
          title={title}
          yearLabel={yearLabel}
        />
        {programmeDataVisible && year && year in levelProgrammeData && (
          <MedianBarChart
            classSizes={'programmes' in classSizes ? classSizes.programmes : classSizes.studyTracks}
            cypress={`${level}-median-bar-chart-faculty`}
            data={levelProgrammeData[year].data}
            facultyGraph={false}
            goal={goal}
            goalExceptions={goalExceptions}
            handleClick={handleClick}
            level={level}
            mode={mode}
            names={mode === 'faculty' ? (names as Record<string, Name | NameWithCode>) : undefined}
            title={title}
            year={year}
            yearLabel={yearLabel}
          />
        )}
      </Stack>
    </Box>
  )
}
