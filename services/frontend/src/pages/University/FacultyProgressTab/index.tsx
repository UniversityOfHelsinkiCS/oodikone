import Stack from '@mui/material/Stack'

import { useState } from 'react'

import { facultyToolTips } from '@/common/InfoToolTips'
import { Toggle } from '@/components/common/toggle/Toggle'
import { ToggleContainer } from '@/components/common/toggle/ToggleContainer'
import { FacultyProgress } from '@/components/Faculties/FacultyProgress'
import { Section } from '@/components/Section'
import { useGetAllFacultiesProgressStatsQuery } from '@/redux/facultyStats'

export const FacultyProgressTab = () => {
  const [excludeGraduated, setExcludeGraduated] = useState(false)
  const [excludeSpecials, setIncludeSpecials] = useState(false)

  const progressStats = useGetAllFacultiesProgressStatsQuery({
    graduated: excludeGraduated ? 'GRADUATED_EXCLUDED' : 'GRADUATED_INCLUDED',
    includeSpecials: !excludeSpecials,
  })

  return (
    <Stack gap={2}>
      <Section
        cypress="faculty-progress"
        infoBoxContent={facultyToolTips.studentProgress}
        title="Progress of students of the university"
      >
        <ToggleContainer>
          <Toggle
            cypress="graduated-toggle"
            disabled={progressStats.isLoading || progressStats.isError}
            firstLabel="Graduated included"
            infoBoxContent={facultyToolTips.graduatedToggle}
            secondLabel="Graduated excluded"
            setValue={setExcludeGraduated}
            value={excludeGraduated}
          />
          <Toggle
            cypress="study-right-toggle"
            disabled={progressStats.isLoading || progressStats.isError}
            firstLabel="All study rights"
            infoBoxContent={facultyToolTips.studyRightToggle}
            secondLabel="Special study rights excluded"
            setValue={() => setIncludeSpecials(!excludeSpecials)}
            value={excludeSpecials}
          />
        </ToggleContainer>
      </Section>
      <FacultyProgress
        faculty="ALL"
        isError={progressStats?.isError}
        isLoading={progressStats?.isLoading}
        progressStats={progressStats?.data}
      />
    </Stack>
  )
}
