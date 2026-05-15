import Box from '@mui/material/Box'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'

import { GraduationBreakdown } from '@/components/Charts/GraduationBreakdown'
import { GraduationStats, Name, NameWithCode, ProgrammeMedians } from '@oodikone/shared/types'

export const BreakdownDisplay = ({
  data,
  handleClick,
  allowExpand,
  expandKey,
  level,
  levelProgrammeData,
  mode,
  names,
  programmeDataVisible,
  yearLabel,
}: {
  data: GraduationStats[]
  handleClick: (seriesCategory: string) => void
  allowExpand: boolean
  expandKey: string | null,
  level: string
  levelProgrammeData?: ProgrammeMedians
  mode: 'faculty' | 'programme' | 'study track'
  names: Record<string, Name | NameWithCode> | Record<string, string | Name> | undefined
  programmeDataVisible: boolean
  yearLabel: 'Graduation year' | 'Start year'
}) => {

  if (!allowExpand) {
    return (
      <Box>
        <GraduationBreakdown
          cypress={`${level}-breakdown-bar-chart`}
          data={data}
          mode={mode}
          fullWidth
        />
      </Box>
    )
  }

  return (
    <Box>
      <Typography>Click a bar to view that year's {mode} level breakdown</Typography>
      <Stack direction={{ sm: 'column', md: 'row' }}>
        <GraduationBreakdown
          cypress={`${level}-breakdown-bar-chart`}
          data={data}
          handleClick={handleClick}
          mode={mode}
        />
        {programmeDataVisible && expandKey && levelProgrammeData && expandKey in levelProgrammeData ? (
          <GraduationBreakdown
            cypress={`${level}BreakdownBarChartFaculty`}
            data={levelProgrammeData[expandKey].data}
            handleClick={handleClick}
            mode={mode}
            names={names}
            expandKey={expandKey}
            yearLabel={yearLabel}
          />
        ) : null}
      </Stack>
    </Box>
  )
}
