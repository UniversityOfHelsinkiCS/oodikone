import React, { useState, useEffect } from 'react'
import { Header, Segment, Tab, Message } from 'semantic-ui-react'
import { connect } from 'react-redux'
import { withRouter } from 'react-router-dom'
import { bool, shape, func, string, arrayOf } from 'prop-types'
import './courseStatistics.css'
import SearchForm from './SearchForm'
import SingleCourseTab from './SingleCourseTab'
import FacultyLevelStatistics from './FacultyLevelStatistics'
import CourseDiff from './CourseDiff'
import SummaryTab from './SummaryTab'
import ProgressBar from '../ProgressBar'
import { useProgress, useTitle } from '../../common/hooks'
import { clearCourseStats } from '../../redux/coursestats'
import { getUserRoles, checkUserAccess } from '../../common'
import { userHasAccessToAllCourseStats } from './courseStatisticsUtils'
import TSA from '../../common/tsa'

const ANALYTICS_CATEGORY = 'Course Statistics'
const sendAnalytics = (action, name, value) => TSA.Matomo.sendEvent(ANALYTICS_CATEGORY, action, name, value)

const MENU = {
  SUM: 'Summary',
  COURSE: 'Course',
  QUERY: 'New query',
  FACULTY: 'Faculty statistics'
}

const CourseStatistics = props => {
  const {
    singleCourseStats,
    clearCourseStats,
    history,
    statsIsEmpty,
    loading,
    initCourseCode,
    userRoles,
    rights,
    diffIsEmpty
  } = props

  const [activeIndex, setActiveIndex] = useState(0)
  const [selected, setSelected] = useState(initCourseCode)
  const [showDiff, setShowDiff] = useState(false)
  const { onProgress, progress } = useProgress(loading)
  useTitle('Course statistics')

  useEffect(() => {
    setSelected(initCourseCode)
  }, [initCourseCode])

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

  const userHasAccessToAllStats = userHasAccessToAllCourseStats(userRoles, rights)

  const getPanes = () => {
    let panes = [
      {
        menuItem: MENU.SUM,
        render: () => <SummaryTab onClickCourse={switchToCourse} userHasAccessToAllStats={userHasAccessToAllStats} />
      },
      {
        menuItem: MENU.COURSE,
        render: () => <SingleCourseTab selected={selected || initCourseCode} userHasAccessToAllStats={userHasAccessToAllStats} />
      },
    ]

    if (userHasAccessToAllStats) {
      panes = [...panes,
        {
          menuItem: MENU.FACULTY,
          render: () => <FacultyLevelStatistics />
        }
      ]
    }

    panes = [...panes,
      {
        menuItem: {
          key: 'query',
          content: MENU.QUERY,
          icon: 'search',
          position: 'right',
          onClick: () => {
            sendAnalytics('Clicked new query', 'Course stats')
            history.push('/coursestatistics')
            clearCourseStats()
          }
        },
        render: () => null
      }
    ]

    return !singleCourseStats ? panes : panes.filter(p => p.menuItem !== MENU.SUM)
  }

  const handleTabChange = (e, { activeIndex, panes }) => {
    if (panes[activeIndex].menuItem.key !== 'query') {
      setActiveIndex(activeIndex)
    }
  }
  if (!checkUserAccess(['courseStatistics', 'admin'], userRoles) && rights.length < 1)
    return (
      <div className="segmentContainer">
        <Message
          error
          color="red"
          header="You have no rights to access any data. If you should have access please contact grp-toska@helsinki.fi"
        />
      </div>
    )

  const panes = getPanes()

  const getContent = () => {
    if ((statsIsEmpty && diffIsEmpty) || history.location.search === '') {
      return (
        <SearchForm
          onProgress={onProgress}
          showDiff={showDiff}
          setShowDiff={setShowDiff}
        />
      )
    }
    if (showDiff) {
      return <CourseDiff />
    }
    return (
      <Tab
        menu={{ attached: false, borderless: false }}
        panes={panes}
        activeIndex={activeIndex}
        onTabChange={handleTabChange}
      />
    )
  }
  return (
    <div className="segmentContainer">
      <Header className="segmentTitle" size="large">
        Course Statistics
      </Header>
      <Segment className="contentSegment">
        {getContent()}
        <ProgressBar fixed progress={progress} />
      </Segment>
    </div>
  )
}

CourseStatistics.propTypes = {
  statsIsEmpty: bool.isRequired,
  singleCourseStats: bool.isRequired,
  history: shape({}).isRequired,
  clearCourseStats: func.isRequired,
  loading: bool.isRequired,
  initCourseCode: string.isRequired,
  userRoles: arrayOf(string).isRequired,
  rights: arrayOf(string).isRequired,
  diffIsEmpty: bool.isRequired
}

const mapStateToProps = ({
  courseStats,
  oodiSisDiff,
  auth: {
    token: { roles, rights }
  }
}) => {
  const courses = Object.keys(courseStats.data)
  return {
    userRoles: getUserRoles(roles),
    rights,
    pending: courseStats.pending || oodiSisDiff.pending,
    error: courseStats.error,
    statsIsEmpty: courses.length === 0,
    singleCourseStats: courses.length === 1,
    loading: courseStats.pending || oodiSisDiff.pending,
    initCourseCode: courses[0] || '',
    diffIsEmpty: Object.keys(oodiSisDiff.data).length === 0
  }
}

export default withRouter(
  connect(
    mapStateToProps,
    { clearCourseStats }
  )(CourseStatistics)
)
