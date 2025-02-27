import { Stack } from '@mui/material'
import { useState } from 'react'

import { facultyToolTips } from '@/common/InfoToolTips'
import { FacultyGraduations } from '@/components/material/FacultyGraduations'
import { Section } from '@/components/material/Section'
import { Toggle } from '@/components/material/Toggle'
import { ToggleContainer } from '@/components/material/ToggleContainer'
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
