import qs from 'query-string'
import { useCallback } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useLocation, useNavigate } from 'react-router'
import { Tab } from 'semantic-ui-react'

import { Section } from '@/components/material/Section'
import { useProgress } from '@/hooks/progress'
import { useSemanticTabs } from '@/hooks/tabs'
import { RootState } from '@/redux'
import { getCourseStats } from '@/redux/courseStats'
import { ProgrammeStats } from '@/types/courseStat'
import { AttemptsPane } from './panes/AttemptsPane'
import { StudentsPane } from './panes/StudentsPane'

export const ResultTabs = ({
  availableStats,
  comparison,
  primary,
  separate,
}: {
  availableStats: { unify: boolean; open: boolean; university: boolean }
  comparison: ProgrammeStats | undefined
  primary: ProgrammeStats | undefined
  separate: boolean | null
}) => {
  const navigate = useNavigate()
  const location = useLocation()
  const replace = useCallback(options => navigate(options, { replace: true }), [navigate])
  const [tab, setTab] = useSemanticTabs('cs_tab', 0, { location, replace })
  const courseStats = useSelector((state: RootState) => state.courseStats)
  const { pending: loading } = courseStats
  const { onProgress } = useProgress(loading)
  const dispatch = useDispatch()

  if (!primary) {
    return null
  }

  const handleTabChange = (...params) => {
    setTab(...params)
  }

  const updateSeparate = (separate: boolean) => {
    if (!location.pathname.includes('coursestatistics')) {
      return
    }

    const { courseCodes, ...params } = qs.parse(location.search)
    const query = {
      ...params,
      courseCodes: JSON.parse(courseCodes as string),
      separate,
    }
    dispatch(getCourseStats(query, onProgress))
    const queryToString = { ...query, courseCodes: JSON.stringify(query.courseCodes) }
    void navigate({ search: qs.stringify(queryToString) }, { replace: true })
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
        userHasAccessToAllStats={primary.userHasAccessToAllStats}
      />
    ),
  }))

  return (
    <Section isLoading={loading}>
      <Tab activeIndex={tab} id="CourseStatPanes" onTabChange={handleTabChange} panes={panes} />
    </Section>
  )
}
