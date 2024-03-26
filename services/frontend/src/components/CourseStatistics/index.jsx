import qs from 'query-string'
import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useHistory } from 'react-router-dom'
import { Header, Message, Segment, Tab } from 'semantic-ui-react'

import { checkUserAccess, getFullStudyProgrammeRights } from '@/common'
import { useProgress, useTitle } from '@/common/hooks'
import { ProgressBar } from '@/components/ProgressBar'
import { useGetAuthorizedUserQuery } from '@/redux/auth'
import { clearCourseStats, getCourseStats } from '@/redux/coursestats'
import { userHasAccessToAllCourseStats } from './courseStatisticsUtils'
import { FacultyLevelStatistics } from './FacultyLevelStatistics'
import { SearchForm } from './SearchForm'
import { SingleCourseTab } from './SingleCourseTab'
import { ConnectedSummaryTab as SummaryTab } from './SummaryTab'
import './courseStatistics.css'

const MENU = {
  SUM: 'Summary',
  COURSE: 'Course',
  QUERY: 'New query',
  FACULTY: 'Faculty statistics',
}

export const CourseStatistics = () => {
  const history = useHistory()
  const dispatch = useDispatch()
  const { programmeRights, roles } = useGetAuthorizedUserQuery()
  const state = useSelector(state => state)
  const { courseStats } = state
  const { pending: loading } = courseStats
  const courses = Object.keys(courseStats.data)
  const statsIsEmpty = courses.length === 0
  const singleCourseStats = courses.length === 1
  const initCourseCode = courses[0] || ''

  const [activeIndex, setActiveIndex] = useState(0)
  const [selected, setSelected] = useState(initCourseCode)
  const { onProgress, progress } = useProgress(loading)
  useTitle('Course statistics')

  useEffect(() => {
    setSelected(initCourseCode)
  }, [initCourseCode])

  useEffect(() => {
    const { courseCodes, ...params } = qs.parse(history.location.search)
    if (!courseCodes) return
    const query = {
      ...params,
      courseCodes: JSON.parse(courseCodes),
    }
    dispatch(getCourseStats(query, onProgress))
  }, [history.location.search])

  useEffect(() => {
    if (statsIsEmpty) {
      setSelected(initCourseCode)
      setActiveIndex(0)
    }
  }, [statsIsEmpty])

  const switchToCourse = coursecode => {
    setActiveIndex(1)
    setSelected(coursecode)
  }

  const fullStudyProgrammeRights = getFullStudyProgrammeRights(programmeRights)

  const userHasAccessToAllStats = userHasAccessToAllCourseStats(roles, fullStudyProgrammeRights)

  const getPanes = () => {
    let panes = [
      {
        menuItem: MENU.SUM,
        render: () => <SummaryTab onClickCourse={switchToCourse} userHasAccessToAllStats={userHasAccessToAllStats} />,
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
          onClick: () => {
            history.push('/coursestatistics')
            dispatch(clearCourseStats)
          },
        },
        render: () => null,
      },
    ]

    return !singleCourseStats ? panes : panes.filter(pane => pane.menuItem !== MENU.SUM)
  }

  const handleTabChange = (_, { activeIndex, panes }) => {
    if (panes[activeIndex].menuItem.key !== 'query') {
      setActiveIndex(activeIndex)
    }
  }

  if (!checkUserAccess(['courseStatistics', 'admin'], roles) && fullStudyProgrammeRights.length < 1)
    return (
      <div className="segmentContainer">
        <Message
          color="red"
          error
          header="You have no rights to access any data. If you should have access please contact grp-toska@helsinki.fi"
        />
      </div>
    )

  const panes = getPanes()

  const getContent = () => {
    if (statsIsEmpty || history.location.search === '') {
      return <SearchForm onProgress={onProgress} />
    }

    return (
      <Tab
        activeIndex={activeIndex}
        menu={{ attached: false, borderless: false }}
        onTabChange={handleTabChange}
        panes={panes}
      />
    )
  }
  return (
    <div className="segmentContainer">
      <Header className="segmentTitle" size="large">
        Course statistics
      </Header>
      <Segment className="contentSegment">
        {getContent()}
        <ProgressBar fixed progress={progress} />
      </Segment>
    </div>
  )
}
