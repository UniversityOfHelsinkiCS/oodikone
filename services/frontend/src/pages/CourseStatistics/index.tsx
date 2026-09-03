import Backdrop from '@mui/material/Backdrop'
import Box from '@mui/material/Box'
import CircularProgress from '@mui/material/CircularProgress'
import Tab from '@mui/material/Tab'
import Tabs from '@mui/material/Tabs'

import { useEffect, useState } from 'react'

import { PageLayout } from '@/components/common/PageLayout'
import { PageTitle } from '@/components/common/PageTitle'
import { AccessDeniedMessage } from '@/components/Routes/AccessDeniedMessage'
import { useTabs } from '@/hooks/tabs'
import { useTitle } from '@/hooks/title'
import { CourseTab } from '@/pages/CourseStatistics/CourseTab'
import { FacultyStatisticsTab } from '@/pages/CourseStatistics/FacultyStatisticsTab'
import { NewQueryButton } from '@/pages/CourseStatistics/NewQueryButton'
import { SearchForm } from '@/pages/CourseStatistics/SearchForm'
import { SummaryTab } from '@/pages/CourseStatistics/SummaryTab'
import {
  ALL,
  getAllStudyProgrammes,
  getAvailableStats,
  getCourseStats,
  getSummaryStatistics,
} from '@/pages/CourseStatistics/util'
import { useGetAuthorizedUserQuery } from '@/redux/auth'
import { useGetCourseStatsQuery } from '@/redux/courseStats'
import { checkUserAccess, getFullStudyProgrammeRights, hasAccessToAllCourseStats } from '@/util/access'
import { useParseQueryParams } from '@/util/queryparams'
import { yearToYearCode } from '@oodikone/shared/util'

export type CourseSearchState = 'openStats' | 'regularStats' | 'unifyStats'

// TODO: This view would probably benefit from using a context
// (We do _a little bit_ of prop drilling)
export const CourseStatistics = () => {
  'use memo'
  const { programmeRights, roles } = useGetAuthorizedUserQuery()
  const fullStudyProgrammeRights = getFullStudyProgrammeRights(programmeRights)
  const userHasAccessToAllStats = hasAccessToAllCourseStats(roles, fullStudyProgrammeRights)

  const [courseSummaryFormProgrammes, setCourseSummaryFormProgrammes] = useState<string[]>([ALL.value])
  const [openOrRegular, setOpenOrRegular] = useState<CourseSearchState>('unifyStats')
  const [tab, setTab] = useTabs(/* max tabs */ 3)

  const [fromYearCode, setFromYearCode] = useState(1)
  const [toYearCode, setToYearCode] = useState(yearToYearCode(new Date().getFullYear()))

  const { courses, separate, substitutions } = useParseQueryParams()
  const initialCourseCode = courses?.[0] ?? ''
  const singleCourseStats = courses?.length === 1

  const [selected, setSelected] = useState(initialCourseCode)

  const coursesKey = courses?.join(',') ?? 'empty'

  // Prevent state from becoming stale
  useEffect(() => {
    setSelected(current => {
      if (courses?.includes(current)) return current
      setFromYearCode(1)
      setToYearCode(yearToYearCode(new Date().getFullYear()))
      return courses?.[0] ?? ''
    })
  }, [coursesKey])

  const noCourseProvided = !initialCourseCode

  const {
    data: courseStatsData = {},
    isFetching,
    isLoading,
    isSuccess,
  } = useGetCourseStatsQuery(
    {
      courses: courses!,
      separate: separate?.[0] === 'true',
      substitutions: substitutions?.[0] === 'true',
      fromYearCode: fromYearCode.toString(),
      toYearCode: toYearCode.toString(),
    },
    { skip: noCourseProvided }
  )

  useTitle(
    selected && !isFetching
      ? `${courseStatsData[selected]?.regularStats.courseCode} - Course statistics`
      : 'Course statistics'
  )

  if (!checkUserAccess(['courseStatistics', 'admin', 'fullSisuAccess'], roles) && !fullStudyProgrammeRights.length) {
    return <AccessDeniedMessage />
  }

  if (noCourseProvided)
    return (
      <PageLayout maxWidth="lg">
        <PageTitle title="Course statistics" />
        <SearchForm />
      </PageLayout>
    )

  const stats = getCourseStats(courseStatsData, openOrRegular)
  const substitutionGroups = stats[selected]?.substitutionGroups
  const allProgrammes = getAllStudyProgrammes(stats, undefined)
  const programmes = getAllStudyProgrammes(stats, selected)
  const summaryStatistics = getSummaryStatistics(
    stats,
    allProgrammes,
    courseSummaryFormProgrammes,
    userHasAccessToAllStats
  )

  const availableStats = getAvailableStats(courseStatsData)

  return (
    <PageLayout maxWidth="lg">
      <Backdrop
        open={isLoading || !stats[selected]}
        sx={theme => ({ color: theme.palette.grey[300], zIndex: theme => theme.zIndex.drawer + 1 })}
      >
        <CircularProgress color="inherit" size="3em" />
      </Backdrop>
      <PageTitle title="Course statistics" />
      <Box sx={{ alignItems: 'center', display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
        <Tabs onChange={(_event, newTab) => setTab(newTab)} sx={{ flexGrow: 1 }} value={tab}>
          <Tab data-cy="CourseTab" label="Course" />
          <Tab data-cy="SummaryTab" disabled={singleCourseStats} label="Summary" />
          <Tab data-cy="FacultyStatisticsTab" disabled={!userHasAccessToAllStats} label="Faculty statistics" />
        </Tabs>
        <NewQueryButton />
      </Box>
      {tab === 0 && (
        <CourseTab
          substitutionGroups={substitutionGroups}
          availableStats={availableStats[selected]}
          substitutions={substitutions?.[0] === 'true'}
          loading={isFetching || !isSuccess}
          openOrRegular={openOrRegular}
          programmes={programmes}
          selected={selected}
          setSelected={setSelected}
          stats={stats}
          toggleOpenAndRegularCourses={setOpenOrRegular}
          userHasAccessToAllStats={userHasAccessToAllStats}
          toYearCode={toYearCode}
          fromYearCode={fromYearCode}
          setToYearCode={setToYearCode}
          setFromYearCode={setFromYearCode}
        />
      )}
      {tab === 1 && !singleCourseStats && (
        <SummaryTab
          courseSummaryFormProgrammes={courseSummaryFormProgrammes}
          onClickCourse={groupId => setSelected(groupId)}
          programmes={programmes}
          setCourseSummaryFormProgrammes={setCourseSummaryFormProgrammes}
          statistics={summaryStatistics}
        />
      )}
      {tab === 2 && userHasAccessToAllStats ? (
        <FacultyStatisticsTab courseStats={courseStatsData} openOrRegular={openOrRegular} />
      ) : null}
    </PageLayout>
  )
}
