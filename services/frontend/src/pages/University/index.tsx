import { Container, Tab, Tabs } from '@mui/material'

import { PageTitle } from '@/components/material/PageTitle'
import { useTabs } from '@/hooks/tabs'
import { useTitle } from '@/hooks/title'
import { FacultyGraduationsTab } from './FacultyGraduationsTab'
import { FacultyProgressTab } from './FacultyProgressTab'

export const University = () => {
  useTitle('University')

  const [tab, setTab] = useTabs(2)

  return (
    <Container maxWidth="lg">
      <PageTitle title="University" />
      <Tabs onChange={(_event, newTab) => setTab(newTab)} sx={{ marginBottom: 2 }} value={tab}>
        <Tab data-cy="FacultyProgressTab" label="Faculty progress" />
        <Tab data-cy="FacultyGraduationsTab" label="Faculty graduations" />
      </Tabs>
      {tab === 0 && <FacultyProgressTab />}
      {tab === 1 && <FacultyGraduationsTab />}
    </Container>
  )
}
