import React, { useCallback, useEffect } from 'react'
import { withRouter, Link } from 'react-router-dom'
import { connect } from 'react-redux'
import { getActiveLanguage } from 'react-localize-redux'
import { shape, string, arrayOf, func, bool } from 'prop-types'
import { Header, Segment, Tab, Card, Icon, Button } from 'semantic-ui-react'
import { isEqual } from 'lodash'
import StudyProgrammeMandatoryCourses from './StudyProgrammeMandatoryCourses'
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
import { callApi } from '../../apiConnection'

const StudyProgramme = props => {
  const [tab, setTab] = useTabs('p_tab', props.match.params.courseGroupId ? 2 : 0, props.history)
  useTitle('Study programmes')

  useEffect(() => {}, [])

  const refreshProductivity = () => {
    callApi('/v2/studyprogrammes/productivity/recalculate', 'get', null, {
      code: props.match.params.studyProgrammeId
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
      code: props.match.params.studyProgrammeId
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
    const { match, rights, userRoles, studytracks } = props
    const { studyProgrammeId, courseGroupId } = match.params
    const filteredStudytracks = studytracks
      ? Object.keys(studytracks).reduce((acc, curr) => {
          if (Object.keys(studytracks[curr].programmes).includes(studyProgrammeId)) acc.push(studytracks[curr])
          return acc
        }, [])
      : []
    const panes = []
    panes.push({
      menuItem: 'Overview',
      render: () => <Overview studyprogramme={studyProgrammeId} history={props.history} />
    })
    if (filteredStudytracks.length > 0) {
      panes.push({
        menuItem: 'Studytrack overview',
        render: () => <StudyTrackOverview studyprogramme={studyProgrammeId} history={props.history} />
      })
    }
    panes.push(
      {
        menuItem: 'Mandatory Courses',
        render: () => <StudyProgrammeMandatoryCourses studyProgramme={studyProgrammeId} />
      },
      { menuItem: 'Code Mapper', render: () => <CourseCodeMapper studyprogramme={studyProgrammeId} /> }
    )

    if ((userRoles.includes('coursegroups') && rights.includes(studyProgrammeId)) || userRoles.includes('admin')) {
      panes.push({
        menuItem: 'Course Groups',
        render: () => <AggregateView programmeId={studyProgrammeId} courseGroupId={courseGroupId} />
      })
    }
    panes.push({
      menuItem: 'Thesis Courses',
      render: () => <ThesisCourses studyprogramme={studyProgrammeId} />
    })
    panes.push({
      menuItem: 'Tags',
      render: () => <Tags studyprogramme={studyProgrammeId} />
    })
    if (!isNewHYStudyProgramme(studyProgrammeId)) {
      panes.push({
        menuItem: 'Present students',
        render: () => <PresentStudents />
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
        )
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

  const { match, programmes, language } = props
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
      value: 1
    })
  }, [programmeName])

  return (
    <div className="segmentContainer">
      <Header className="segmentTitle" size="large">
        Study Programme
      </Header>
      <Segment className="contentSegment">
        <StudyProgrammeSelector handleSelect={handleSelect} selected={studyProgrammeId !== undefined} />
        {studyProgrammeId ? (
          <React.Fragment>
            <Card fluid className="cardContainer">
              <Card.Content>
                <Card.Header className="cardHeader">
                  {programmeName}
                  <Link to="/study-programme" className="controlIconLink">
                    <Icon name="remove" className="controlIcon" />
                  </Link>
                </Card.Header>
                <Card.Meta content={studyProgrammeId} />
              </Card.Content>
            </Card>
            <Tab panes={panes} activeIndex={tab} onTabChange={setTab} />
          </React.Fragment>
        ) : null}
      </Segment>
    </div>
  )
}

StudyProgramme.propTypes = {
  match: shape({
    params: shape({
      studyProgrammeId: string,
      courseGroupId: string
    })
  }),
  programmes: shape({}),
  language: string.isRequired,
  history: shape({}).isRequired,
  rights: arrayOf(string).isRequired,
  userRoles: arrayOf(string).isRequired,
  getProductivityDispatch: func.isRequired,
  getThroughputDispatch: func.isRequired,
  isAdmin: bool.isRequired,
  getPresentStudentsDispatch: func.isRequired,
  clearPresentStudentsDispatch: func.isRequired,
  studytracks: shape({}).isRequired
}

StudyProgramme.defaultProps = {
  match: {
    params: { studyProgrammeId: undefined }
  },
  programmes: {}
}

const mapStateToProps = ({
  populationDegreesAndProgrammes,
  localize,
  auth: {
    token: { rights, roles }
  }
}) => {
  const programmes = populationDegreesAndProgrammes.data ? populationDegreesAndProgrammes.data.programmes : {}
  const studytracks = populationDegreesAndProgrammes.data.studyTracks
    ? populationDegreesAndProgrammes.data.studyTracks
    : {}
  return {
    programmes,
    language: getActiveLanguage(localize).code,
    rights,
    userRoles: getUserRoles(roles),
    isAdmin: getUserIsAdmin(roles),
    studytracks
  }
}

export default connect(
  mapStateToProps,
  {
    getThroughputDispatch: getThroughput,
    getProductivityDispatch: getProductivity,
    getPresentStudentsDispatch: getPresentStudents,
    clearPresentStudentsDispatch: clearPresentStudents
  },
  null,
  {
    areStatePropsEqual: isEqual
  }
)(withRouter(StudyProgramme))
