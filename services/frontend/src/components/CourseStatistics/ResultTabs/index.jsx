import qs from 'query-string'
import React from 'react'
import { useHistory, useLocation } from 'react-router-dom'
import { Segment, Tab } from 'semantic-ui-react'
import { useDispatch, useSelector } from 'react-redux'
import { useProgress, useTabs } from 'common/hooks'
import { getCourseStats } from 'redux/coursestats'
import { AttemptsPane } from './panes/AttemptsPane'
import { GradeDistributionPane } from './panes/GradeDistributionPane'
import { StudentsPane } from './panes/StudentsPane'
import './resultTabs.css'

export const ResultTabs = ({ primary, comparison, separate, availableStats }) => {
  const history = useHistory()
  const location = useLocation()
  const [tab, setTab] = useTabs('cs_tab', 0, history)
  const { userHasAccessToAllStats } = primary
  const courseStats = useSelector(({ courseStats }) => courseStats)
  const { pending: loading } = courseStats
  const { onProgress } = useProgress(loading)
  const dispatch = useDispatch()

  const handleTabChange = (...params) => {
    setTab(...params)
  }

  const updateSeparate = separate => {
    const { courseCodes, ...params } = qs.parse(location.search)
    const query = {
      ...params,
      courseCodes: JSON.parse(courseCodes),
      separate,
    }
    dispatch(getCourseStats(query, onProgress))
    const queryToString = { ...query, courseCodes: JSON.stringify(query.courseCodes) }
    history.replace({ search: qs.stringify(queryToString) })
  }

  const paneTypes = [
    {
      label: 'Students',
      icon: 'user',
      component: StudentsPane,
    },
    {
      label: 'Attempts',
      icon: 'redo',
      component: AttemptsPane,
    },
    {
      label: 'Grade distribution',
      icon: 'chart bar',
      component: GradeDistributionPane,
    },
  ]

  const panes = paneTypes.map(({ icon, label, component: Component }) => ({
    menuItem: { icon, content: label, key: label },
    render: () => (
      <Component
        availableStats={availableStats}
        datasets={[primary, comparison]}
        updateQuery={updateSeparate}
        userHasAccessToAllStats={userHasAccessToAllStats}
        separate={separate}
      />
    ),
  }))

  return (
    <Segment loading={loading}>
      <Tab id="CourseStatPanes" panes={panes} onTabChange={handleTabChange} activeIndex={tab} />
    </Segment>
  )
}
