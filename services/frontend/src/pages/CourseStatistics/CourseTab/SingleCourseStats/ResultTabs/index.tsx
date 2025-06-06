import PersonIcon from '@mui/icons-material/Person'
import ReplayIcon from '@mui/icons-material/Replay'
import Tab from '@mui/material/Tab'
import Tabs from '@mui/material/Tabs'

import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router'

import { useProgress } from '@/hooks/progress'
import { getCourseStats } from '@/redux/courseStats'
import { useAppDispatch, useAppSelector } from '@/redux/hooks'
import { AvailableStats, ProgrammeStats } from '@/types/courseStat'
import { parseQueryParams, queryParamsToString } from '@/util/queryparams'
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
  const courseStats = useAppSelector(state => state.courseStats)
  const { pending: loading } = courseStats
  const { onProgress } = useProgress(loading)
  const dispatch = useAppDispatch()

  if (!primary) {
    return null
  }

  const updateSeparate = (separate: boolean) => {
    if (!location.pathname.includes('coursestatistics')) {
      return
    }

    const { courseCodes, ...params } = parseQueryParams(location.search)
    const query = {
      ...params,
      courseCodes: JSON.parse(courseCodes as string),
      separate,
    }
    dispatch(getCourseStats(query, onProgress))
    const queryToString = { ...query, courseCodes: JSON.stringify(query.courseCodes) }
    void navigate({ search: queryParamsToString(queryToString) }, { replace: true })
  }

  return (
    <>
      <Tabs onChange={() => setTab(tab ^ 1)} value={tab}>
        <Tab data-cy="StudentsTab" icon={<PersonIcon />} iconPosition="start" label="Students" />
        <Tab data-cy="AttemptsTab" icon={<ReplayIcon />} iconPosition="start" label="Attempts" />
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
