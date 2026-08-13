import Tab from '@mui/material/Tab'
import Tabs from '@mui/material/Tabs'

import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router'

import type { CourseSearchState } from '@/pages/CourseStatistics'
import { ResultTab } from '@/pages/CourseStatistics/CourseTab/SingleCourseStats/ResultTabs/tabs/ResultTab'
import { PersonIcon, RefreshIcon } from '@/theme'
import { AvailableStats, ProgrammeStats } from '@/types/courseStat'
import { useParseQueryParams, queryParamsToString } from '@/util/queryparams'

export const ResultTabs = ({
  availableStats,
  comparison,
  primary,
  separate,

  loading,
  toggleOpenAndRegularCourses,
  openOrRegular,
  combineSubstitutions,
  courseCodes,
}: {
  availableStats: AvailableStats
  comparison: ProgrammeStats | undefined
  primary: ProgrammeStats | undefined
  separate: boolean

  loading: boolean
  toggleOpenAndRegularCourses: (state: CourseSearchState) => void
  openOrRegular: CourseSearchState
  combineSubstitutions: boolean
  courseCodes: string[]
}) => {
  const navigate = useNavigate()
  const [tab, setTab] = useState(0)

  const params = useParseQueryParams()

  if (!primary) {
    return null
  }

  const updateSeparate = (separate: boolean) => {
    const newQueryParams = {
      ...params,
      separate,
    }
    void navigate({ search: queryParamsToString(newQueryParams) }, { replace: true })
  }

  return (
    <>
      <Tabs onChange={() => setTab(tab ^ 1)} value={tab}>
        <Tab data-cy="StudentsTab" icon={<PersonIcon />} iconPosition="start" label="Students" />
        <Tab data-cy="AttemptsTab" icon={<RefreshIcon />} iconPosition="start" label="Attempts" />
      </Tabs>
      {tab === 0 && (
        <ResultTab
          availableStats={availableStats}
          combineSubstutitions={combineSubstitutions}
          courseCodes={courseCodes}
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
          availableStats={availableStats}
          combineSubstutitions={combineSubstitutions}
          courseCodes={courseCodes}
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
