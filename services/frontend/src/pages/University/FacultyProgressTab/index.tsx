import { Box, Stack } from '@mui/material'
import { useState } from 'react'

import { facultyToolTips } from '@/common/InfoToolTips'
import { FacultyProgress } from '@/components/material/FacultyProgress'
import { Section } from '@/components/material/Section'
import { Toggle } from '@/components/material/Toggle'

export const FacultyProgressTab = () => {
  const [excludeGraduated, setExcludeGraduated] = useState(false)
  const [excludeSpecials, setIncludeSpecials] = useState(false)

  return (
    <Box>
      <Section
        cypress="InfoFacultyProgress"
        infoBoxContent={facultyToolTips.studentProgress}
        title="Progress of students of the university"
      >
        <Stack alignItems="center" direction={{ sm: 'column', md: 'row' }} justifyContent="space-around">
          <Toggle
            cypress="GraduatedToggle"
            firstLabel="Graduated included"
            infoBoxContent={facultyToolTips.graduatedToggle}
            secondLabel="Graduated excluded"
            setValue={setExcludeGraduated}
            value={excludeGraduated}
          />
          <Toggle
            cypress="StudentToggle"
            firstLabel="All study rights"
            infoBoxContent={facultyToolTips.studentToggle}
            secondLabel="Special study rights excluded"
            setValue={() => setIncludeSpecials(!excludeSpecials)}
            value={excludeSpecials}
          />
        </Stack>
      </Section>
      <FacultyProgress excludeGraduated={excludeGraduated} excludeSpecials={excludeSpecials} faculty="ALL" />
    </Box>
  )
}
