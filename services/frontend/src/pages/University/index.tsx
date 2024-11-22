import { Box, Container, Stack, Tab, Tabs } from '@mui/material'
import { useEffect, useState } from 'react'
import { useHistory, useLocation } from 'react-router-dom'

import { useTitle } from '@/common/hooks'
import { facultyToolTips } from '@/common/InfoToolTips'
import { FacultyGraduations } from '@/components/material/FacultyGraduations'
import { FacultyProgress } from '@/components/material/FacultyProgress'
import { PageTitle } from '@/components/material/PageTitle'
import { Section } from '@/components/material/Section'
import { Toggle } from '@/components/material/Toggle'
import { useGetAllFacultiesGraduationStatsQuery } from '@/redux/facultyStats'
import { ExcludedMessage } from './ExcludedMessage'

export const University = () => {
  useTitle('University')

  const history = useHistory()
  const location = useLocation()

  const query = new URLSearchParams(location.search)
  const initialTab = parseInt(query.get('tab') ?? '0')
  const [activeTab, setActiveTab] = useState(initialTab)

  const [excludeGraduated, setExcludeGraduated] = useState(false)
  const [medianMode, setMedianMode] = useState(false)
  const [excludeSpecials, setIncludeSpecials] = useState(false)

  const graduationStats = useGetAllFacultiesGraduationStatsQuery({})

  const handleTabChange = (_event, newValue: number) => {
    setActiveTab(newValue)
    query.set('tab', newValue.toString())
    history.push({ search: query.toString() })
  }

  useEffect(() => {
    setActiveTab(initialTab)
  }, [initialTab])

  return (
    <Container maxWidth="lg">
      <PageTitle title="University" />
      <ExcludedMessage />
      <Tabs onChange={handleTabChange} sx={{ marginBottom: 2 }} value={activeTab}>
        <Tab label="Faculty progress" />
        <Tab label="Faculty graduations" />
      </Tabs>
      {activeTab === 0 && (
        <Box>
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
      )}
      {activeTab === 1 && (
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
      )}
    </Container>
  )
}
