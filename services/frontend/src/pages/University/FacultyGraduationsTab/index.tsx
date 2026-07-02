import Stack from '@mui/material/Stack'

import { useState } from 'react'

import { facultyToolTips } from '@/common/InfoToolTips'
import { ToggleContainer } from '@/components/common/toggle/ToggleContainer'
import { GraduationView } from '@/components/GraduationTimes'
import { FacultyGraduations } from '@/components/GraduationTimes/FacultyGraduations'
import { GraduationModeSelector } from '@/components/GraduationTimes/ModeSelector'
import { Section } from '@/components/Section'
import { useGetAllFacultiesGraduationStatsQuery } from '@/redux/facultyStats'

export const FacultyGraduationsTab = () => {
  const { data, isFetching, isError } = useGetAllFacultiesGraduationStatsQuery()

  const [view, setView] = useState<GraduationView>('breakdown')

  return (
    <Stack spacing={2}>
      <Section
        cypress="average-graduation-times"
        infoBoxContent={facultyToolTips.common.averageGraduationTimes}
        title="Average graduation times"
      >
        <ToggleContainer>
          <GraduationModeSelector disabled={isFetching || isError} setValue={setView} value={view} />
        </ToggleContainer>
      </Section>
      <FacultyGraduations data={data} isError={isError} isLoading={isFetching} universityMode view={view} />
    </Stack>
  )
}
