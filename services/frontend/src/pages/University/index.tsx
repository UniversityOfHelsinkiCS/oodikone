import { Container, Tab, Tabs } from '@mui/material'
import { useEffect, useState } from 'react'
import { useHistory, useLocation } from 'react-router-dom'

import { useTitle } from '@/common/hooks'
import { PageTitle } from '@/components/material/PageTitle'
import { FacultyGraduationsTab } from './FacultyGraduationsTab'
import { FacultyProgressTab } from './FacultyProgressTab'

export const University = () => {
  useTitle('University')

  const history = useHistory()
  const location = useLocation()

  const query = new URLSearchParams(location.search)
  const tabFromQuery = parseInt(query.get('tab') ?? '')
  const initialTab = [0, 1].includes(tabFromQuery) ? tabFromQuery : 0
  const [activeTab, setActiveTab] = useState(initialTab)

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
      <Tabs onChange={handleTabChange} sx={{ marginBottom: 2 }} value={activeTab}>
        <Tab data-cy="FacultyProgressTab" label="Faculty progress" />
        <Tab data-cy="FacultyGraduationsTab" label="Faculty graduations" />
      </Tabs>
      {activeTab === 0 && <FacultyProgressTab />}
      {activeTab === 1 && <FacultyGraduationsTab />}
    </Container>
  )
}
