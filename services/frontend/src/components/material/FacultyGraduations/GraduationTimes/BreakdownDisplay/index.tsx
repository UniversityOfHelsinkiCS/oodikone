import { Box, Stack, Typography } from '@mui/material'

import { GraduationStats, NameWithCode } from '@/shared/types'
import { BreakdownBarChart } from './BreakdownBarChart'

export const BreakdownDisplay = ({
  data,
  facultyNames,
  handleClick,
  levelProgrammeData,
  mode,
  programmeDataVisible,
  year,
  yearLabel,
}: {
  data: GraduationStats[]
  facultyNames: Record<string, NameWithCode>
  handleClick: (event, isFacultyGraph: boolean, seriesCategory?: number) => void
  levelProgrammeData: Record<
    number,
    {
      data: Array<GraduationStats & { code: string }>
      programmes: string[]
    }
  >
  mode: 'faculty' | 'programme'
  programmeDataVisible: boolean
  year: number | null
  yearLabel: 'Graduation year' | 'Start year'
}) => {
  return (
    <Box>
      <Typography>Click a bar to view that year's {mode} level breakdown</Typography>
      <Stack direction={{ sm: 'column', md: 'row' }}>
        <BreakdownBarChart data={data} handleClick={handleClick} mode={mode} />
        {programmeDataVisible && year && year in levelProgrammeData && (
          <BreakdownBarChart
            data={levelProgrammeData[year].data}
            facultyGraph={false}
            facultyNames={facultyNames}
            handleClick={handleClick}
            mode={mode}
            year={year}
            yearLabel={yearLabel}
          />
        )}
      </Stack>
    </Box>
  )
}
