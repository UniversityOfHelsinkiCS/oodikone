import { Box } from '@mui/material'

import { AllGraduationStatsResponse } from '@/shared/types'
import { GraduationTimes } from './GraduationTimes'

export const FacultyGraduations = ({
  data,
  faculty,
  isError,
  isLoading,
  showMedian,
  universityMode,
}: {
  data: AllGraduationStatsResponse | undefined
  isError: boolean
  isLoading: boolean
  faculty?: string
  showMedian: boolean
  universityMode?: boolean
}) => {
  const medians = data?.byGradYear.medians
  const goals = data?.goals
  const goalExceptions = { ...goals?.exceptions, needed: faculty === 'H30' }
  const programmeData = data?.byGradYear.programmes.medians
  const facultyNames = data?.programmeNames
  const classSizes = data?.classSizes
  const commonProps = {
    classSizes,
    facultyNames,
    goalExceptions,
    groupBy: 'byGradYear' as const,
    isError,
    isLoading,
    mode: universityMode ? ('faculty' as const) : ('programme' as const),
    showMedian,
    yearLabel: 'Graduation year' as const,
  }

  return (
    <Box>
      <GraduationTimes
        data={medians?.bachelor}
        goal={goals?.bachelor}
        level="bachelor"
        levelProgrammeData={programmeData?.bachelor}
        title="Bachelor"
        {...commonProps}
      />
      <GraduationTimes
        data={medians?.bcMsCombo}
        goal={goals?.bcMsCombo}
        level="bcMsCombo"
        levelProgrammeData={programmeData?.bcMsCombo}
        title="Bachelor + Master"
        {...commonProps}
      />
      <GraduationTimes
        data={medians?.master}
        goal={goals?.master}
        level="master"
        levelProgrammeData={programmeData?.master}
        title="Master"
        {...commonProps}
      />
      <GraduationTimes
        data={medians?.doctor}
        goal={goals?.doctor}
        level="doctor"
        levelProgrammeData={programmeData?.doctor}
        title="Doctor"
        {...commonProps}
      />
    </Box>
  )
}
