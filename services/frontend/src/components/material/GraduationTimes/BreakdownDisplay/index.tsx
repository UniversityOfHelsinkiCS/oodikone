import Box from '@mui/material/Box'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'

import { GraduationStats, Name, NameWithCode, ProgrammeMedians } from '@oodikone/shared/types'
import { BreakdownBarChart } from './BreakdownBarChart'

export const BreakdownDisplay = ({
  data,
  handleClick,
  level,
  levelProgrammeData,
  mode,
  names,
  programmeDataVisible,
  year,
  yearLabel,
}: {
  data: GraduationStats[]
  handleClick: (event, isFacultyGraph: boolean, seriesCategory?: number | string) => void
  level: string
  levelProgrammeData: ProgrammeMedians
  mode: 'faculty' | 'programme' | 'study track'
  names: Record<string, Name | NameWithCode> | Record<string, string | Name> | undefined
  programmeDataVisible: boolean
  year: number | null
  yearLabel: 'Graduation year' | 'Start year'
}) => {
  return (
    <Box>
      <Typography>Click a bar to view that year's {mode} level breakdown</Typography>
      <Stack direction={{ sm: 'column', md: 'row' }}>
        <BreakdownBarChart cypress={`${level}-breakdown-bar-chart`} data={data} handleClick={handleClick} mode={mode} />
        {programmeDataVisible && year && year in levelProgrammeData && (
          <BreakdownBarChart
            cypress={`${level}BreakdownBarChartFaculty`}
            data={levelProgrammeData[year].data}
            facultyGraph={false}
            handleClick={handleClick}
            mode={mode}
            names={names}
            year={year}
            yearLabel={yearLabel}
          />
        )}
      </Stack>
    </Box>
  )
}
