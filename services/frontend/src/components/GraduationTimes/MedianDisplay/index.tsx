import Box from '@mui/material/Box'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'

import { MedianGraduations } from '@/components/Charts/MedianGraduations'
import {
  FacultyClassSizes,
  GraduationStats,
  Name,
  NameWithCode,
  ProgrammeClassSizes,
  ProgrammeMedians,
} from '@oodikone/shared/types'

type MedianDisplayProps = {
  mode: 'faculty' | 'programme' | 'study track'
  classSizes: FacultyClassSizes | ProgrammeClassSizes | undefined
  allowExpand: boolean
  names: Record<string, string | Name> | Record<string, Name | NameWithCode> | undefined
  data: GraduationStats[]
  expandKey: string | null
  goal: number | undefined
  goalExceptions: Record<string, number> | { needed: boolean }
  groupBy: 'byGradYear' | 'byStartYear'
  handleClick: (seriesCategory: string) => void
  level: string
  levelProgrammeData: ProgrammeMedians | undefined
  programmeDataVisible: boolean
  title: string
  yearLabel: 'Graduation year' | 'Start year'
}

export const MedianDisplay = ({
  allowExpand,
  classSizes,
  data,
  expandKey,
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
  yearLabel,
}: MedianDisplayProps) => {
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

      {allowExpand ? <Typography>Click a bar to view that year's {mode} level breakdown</Typography> : null}

      {!allowExpand ? (
        <MedianGraduations
          cypress={`${level}-median-bar-chart`}
          classSizes={!!classSizes && 'programme' in classSizes ? classSizes.programme : {}}
          data={data}
          fullWidth
          goal={goal ?? 0}
          handleClick={handleClick}
          mode={mode}
          title={title}
          yearLabel={yearLabel}
        />
      ) : (
        <Stack direction={{ sm: 'column', md: 'row' }}>
          <MedianGraduations
            classSizes={!!classSizes ? ('programme' in classSizes ? classSizes.programme : level in classSizes ? classSizes[level] : {}) : {}}
            cypress={`${level}-median-bar-chart`}
            data={data}
            goal={goal ?? 0}
            handleClick={handleClick}
            mode={mode}
            names={mode === 'faculty' ? (names as Record<string, Name | NameWithCode>) : undefined}
            title={title}
            yearLabel={yearLabel}
          />
          {programmeDataVisible && expandKey && levelProgrammeData && expandKey in levelProgrammeData && (
            <MedianGraduations
              classSizes={!!classSizes ? ('programmes' in classSizes ? classSizes.programmes : classSizes.studyTracks) : {}}
              cypress={`${level}-median-bar-chart-faculty`}
              data={levelProgrammeData[expandKey].data}
              expandKey={expandKey}
              goal={goal ?? 0}
              goalExceptions={goalExceptions}
              handleClick={handleClick}
              level={level}
              mode={mode}
              names={mode === 'faculty' ? (names as Record<string, Name | NameWithCode>) as any : undefined}
              title={title}
              yearLabel={yearLabel}
            />
          )}
        </Stack>
      )}
    </Box >
  )
}
