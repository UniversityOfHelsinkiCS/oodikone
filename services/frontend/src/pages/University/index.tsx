import { Box, Container, Stack } from '@mui/material'
import { useState } from 'react'
import { Loader } from 'semantic-ui-react'

import { useTitle } from '@/common/hooks'
import { facultyToolTips } from '@/common/InfoToolTips'
import { FacultyGraduations } from '@/components/material/FacultyGraduations'
import { FacultyProgress } from '@/components/material/FacultyProgress'
import { PageTitle } from '@/components/material/PageTitle'
import { Section } from '@/components/material/Section'
import { Toggle } from '@/components/material/Toggle'
import { useGetAllFacultiesGraduationStatsQuery, useGetAllFacultiesProgressStatsQuery } from '@/redux/facultyStats'
import { ExcludedMessage } from './ExcludedMessage'

export const University = () => {
  useTitle('University')

  const [graduatedGroup, setGraduatedGroup] = useState(false)
  const [medianMode, setMedianMode] = useState(false)
  const [excludeSpecials, setIncludeSpecials] = useState(false)

  const progressStats = useGetAllFacultiesProgressStatsQuery({
    graduated: graduatedGroup ? 'GRADUATED_EXCLUDED' : 'GRADUATED_INCLUDED',
    includeSpecials: !excludeSpecials,
  })
  const graduationStats = useGetAllFacultiesGraduationStatsQuery({})

  if (graduationStats.isLoading || graduationStats.isFetching || progressStats.isFetching || progressStats.isLoading) {
    return <Loader active style={{ marginTop: '10em' }} />
  }

  const isError =
    progressStats.isError ||
    (progressStats.isSuccess && !progressStats.data) ||
    graduationStats.isError ||
    !graduationStats.data
  if (isError) {
    return <h3>Something went wrong, please try refreshing the page.</h3>
  }

  return (
    <Container maxWidth="xl">
      <PageTitle title="University" />
      <ExcludedMessage />
      <Stack>
        <Section
          cypress="InfoFacultyProgress"
          infoBoxContent={facultyToolTips.studentProgress}
          title="Progress of students of the university"
        >
          <Stack direction="row" justifyContent="space-around">
            <Toggle
              cypress="GraduatedToggle"
              firstLabel="Graduated included"
              infoBoxContent={facultyToolTips.graduatedToggle}
              secondLabel="Graduated excluded"
              setValue={setGraduatedGroup}
              value={graduatedGroup}
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
        <FacultyProgress faculty="ALL" progressStats={progressStats} />
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
          <FacultyGraduations
            graduationStats={graduationStats}
            groupByStartYear={false}
            showMedian={medianMode}
            universityMode
          />
        </Section>
      </Stack>
    </Container>
  )
}
