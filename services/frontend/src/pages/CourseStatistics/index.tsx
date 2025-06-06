import Box from '@mui/material/Box'
import Container from '@mui/material/Container'
import Tab from '@mui/material/Tab'
import Tabs from '@mui/material/Tabs'

import { useEffect, useState } from 'react'
import { useLocation } from 'react-router'

import { PageTitle } from '@/components/material/PageTitle'
import { AccessDeniedMessage } from '@/components/Routes/AccessDeniedMessage'
import { useProgress } from '@/hooks/progress'
import { useTabs } from '@/hooks/tabs'
import { useTitle } from '@/hooks/title'
import { useGetAuthorizedUserQuery } from '@/redux/auth'
import { getCourseStats } from '@/redux/courseStats'
import { useAppDispatch, useAppSelector } from '@/redux/hooks'
import { checkUserAccess, getFullStudyProgrammeRights, hasAccessToAllCourseStats } from '@/util/access'
import { parseQueryParams } from '@/util/queryparams'
import { CourseTab } from './CourseTab'
import { FacultyStatisticsTab } from './FacultyStatisticsTab'
import { NewQueryButton } from './NewQueryButton'
import { SearchForm } from './SearchForm'
import { SummaryTab } from './SummaryTab'

export const CourseStatistics = () => {
  const location = useLocation()
  const dispatch = useAppDispatch()
  const { programmeRights, roles } = useGetAuthorizedUserQuery()
  const { pending: loading, data: courseStatsData } = useAppSelector(state => state.courseStats)
  const courses = Object.keys(courseStatsData)
  const statsIsEmpty = courses.length === 0
  const singleCourseStats = courses.length === 1
  const initialCourseCode = courses[0] || ''

  const [selected, setSelected] = useState(initialCourseCode)
  const { onProgress, progress } = useProgress(loading)
  const [tab, setTab] = useTabs(3)
  useTitle(selected ? `${selected} - Course statistics` : 'Course statistics')

  useEffect(() => {
    setSelected(initialCourseCode)
  }, [initialCourseCode])

  useEffect(() => {
    const { courseCodes, ...params } = parseQueryParams(location.search)
    if (!courseCodes) {
      return
    }
    const query = {
      ...params,
      courseCodes: JSON.parse(courseCodes as string),
    }
    dispatch(getCourseStats(query, onProgress))
  }, [location.search])

  useEffect(() => {
    if (statsIsEmpty) {
      setSelected(initialCourseCode)
      setTab(0)
    }
  }, [initialCourseCode, statsIsEmpty])

  const switchToCourse = (courseCode: string) => {
    setTab(0)
    setSelected(courseCode)
  }

  const fullStudyProgrammeRights = getFullStudyProgrammeRights(programmeRights)
  const userHasAccessToAllStats = hasAccessToAllCourseStats(roles, fullStudyProgrammeRights)

  if (!checkUserAccess(['courseStatistics', 'admin', 'fullSisuAccess'], roles) && fullStudyProgrammeRights.length < 1) {
    return <AccessDeniedMessage />
  }

  return (
    <Container maxWidth="lg">
      <PageTitle title="Course statistics" />
      {statsIsEmpty || location.search === '' ? (
        <SearchForm onProgress={onProgress} progress={progress} />
      ) : (
        <>
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
              selected={selected}
              setSelected={setSelected}
              userHasAccessToAllStats={userHasAccessToAllStats}
            />
          )}
          {tab === 1 && !singleCourseStats && <SummaryTab onClickCourse={switchToCourse} />}
          {tab === 2 && userHasAccessToAllStats && <FacultyStatisticsTab />}
        </>
      )}
    </Container>
  )
}
