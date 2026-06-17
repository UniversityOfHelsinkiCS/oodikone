import Stack from '@mui/material/Stack'

import { GraduationTimes, GraduationTimesProps } from '@/components/GraduationTimes'
import { ClassSizes, UniversityGraduationStatistics } from '@oodikone/shared/types/graduations'

type UniFacultyGraduationsProps = {
  isError: boolean
  isLoading: boolean
  showMedian: boolean
  faculty?: string
  universityMode: true
  data: UniversityGraduationStatistics | undefined
}

/**
* This component should be merged with the one used in faculties tab,
* but is left as an exercise to a future oodikone developer.
*/
export const FacultyGraduations = ({
  data,
  faculty,
  isError,
  isLoading,
  showMedian,
  universityMode,
}: UniFacultyGraduationsProps) => {
  const medians = data?.byGradYear.medians
  const goals = data?.goals
  const goalExceptions = { ...goals?.exceptions, needed: faculty === 'H30' }
  const programmeData = data?.byGradYear.programmes.medians
  const facultyNames = data?.programmeNames
  const classSizes = data?.classSizes as ClassSizes // illegal override, underlying type is acually correct

  const commonProps: Omit<GraduationTimesProps, 'data' | 'goal' | 'level' | 'title'> = {
    allowExpand: true,
    classSizes,
    names: facultyNames,
    goalExceptions,
    groupBy: 'byGradYear' as const,
    isError,
    isLoading,
    mode: universityMode ? ('faculty' as const) : ('programme' as const),
    showMedian,
    yearLabel: 'Graduation year' as const,
  } as const

  return (
    <Stack gap={2}>
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
    </Stack>
  )
}
