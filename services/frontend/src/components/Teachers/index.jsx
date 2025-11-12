import Box from '@mui/material/Box'
import Paper from '@mui/material/Paper'
import Tab from '@mui/material/Tab'
import Tabs from '@mui/material/Tabs'
import { useParams } from 'react-router'

import { PageTitle } from '@/components/material/PageTitle'
import { useTabs } from '@/hooks/tabs'

import { useTitle } from '@/hooks/title'
import { useGetAuthorizedUserQuery } from '@/redux/auth'
import { hasFullAccessToTeacherData } from '@/util/access'
import { TeacherDetails } from './TeacherDetails'
import { TeacherLeaderBoard } from './TeacherLeaderBoard'
import { TeacherSearchTab } from './TeacherSearchTab'
import { TeacherStatistics } from './TeacherStatistics'

const TeachersTabs = () => {
  const { roles, iamGroups } = useGetAuthorizedUserQuery()
  const [tab, setTab] = useTabs(3, 't')

  const panes = [{ label: 'Statistics', render: () => <TeacherStatistics /> }]
  if (hasFullAccessToTeacherData(roles, iamGroups)) {
    panes.push(
      { label: 'Leaderboard', render: () => <TeacherLeaderBoard /> },
      { label: 'Search', render: () => <TeacherSearchTab /> }
    )
  }

  return (
    <>
      <Tabs onChange={(_, newTab) => setTab(newTab)} value={tab}>
        {panes.map(({ label }) => (
          <Tab data-cy={label} key={label} label={label} />
        ))}
      </Tabs>
      {panes.at(tab)?.render() ?? null}
    </>
  )
}

export const Teachers = () => {
  useTitle('Teachers')
  const { teacherid } = useParams()

  return (
    <Box maxWidth="md" mx="auto">
      <PageTitle title="Teacher statistics" />
      <Paper elevation={0}>{teacherid ? <TeacherDetails teacherId={teacherid} /> : <TeachersTabs />}</Paper>
    </Box>
  )
}
