import { Container } from '@mui/material'
import qs from 'query-string'
import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate, useLocation } from 'react-router'
import { Tab } from 'semantic-ui-react'

import { checkUserAccess, getFullStudyProgrammeRights } from '@/common'
import { useProgress, useTitle } from '@/common/hooks'
import { PageTitle } from '@/components/material/PageTitle'
import { AccessDeniedMessage } from '@/components/Routes/AccessDeniedMessage'
import { RootState } from '@/redux'
import { useGetAuthorizedUserQuery } from '@/redux/auth'
import { getCourseStats } from '@/redux/courseStats'
import { userHasAccessToAllCourseStats } from './courseStatisticsUtils'
import { FacultyLevelStatistics } from './FacultyLevelStatistics'
import { SearchForm } from './SearchForm'
import { SingleCourseTab } from './SingleCourseTab'
import { SummaryTab } from './SummaryTab'

const MENU = {
  SUM: 'Summary',
  COURSE: 'Course',
  QUERY: 'New query',
  FACULTY: 'Faculty statistics',
} as const

export const CourseStatistics = () => {
  useTitle('Course statistics')

  const navigate = useNavigate()
  const location = useLocation()
  const dispatch = useDispatch()
  const { programmeRights, roles } = useGetAuthorizedUserQuery()
  const { pending: loading, data: courseStatsData } = useSelector((state: RootState) => state.courseStats)
  const courses = Object.keys(courseStatsData)
  const statsIsEmpty = courses.length === 0
  const singleCourseStats = courses.length === 1
  const initialCourseCode = courses[0] || ''

  const [activeIndex, setActiveIndex] = useState(0)
  const [selected, setSelected] = useState(initialCourseCode)
  const { onProgress, progress } = useProgress(loading)

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
      setActiveIndex(0)
    }
  }, [initialCourseCode, statsIsEmpty])

  const switchToCourse = (courseCode: string) => {
    setActiveIndex(1)
    setSelected(courseCode)
  }

  const fullStudyProgrammeRights = getFullStudyProgrammeRights(programmeRights)
  const userHasAccessToAllStats = userHasAccessToAllCourseStats(roles, fullStudyProgrammeRights)

  const getPanes = () => {
    let panes: any[] = [
      {
        menuItem: MENU.SUM,
        render: () => <SummaryTab onClickCourse={switchToCourse} />,
      },
      {
        menuItem: MENU.COURSE,
        render: () => (
          <SingleCourseTab
            selected={selected}
            setSelected={setSelected}
            userHasAccessToAllStats={userHasAccessToAllStats}
          />
        ),
      },
    ]

    if (userHasAccessToAllStats) {
      panes = [
        ...panes,
        {
          menuItem: MENU.FACULTY,
          render: () => <FacultyLevelStatistics />,
        },
      ]
    }

    panes = [
      ...panes,
      {
        menuItem: {
          key: 'query',
          content: MENU.QUERY,
          icon: 'search',
          position: 'right',
          onClick: () => navigate('/coursestatistics'),
        },
        render: () => null,
      },
    ]

    return !singleCourseStats ? panes : panes.filter(pane => pane.menuItem !== MENU.SUM)
  }

  const handleTabChange = (_: any, data: any) => {
    const { activeIndex, panes } = data
    if (panes[activeIndex].menuItem.key !== 'query') {
      setActiveIndex(activeIndex)
    }
  }

  if (!checkUserAccess(['courseStatistics', 'admin', 'fullSisuAccess'], roles) && fullStudyProgrammeRights.length < 1) {
    return <AccessDeniedMessage />
  }

  const panes = getPanes()

  return (
    <Container maxWidth="lg">
      <PageTitle title="Course statistics" />
      {statsIsEmpty || location.search === '' ? (
        <SearchForm onProgress={onProgress} progress={progress} />
      ) : (
        <Tab
          activeIndex={activeIndex}
          menu={{ attached: false, borderless: false }}
          onTabChange={handleTabChange}
          panes={panes}
        />
      )}
    </Container>
  )
}
