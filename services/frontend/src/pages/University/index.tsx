import Tab from '@mui/material/Tab'
import Tabs from '@mui/material/Tabs'

import { PageLayout } from '@/components/common/PageLayout'
import { PageTitle } from '@/components/common/PageTitle'
import { useTabs } from '@/hooks/tabs'
import { useTitle } from '@/hooks/title'
import { FacultyGraduationsTab } from './FacultyGraduationsTab'
import { FacultyProgressTab } from './FacultyProgressTab'

export const University = () => {
  useTitle('University')

  const [tab, setTab] = useTabs(2)

  return (
    <PageLayout maxWidth="lg">
      <PageTitle title="University" />
      <Tabs onChange={(_event, newTab) => setTab(newTab)} sx={{ marginBottom: 2 }} value={tab}>
        <Tab data-cy="faculty-progress-tab" label="Faculty progress" />
        <Tab data-cy="faculty-graduations-tab" label="Faculty graduations" />
      </Tabs>
      {tab === 0 && <FacultyProgressTab />}
      {tab === 1 && <FacultyGraduationsTab />}
    </PageLayout>
  )
}
