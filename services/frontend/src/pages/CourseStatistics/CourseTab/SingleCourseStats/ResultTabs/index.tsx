import { Person as PersonIcon, Replay as ReplayIcon } from '@mui/icons-material'
import { Tab, Tabs } from '@mui/material'
import qs from 'query-string'
import { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useLocation, useNavigate } from 'react-router'

import { useProgress } from '@/hooks/progress'
import { RootState } from '@/redux'
import { getCourseStats } from '@/redux/courseStats'
import { AvailableStats, ProgrammeStats } from '@/types/courseStat'
import { ResultTab } from './tabs/ResultTab'

export const ResultTabs = ({
  availableStats,
  comparison,
  primary,
  separate,
}: {
  availableStats: AvailableStats
  comparison: ProgrammeStats | undefined
  primary: ProgrammeStats | undefined
  separate: boolean
}) => {
  const navigate = useNavigate()
  const location = useLocation()
  const [tab, setTab] = useState(0)
  const courseStats = useSelector((state: RootState) => state.courseStats)
  const { pending: loading } = courseStats
  const { onProgress } = useProgress(loading)
  const dispatch = useDispatch()

  if (!primary) {
    return null
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

  return (
    <>
      <Tabs onChange={() => setTab(tab ^ 1)} value={tab}>
        <Tab icon={<PersonIcon />} iconPosition="start" label="Students" />
        <Tab icon={<ReplayIcon />} iconPosition="start" label="Attempts" />
      </Tabs>
      {tab === 0 && (
        <ResultTab
          availableStats={availableStats}
          datasets={[primary, comparison]}
          initialSettings={{ viewMode: 'STUDENTS', separate }}
          loading={loading}
          updateSeparate={updateSeparate}
          userHasAccessToAllStats={primary.userHasAccessToAllStats}
        />
      )}
      {tab === 1 && (
        <ResultTab
          availableStats={availableStats}
          datasets={[primary, comparison]}
          initialSettings={{ viewMode: 'ATTEMPTS', separate }}
          loading={loading}
          updateSeparate={updateSeparate}
          userHasAccessToAllStats={primary.userHasAccessToAllStats}
        />
      )}
    </>
  )
}
