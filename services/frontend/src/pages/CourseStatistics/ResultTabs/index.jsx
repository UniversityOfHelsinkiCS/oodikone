import qs from 'query-string'
import { useCallback } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useLocation, useNavigate } from 'react-router'
import { Segment, Tab } from 'semantic-ui-react'

import { useProgress, useTabs } from '@/common/hooks'
import { getCourseStats } from '@/redux/courseStats'
import { AttemptsPane } from './panes/AttemptsPane'
import { StudentsPane } from './panes/StudentsPane'
import './resultTabs.css'

export const ResultTabs = ({ primary, comparison, separate, availableStats }) => {
  const navigate = useNavigate()
  const location = useLocation()
  const replace = useCallback(options => navigate(options, { replace: true }), [navigate])
  const [tab, setTab] = useTabs('cs_tab', 0, { location, replace })
  const { userHasAccessToAllStats } = primary
  const courseStats = useSelector(({ courseStats }) => courseStats)
  const { pending: loading } = courseStats
  const { onProgress } = useProgress(loading)
  const dispatch = useDispatch()

  const handleTabChange = (...params) => {
    setTab(...params)
  }

  const updateSeparate = separate => {
    // Only proceed if we're still on the coursestatistics page
    if (!location.pathname.includes('coursestatistics')) {
      return
    }

    const { courseCodes, ...params } = qs.parse(location.search)
    const query = {
      ...params,
      courseCodes: JSON.parse(courseCodes),
      separate,
    }
    dispatch(getCourseStats(query, onProgress))
    const queryToString = { ...query, courseCodes: JSON.stringify(query.courseCodes) }
    navigate({ search: qs.stringify(queryToString) }, { replace: true })
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
  ]

  const panes = paneTypes.map(({ icon, label, component: Component }) => ({
    menuItem: { icon, content: label, key: label },
    render: () => (
      <Component
        availableStats={availableStats}
        datasets={[primary, comparison]}
        separate={separate}
        updateQuery={updateSeparate}
        userHasAccessToAllStats={userHasAccessToAllStats}
      />
    ),
  }))

  return (
    <Segment loading={loading}>
      <Tab activeIndex={tab} id="CourseStatPanes" onTabChange={handleTabChange} panes={panes} />
    </Segment>
  )
}
