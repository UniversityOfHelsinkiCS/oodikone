import { Box } from '@mui/material'

import { useGetAllFacultiesGraduationStatsQuery } from '@/redux/facultyStats'
import { GraduationTimes } from './GraduationTimes'

export const FacultyGraduations = ({
  faculty,
  showMedian,
  universityMode,
}: {
  faculty?: string
  showMedian: boolean
  universityMode?: boolean
}) => {
  const graduationStats = useGetAllFacultiesGraduationStatsQuery()
  const data = graduationStats?.data?.byGradYear.medians
  const goals = graduationStats?.data?.goals
  const goalExceptions = { ...goals?.exceptions, needed: faculty === 'H30' }
  const programmeData = graduationStats?.data?.byGradYear.programmes.medians
  const programmeNames = graduationStats?.data?.programmeNames
  const classSizes = graduationStats?.data?.classSizes
  const commonProps = {
    classSizes,
    goalExceptions,
    groupBy: 'byGradYear',
    mode: universityMode ? 'faculty' : 'programme',
    programmeNames,
    showMedian,
    yearLabel: 'Graduation year',
  }

  return (
    <Box>
      <GraduationTimes
        data={data?.bachelor}
        goal={goals?.bachelor}
        level="bachelor"
        levelProgrammeData={programmeData?.bachelor}
        title="Bachelor"
        {...commonProps}
      />
      <GraduationTimes
        data={data?.bcMsCombo}
        goal={goals?.bcMsCombo}
        level="bcMsCombo"
        levelProgrammeData={programmeData?.bcMsCombo}
        title="Bachelor + Master"
        {...commonProps}
      />
      <GraduationTimes
        data={data?.master}
        goal={goals?.master}
        level="master"
        levelProgrammeData={programmeData?.master}
        title="Master"
        {...commonProps}
      />
      <GraduationTimes
        data={data?.doctor}
        goal={goals?.doctor}
        level="doctor"
        levelProgrammeData={programmeData?.doctor}
        title="Doctor"
        {...commonProps}
      />
    </Box>
  )
}
