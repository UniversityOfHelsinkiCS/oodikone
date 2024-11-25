import { Box } from '@mui/material'
import { useState } from 'react'

import { facultyToolTips } from '@/common/InfoToolTips'
import { FacultyGraduations } from '@/components/material/FacultyGraduations'
import { Section } from '@/components/material/Section'
import { Toggle } from '@/components/material/Toggle'

export const FacultyGraduationsTab = () => {
  const [medianMode, setMedianMode] = useState(false)

  return (
    <Box>
      <Section infoBoxContent={facultyToolTips.averageGraduationTimes} title="Average graduation times">
        <Box display="flex" justifyContent="center">
          <Toggle
            cypress="GraduationTimeToggle"
            firstLabel="Breakdown"
            secondLabel="Median times"
            setValue={() => setMedianMode(!medianMode)}
            value={medianMode}
          />
        </Box>
      </Section>
      <FacultyGraduations showMedian={medianMode} universityMode />
    </Box>
  )
}
