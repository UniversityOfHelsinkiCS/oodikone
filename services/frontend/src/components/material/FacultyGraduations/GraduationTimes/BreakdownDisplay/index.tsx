import { Box, Stack, Typography } from '@mui/material'

import { GraduationStats, Name, NameWithCode, ProgrammeMedians } from '@/shared/types'
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
  handleClick: (event, isFacultyGraph: boolean, seriesCategory?: number) => void
  level: 'bachelor' | 'bcMsCombo' | 'master' | 'doctor'
  levelProgrammeData: ProgrammeMedians
  mode: 'faculty' | 'programme'
  names: Record<string, Name | NameWithCode>
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
