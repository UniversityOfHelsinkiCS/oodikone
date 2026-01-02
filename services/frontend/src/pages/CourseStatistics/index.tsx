import Backdrop from '@mui/material/Backdrop'
import Box from '@mui/material/Box'
import CircularProgress from '@mui/material/CircularProgress'
import Tab from '@mui/material/Tab'
import Tabs from '@mui/material/Tabs'

import { useEffect, useState } from 'react'
import { useLocation } from 'react-router'

import { PageLayout } from '@/components/common/PageLayout'
import { PageTitle } from '@/components/common/PageTitle'
import { AccessDeniedMessage } from '@/components/Routes/AccessDeniedMessage'
import { useTabs } from '@/hooks/tabs'
import { useTitle } from '@/hooks/title'
import { useGetAuthorizedUserQuery } from '@/redux/auth'
import { useGetCourseStatsQuery } from '@/redux/courseStats'
import { checkUserAccess, getFullStudyProgrammeRights, hasAccessToAllCourseStats } from '@/util/access'
import { parseQueryParams } from '@/util/queryparams'
import { CourseTab } from './CourseTab'
import { FacultyStatisticsTab } from './FacultyStatisticsTab'
import { NewQueryButton } from './NewQueryButton'
import { SearchForm } from './SearchForm'
import { SummaryTab } from './SummaryTab'
import {
  ALL,
  getAllStudyProgrammes,
  getAvailableStats,
  getCourseAlternativeCodes,
  getCourseStats,
  getSummaryStatistics,
} from './util'

export type CourseSearchState = 'openStats' | 'regularStats' | 'unifyStats'

export const CourseStatistics = () => {
  const { programmeRights, roles } = useGetAuthorizedUserQuery()
  const fullStudyProgrammeRights = getFullStudyProgrammeRights(programmeRights)
  const userHasAccessToAllStats = hasAccessToAllCourseStats(roles, fullStudyProgrammeRights)

  const [courseSummaryFormProgrammes, setCourseSummaryFormProgrammes] = useState<string[]>([ALL.value])
  const [openOrRegular, toggleOpenAndRegularCourses] = useState<CourseSearchState>('unifyStats')
  const [tab, setTab] = useTabs(/* max tabs */ 3)

  const location = useLocation()
  const { courseCodes, separate, combineSubstitutions } = parseQueryParams(location.search)

  const codes = JSON.parse(courseCodes ?? '[]')
  const [initialCourseCode] = codes
  const singleCourseStats = codes.length === 1

  const [selected, setSelected] = useState<string>('')
  useTitle(selected ? `${selected} - Course statistics` : 'Course statistics')

  const skipQuery = !initialCourseCode
  const {
    data: courseStatsData = {},
    isFetching: isLoading,
    isSuccess,
  } = useGetCourseStatsQuery({ codes, separate, combineSubstitutions }, { skip: skipQuery })

  useEffect(() => {
    setSelected(initialCourseCode)
  }, [initialCourseCode])

  if (!checkUserAccess(['courseStatistics', 'admin', 'fullSisuAccess'], roles) && !fullStudyProgrammeRights.length) {
    return <AccessDeniedMessage />
  }

  if (skipQuery)
    return (
      <PageLayout maxWidth="lg">
        <PageTitle title="Course statistics" />
        <SearchForm />
      </PageLayout>
    )

  const stats = getCourseStats(courseStatsData, openOrRegular)
  const alternatives = getCourseAlternativeCodes(stats, selected)
  const allProgrammes = getAllStudyProgrammes(stats, undefined)
  const programmes = getAllStudyProgrammes(stats, selected)
  const summaryStatistics = getSummaryStatistics(
    stats,
    allProgrammes,
    courseSummaryFormProgrammes,
    userHasAccessToAllStats
  )

  const availableStats = getAvailableStats(courseStatsData)

  const switchToCourse = (courseCode: string) => {
    setSelected(courseCode)
  }

  return (
    <PageLayout maxWidth="lg">
      <Backdrop
        open={isLoading}
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
          alternatives={alternatives}
          availableStats={availableStats[selected]}
          loading={isLoading || !isSuccess}
          openOrRegular={openOrRegular}
          programmes={programmes}
          selected={selected}
          setSelected={setSelected}
          stats={stats}
          toggleOpenAndRegularCourses={toggleOpenAndRegularCourses}
          userHasAccessToAllStats={userHasAccessToAllStats}
        />
      )}
      {tab === 1 && !singleCourseStats && (
        <SummaryTab
          courseSummaryFormProgrammes={courseSummaryFormProgrammes}
          onClickCourse={switchToCourse}
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
