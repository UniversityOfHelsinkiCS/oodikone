import { Box } from '@mui/material'
import { useState } from 'react'

import { facultyToolTips } from '@/common/InfoToolTips'
import { FacultyGraduations } from '@/components/material/FacultyGraduations'
import { Section } from '@/components/material/Section'
import { Toggle } from '@/components/material/Toggle'
import { useGetAllFacultiesGraduationStatsQuery } from '@/redux/facultyStats'

export const FacultyGraduationsTab = () => {
  const { data, isFetching, isLoading, isError } = useGetAllFacultiesGraduationStatsQuery()

  const [medianMode, setMedianMode] = useState(false)

  return (
    <Box>
      <Section
        cypress="AverageGraduationTimes"
        infoBoxContent={facultyToolTips.averageGraduationTimes}
        title="Average graduation times"
      >
        <Box display="flex" justifyContent="center">
          <Toggle
            cypress="GraduationTimeToggle"
            disabled={isFetching || isLoading || isError}
            firstLabel="Breakdown"
            secondLabel="Median times"
            setValue={() => setMedianMode(!medianMode)}
            value={medianMode}
          />
        </Box>
      </Section>
      <FacultyGraduations
        data={data}
        isError={isError}
        isLoading={isFetching || isLoading}
        showMedian={medianMode}
        universityMode
      />
    </Box>
  )
}
