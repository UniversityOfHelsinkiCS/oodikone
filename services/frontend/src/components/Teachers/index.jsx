import { useHistory, useParams } from 'react-router-dom'
import { Header, Segment, Tab } from 'semantic-ui-react'

import { useTabs, useTitle } from '@/common/hooks'
import { useGetAuthorizedUserQuery } from '@/redux/auth'
import { TeacherDetails } from './TeacherDetails'
import { TeacherLeaderBoard } from './TeacherLeaderBoard'
import { TeacherSearchTab } from './TeacherSearchTab'
import { TeacherStatistics } from './TeacherStatistics'
import { hasFullAccessToTeacherData } from './util'

const pane = (title, Content, icon) => ({
  menuItem: { key: title, content: title, icon },
  render: () => (
    <Tab.Pane style={{ borderWidth: '0' }}>
      <Content />
    </Tab.Pane>
  ),
})

const TeachersTabs = () => {
  const history = useHistory()
  const { roles, iamGroups } = useGetAuthorizedUserQuery()
  const [tab, setTab] = useTabs('t_tab', 0, history)
  const panes = [pane('Statistics', TeacherStatistics, 'table')]
  if (hasFullAccessToTeacherData(roles, iamGroups)) {
    panes.push(pane('Leaderboard', TeacherLeaderBoard, 'trophy'), pane('Search', TeacherSearchTab, 'user'))
  }

  return (
    <Tab
      activeIndex={tab}
      menu={{ attached: false, borderless: true, tabular: true }}
      onTabChange={setTab}
      panes={panes}
    />
  )
}

export const Teachers = () => {
  useTitle('Teachers')
  const { teacherid } = useParams()
  return (
    <div className="segmentContainer">
      <Header className="segmentTitle" content="Teacher statistics" size="large" />
      <Segment className="contentSegment">
        {teacherid ? <TeacherDetails teacherId={teacherid} /> : <TeachersTabs />}
      </Segment>
    </div>
  )
}
