import qs from 'query-string'
import React from 'react'
import { useHistory, useLocation } from 'react-router-dom'
import { Segment, Tab } from 'semantic-ui-react'
import { useDispatch, useSelector } from 'react-redux'
import { getCourseStats } from 'redux/coursestats'
import { useProgress, useTabs } from '../../../common/hooks'
import { AttemptsPane } from './Panes/attempts'
import { DistributionPane } from './Panes/distribution'
import { StudentsPane } from './Panes/students'
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
      initialSettings: { showDetails: false, separate },
      component: StudentsPane,
    },
    {
      label: 'Attempts',
      icon: 'redo',
      initialSettings: { separate },
      component: AttemptsPane,
    },
    {
      label: 'Grade distribution chart',
      icon: 'chart bar',
      initialSettings: { isRelative: false, viewMode: 'STUDENTS' },
      component: DistributionPane,
    },
  ]

  const panes = paneTypes.map(({ icon, label, initialSettings, component: Component }) => ({
    menuItem: { icon, content: label, key: label },
    render: () => (
      <Component
        updateQuery={updateSeparate}
        userHasAccessToAllStats={userHasAccessToAllStats}
        initialSettings={initialSettings}
        datasets={[primary, comparison]}
        availableStats={availableStats}
      />
    ),
  }))

  return (
    <Segment loading={loading} basic>
      <Tab id="CourseStatPanes" panes={panes} onTabChange={handleTabChange} activeIndex={tab} />
    </Segment>
  )
}
