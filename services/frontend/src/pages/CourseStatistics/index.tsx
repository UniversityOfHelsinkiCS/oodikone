import { Container, Tab, Tabs } from '@mui/material'
import qs from 'query-string'
import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useLocation } from 'react-router'

import { checkUserAccess, getFullStudyProgrammeRights } from '@/common'
import { PageTitle } from '@/components/material/PageTitle'
import { AccessDeniedMessage } from '@/components/Routes/AccessDeniedMessage'
import { useProgress } from '@/hooks/progress'
import { useTabs } from '@/hooks/tabs'
import { useTitle } from '@/hooks/title'
import { RootState } from '@/redux'
import { useGetAuthorizedUserQuery } from '@/redux/auth'
import { getCourseStats } from '@/redux/courseStats'
import { userHasAccessToAllCourseStats } from './courseStatisticsUtils'
import { FacultyStatisticsTab } from './FacultyStatisticsTab'
import { SearchForm } from './SearchForm'
import { SingleCourseTab } from './SingleCourseTab'
import { SummaryTab } from './SummaryTab'

export const CourseStatistics = () => {
  useTitle('Course statistics')

  const location = useLocation()
  const dispatch = useDispatch()
  const { programmeRights, roles } = useGetAuthorizedUserQuery()
  const { pending: loading, data: courseStatsData } = useSelector((state: RootState) => state.courseStats)
  const courses = Object.keys(courseStatsData)
  const statsIsEmpty = courses.length === 0
  const singleCourseStats = courses.length === 1
  const initialCourseCode = courses[0] || ''

  const [selected, setSelected] = useState(initialCourseCode)
  const { onProgress, progress } = useProgress(loading)
  const [tab, handleTabChange, switchToTab] = useTabs(3)

  useEffect(() => {
    setSelected(initialCourseCode)
  }, [initialCourseCode])

  useEffect(() => {
    const { courseCodes, ...params } = qs.parse(location.search)
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
      switchToTab(0)
    }
  }, [initialCourseCode, statsIsEmpty])

  const switchToCourse = (courseCode: string) => {
    switchToTab(0)
    setSelected(courseCode)
  }

  const fullStudyProgrammeRights = getFullStudyProgrammeRights(programmeRights)
  const userHasAccessToAllStats = userHasAccessToAllCourseStats(roles, fullStudyProgrammeRights)

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
          <Tabs onChange={(event, newValue) => handleTabChange(event, { activeIndex: newValue })} value={tab}>
            <Tab data-cy="CourseTab" label="Course" />
            <Tab data-cy="SummaryTab" disabled={singleCourseStats} label="Summary" />
            <Tab data-cy="FacultyStatisticsTab" disabled={!userHasAccessToAllStats} label="Faculty statistics" />
          </Tabs>
          {tab === 0 && (
            <SingleCourseTab
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
