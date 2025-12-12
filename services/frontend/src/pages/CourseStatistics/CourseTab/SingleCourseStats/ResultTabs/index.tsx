import PersonIcon from '@mui/icons-material/Person'
import ReplayIcon from '@mui/icons-material/Replay'
import Tab from '@mui/material/Tab'
import Tabs from '@mui/material/Tabs'

import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router'

import type { CourseSearchState } from '@/pages/CourseStatistics'
import { AvailableStats, CourseStat, ProgrammeStats } from '@/types/courseStat'
import { parseQueryParams, queryParamsToString } from '@/util/queryparams'
import { ResultTab } from './tabs/ResultTab'

export const ResultTabs = ({
  availableStats,
  comparison,
  primary,
  separate,

  loading,
  toggleOpenAndRegularCourses,
  openOrRegular,
  alternatives,
}: {
  availableStats: AvailableStats
  comparison: ProgrammeStats | undefined
  primary: ProgrammeStats | undefined
  separate: boolean

  loading: boolean
  toggleOpenAndRegularCourses: (state: CourseSearchState) => void
  openOrRegular: CourseSearchState
  alternatives: CourseStat['alternatives']
}) => {
  const navigate = useNavigate()
  const location = useLocation()
  const [tab, setTab] = useState(0)

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
          alternatives={alternatives}
          availableStats={availableStats}
          datasets={[primary, comparison]}
          initialSettings={{ viewMode: 'STUDENTS', separate }}
          loading={loading}
          openOrRegular={openOrRegular}
          toggleOpenAndRegularCourses={toggleOpenAndRegularCourses}
          updateSeparate={updateSeparate}
          userHasAccessToAllStats={primary.userHasAccessToAllStats}
        />
      )}
      {tab === 1 && (
        <ResultTab
          alternatives={alternatives}
          availableStats={availableStats}
          datasets={[primary, comparison]}
          initialSettings={{ viewMode: 'ATTEMPTS', separate }}
          loading={loading}
          openOrRegular={openOrRegular}
          toggleOpenAndRegularCourses={toggleOpenAndRegularCourses}
          updateSeparate={updateSeparate}
          userHasAccessToAllStats={primary.userHasAccessToAllStats}
        />
      )}
    </>
  )
}
