import React, { useCallback, useEffect } from 'react'
import { withRouter } from 'react-router-dom'
import { connect } from 'react-redux'
import { shape, string, arrayOf, func, bool } from 'prop-types'
import { Header, Segment, Tab, Button } from 'semantic-ui-react'
import { isEqual, uniqBy } from 'lodash'
import DegreeCoursesTable from './DegreeCourses'
import CourseCodeMapper from '../CourseCodeMapper'
import StudyProgrammeSelector from './StudyProgrammeSelector'
import Overview from './Overview'
import StudyTrackOverview from './StudyTrackOverview'
import AggregateView from '../CourseGroups/AggregateView'
import ThesisCourses from './ThesisCourses'
import PresentStudents from './PresentStudents'
import '../PopulationQueryCard/populationQueryCard.css'
import { getTextIn, getUserRoles, getUserIsAdmin, isNewHYStudyProgramme } from '../../common'
import { useTabs, useTitle } from '../../common/hooks'
import TSA from '../../common/tsa'
import Tags from './Tags'

import { getThroughput } from '../../redux/throughput'
import { getProductivity } from '../../redux/productivity'
import { getPresentStudents, clearPresentStudents } from '../../redux/presentStudents'
import { getDegreesAndProgrammes } from '../../redux/populationDegreesAndProgrammes'

import { callApi } from '../../apiConnection'
import useLanguage from '../LanguagePicker/useLanguage'

const StudyProgramme = props => {
  const { language } = useLanguage()
  const [tab, setTab] = useTabs('p_tab', props.match.params.courseGroupId ? 2 : 0, props.history)
  useTitle('Study programmes')

  useEffect(() => {
    props.getDegreesAndProgrammesDispatch()
  }, [])

  const refreshProductivity = () => {
    callApi('/v2/studyprogrammes/productivity/recalculate', 'get', null, {
      code: props.match.params.studyProgrammeId,
    })
      .then(() => {
        props.getProductivityDispatch(props.match.params.studyProgrammeId)
      })
      .catch(e => {
        if (e.message.toLowerCase() === 'network error') {
          window.location.reload(true)
        }
      })
  }
  const refreshThroughput = () => {
    callApi('/v2/studyprogrammes/throughput/recalculate', 'get', null, {
      code: props.match.params.studyProgrammeId,
    })
      .then(() => {
        props.getThroughputDispatch(props.match.params.studyProgrammeId)
      })
      .catch(e => {
        if (e.message.toLowerCase() === 'network error') {
          window.location.reload(true)
        }
      })
  }

  const getPanes = () => {
    const { match, rights, userRoles, programmes } = props
    const { studyProgrammeId, courseGroupId } = match.params
    const filteredStudytracks = programmes[studyProgrammeId]
      ? Object.values(programmes[studyProgrammeId].enrollmentStartYears).reduce((acc, curr) => {
          acc.push(...Object.values(curr.studyTracks))
          return uniqBy(acc, 'code')
        }, [])
      : []
    const panes = []
    panes.push({
      menuItem: 'Overview',
      render: () => <Overview studyprogramme={studyProgrammeId} history={props.history} />,
    })
    if (filteredStudytracks.length > 0) {
      panes.push({
        menuItem: 'Studytrack overview',
        render: () => (
          <StudyTrackOverview studyprogramme={studyProgrammeId} history={props.history} admin={props.isAdmin} />
        ),
      })
    }
    panes.push(
      {
        menuItem: 'Degree Courses',
        render: () => <DegreeCoursesTable studyProgramme={studyProgrammeId} />,
      },
      { menuItem: 'Code Mapper', render: () => <CourseCodeMapper studyprogramme={studyProgrammeId} /> }
    )

    if ((userRoles.includes('coursegroups') && rights.includes(studyProgrammeId)) || userRoles.includes('admin')) {
      panes.push({
        menuItem: 'Course Groups',
        render: () => <AggregateView programmeId={studyProgrammeId} courseGroupId={courseGroupId} />,
      })
    }
    panes.push({
      menuItem: 'Thesis Courses',
      render: () => <ThesisCourses studyprogramme={studyProgrammeId} />,
    })
    panes.push({
      menuItem: 'Tags',
      render: () => <Tags studyprogramme={studyProgrammeId} />,
    })
    if (!isNewHYStudyProgramme(studyProgrammeId)) {
      panes.push({
        menuItem: 'Present students',
        render: () => <PresentStudents />,
      })
    }
    if (props.isAdmin) {
      panes.push({
        menuItem: 'Admin',
        render: () => (
          <>
            <Button onClick={() => refreshThroughput()}>recalculate throughput</Button>
            <Button onClick={() => refreshProductivity()}>recalculate productivity</Button>
          </>
        ),
      })
    }
    return panes
  }

  const handleSelect = useCallback(
    programme => {
      props.history.push(`/study-programme/${programme}`, { selected: programme })
    },
    [props.history]
  )

  const { match, programmes } = props
  const { studyProgrammeId } = match.params
  const programmeName = programmes[studyProgrammeId] && getTextIn(programmes[studyProgrammeId].name, language)
  const panes = getPanes()

  useEffect(() => {
    if (studyProgrammeId && !isNewHYStudyProgramme(studyProgrammeId)) {
      props.clearPresentStudentsDispatch()
      props.getPresentStudentsDispatch(studyProgrammeId)
    }
  }, [studyProgrammeId])

  useEffect(() => {
    if (!programmeName) {
      return
    }

    TSA.Matomo.sendEvent('Programme Usage', 'study programme overview', programmeName)
    TSA.Influx.sendEvent({
      group: 'Programme Usage',
      name: 'study programme overview',
      label: programmeName,
      value: 1,
    })
  }, [programmeName])

  if (!studyProgrammeId)
    return (
      <div className="segmentContainer">
        <Header className="segmentTitle" size="large">
          Study Programme
        </Header>
        <Segment className="contentSegment">
          <StudyProgrammeSelector handleSelect={handleSelect} selected={studyProgrammeId !== undefined} />
        </Segment>
      </div>
    )

  return (
    <div className="segmentContainer">
      <Segment className="contentSegment">
        <div align="center" style={{ padding: '30px' }}>
          <Header textAlign="center">{programmeName}</Header>
          <span>{studyProgrammeId}</span>
        </div>
        <Tab panes={panes} activeIndex={tab} onTabChange={setTab} />
      </Segment>
    </div>
  )
}

StudyProgramme.propTypes = {
  match: shape({
    params: shape({
      studyProgrammeId: string,
      courseGroupId: string,
    }),
  }),
  programmes: shape({}),
  history: shape({}).isRequired,
  rights: arrayOf(string).isRequired,
  userRoles: arrayOf(string).isRequired,
  getProductivityDispatch: func.isRequired,
  getThroughputDispatch: func.isRequired,
  isAdmin: bool.isRequired,
  getPresentStudentsDispatch: func.isRequired,
  clearPresentStudentsDispatch: func.isRequired,
  getDegreesAndProgrammesDispatch: func.isRequired,
}

StudyProgramme.defaultProps = {
  match: {
    params: { studyProgrammeId: undefined },
  },
  programmes: {},
}

const mapStateToProps = ({
  populationDegreesAndProgrammes,
  auth: {
    token: { rights, roles },
  },
}) => {
  const programmes = populationDegreesAndProgrammes.data ? populationDegreesAndProgrammes.data.programmes : {}
  return {
    programmes,
    rights,
    userRoles: getUserRoles(roles),
    isAdmin: getUserIsAdmin(roles),
  }
}

export default connect(
  mapStateToProps,
  {
    getThroughputDispatch: getThroughput,
    getProductivityDispatch: getProductivity,
    getPresentStudentsDispatch: getPresentStudents,
    clearPresentStudentsDispatch: clearPresentStudents,
    getDegreesAndProgrammesDispatch: getDegreesAndProgrammes,
  },
  null,
  {
    areStatePropsEqual: isEqual,
  }
)(withRouter(StudyProgramme))
