import Backdrop from '@mui/material/Backdrop'
import Box from '@mui/material/Box'
import CircularProgress from '@mui/material/CircularProgress'
import Container from '@mui/material/Container'
import Tab from '@mui/material/Tab'
import Tabs from '@mui/material/Tabs'

import { useEffect, useState } from 'react'
import { useLocation } from 'react-router'

import { PageTitle } from '@/components/material/PageTitle'
import { AccessDeniedMessage } from '@/components/Routes/AccessDeniedMessage'
import { useTabs } from '@/hooks/tabs'
import { useTitle } from '@/hooks/title'
import { RootState } from '@/redux'
import { useGetAuthorizedUserQuery } from '@/redux/auth'
import { useGetCourseStatsQuery } from '@/redux/courseStats'
import { useAppSelector } from '@/redux/hooks'
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
  getCourseAlternatives,
  getCourseStats,
  getSummaryStatistics,
} from './util'

export const CourseStatistics = () => {
  const { programmeRights, roles } = useGetAuthorizedUserQuery()
  const fullStudyProgrammeRights = getFullStudyProgrammeRights(programmeRights)
  const userHasAccessToAllStats = hasAccessToAllCourseStats(roles, fullStudyProgrammeRights)

  const location = useLocation()
  const { tab: _, courseCodes, ...params } = parseQueryParams(location.search)
  const skipQuery = !courseCodes

  const { data: courseStatsData = {}, isFetching: loading } = useGetCourseStatsQuery(
    {
      ...params,
      codes: JSON.parse(courseCodes ?? '[]'),
    },
    {
      skip: skipQuery,
    }
  )

  const courses = Object.keys(courseStatsData)
  const statsIsEmpty = courses.length === 0
  const singleCourseStats = courses.length === 1
  const initialCourseCode = courses.at(0)

  const openOrRegular = useAppSelector((state: RootState) => state.courseSearch.openOrRegular)

  const [courseSummaryFormProgrammes, setCourseSummaryFormProgrammes] = useState<string[]>([ALL.value])
  const [tab, setTab] = useTabs(/* max tabs */ 3)

  const [selected, setSelected] = useState(initialCourseCode)
  useTitle(selected ? `${selected} - Course statistics` : 'Course statistics')

  useEffect(() => {
    setSelected(initialCourseCode)
    if (statsIsEmpty) setTab(0)
  }, [initialCourseCode])

  const switchToCourse = (courseCode: string) => {
    setSelected(courseCode)
    setTab(0)
  }

  if (!checkUserAccess(['courseStatistics', 'admin', 'fullSisuAccess'], roles) && !fullStudyProgrammeRights.length) {
    return <AccessDeniedMessage />
  }

  if (skipQuery)
    return (
      <Container maxWidth="lg">
        <PageTitle title="Course statistics" />
        <SearchForm />
      </Container>
    )

  const stats = getCourseStats(courseStatsData, openOrRegular)
  const availableStats = getAvailableStats(courseStatsData)
  const alternatives = getCourseAlternatives(courseStatsData, openOrRegular, selected)
  const programmes = getAllStudyProgrammes(stats, selected)
  const statistics = getSummaryStatistics(stats, programmes, courseSummaryFormProgrammes, userHasAccessToAllStats)

  return (
    <Container maxWidth="lg">
      <Backdrop
        open={loading}
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
          availableStats={availableStats}
          loading={loading}
          openOrRegular={openOrRegular}
          programmes={programmes}
          selected={selected}
          setSelected={setSelected}
          stats={stats}
          userHasAccessToAllStats={userHasAccessToAllStats}
        />
      )}
      {tab === 1 && !singleCourseStats && (
        <SummaryTab
          courseSummaryFormProgrammes={courseSummaryFormProgrammes}
          onClickCourse={switchToCourse}
          programmes={programmes}
          setCourseSummaryFormProgrammes={setCourseSummaryFormProgrammes}
          statistics={statistics}
        />
      )}
      {tab === 2 && userHasAccessToAllStats ? (
        <FacultyStatisticsTab courseStats={courseStatsData} openOrRegular={openOrRegular} />
      ) : null}
    </Container>
  )
}
