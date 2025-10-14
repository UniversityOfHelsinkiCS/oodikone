import Box from '@mui/material/Box'
import Paper from '@mui/material/Paper'
import Tab from '@mui/material/Tab'
import Tabs from '@mui/material/Tabs'
import Typography from '@mui/material/Typography'
import { useParams } from 'react-router'

import { useTabs } from '@/hooks/tabs'

import { useTitle } from '@/hooks/title'
import { useGetAuthorizedUserQuery } from '@/redux/auth'
import { hasFullAccessToTeacherData } from '@/util/access'
import { TeacherDetails } from './TeacherDetails'
import { TeacherLeaderBoard } from './TeacherLeaderBoard'
import { TeacherSearchTab } from './TeacherSearchTab'
import { TeacherStatistics } from './TeacherStatistics'

const pane = (label, Content, icon) => ({
  label,
  icon,
  render: () => <Content />,
})

const TeachersTabs = () => {
  const { roles, iamGroups } = useGetAuthorizedUserQuery()
  const [tab, setTab] = useTabs(3, 't')

  const panes = [pane('Statistics', TeacherStatistics, 'table')]
  if (hasFullAccessToTeacherData(roles, iamGroups)) {
    panes.push(pane('Leaderboard', TeacherLeaderBoard, 'trophy'), pane('Search', TeacherSearchTab, 'user'))
  }

  return (
    <Box>
      <Tabs onChange={(_, newTab) => setTab(newTab)} value={tab}>
        {panes.map(({ label }) => (
          <Tab key={label} label={label} />
        ))}
      </Tabs>
      {panes.at(tab)?.render()}
    </Box>
  )
}

export const Teachers = () => {
  useTitle('Teachers')
  const { teacherid } = useParams()

  return (
    <div className="segmentContainer">
      <Typography className="segmentTitle" variant="h4">
        Teacher statistics
      </Typography>
      <Paper className="contentSegment">
        {teacherid ? <TeacherDetails teacherId={teacherid} /> : <TeachersTabs />}
      </Paper>
    </div>
  )
}
