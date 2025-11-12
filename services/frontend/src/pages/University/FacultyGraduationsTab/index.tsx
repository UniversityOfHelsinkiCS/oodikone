import Stack from '@mui/material/Stack'

import { useState } from 'react'

import { facultyToolTips } from '@/common/InfoToolTips'
import { Toggle } from '@/components/common/toggle/Toggle'
import { ToggleContainer } from '@/components/common/toggle/ToggleContainer'
import { FacultyGraduations } from '@/components/GraduationTimes/FacultyGraduations'
import { Section } from '@/components/Section'
import { useGetAllFacultiesGraduationStatsQuery } from '@/redux/facultyStats'

export const FacultyGraduationsTab = () => {
  const { data, isFetching, isLoading, isError } = useGetAllFacultiesGraduationStatsQuery()

  const [medianMode, setMedianMode] = useState(false)

  return (
    <Stack gap={2}>
      <Section
        cypress="average-graduation-times"
        infoBoxContent={facultyToolTips.averageGraduationTimes}
        title="Average graduation times"
      >
        <ToggleContainer>
          <Toggle
            cypress="graduation-time-toggle"
            disabled={isFetching || isLoading || isError}
            firstLabel="Breakdown"
            secondLabel="Median times"
            setValue={() => setMedianMode(!medianMode)}
            value={medianMode}
          />
        </ToggleContainer>
      </Section>
      <FacultyGraduations
        data={data}
        isError={isError}
        isLoading={isFetching || isLoading}
        showMedian={medianMode}
        universityMode
      />
    </Stack>
  )
}
