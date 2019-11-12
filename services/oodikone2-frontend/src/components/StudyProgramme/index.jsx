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
import AggregateView from '../CourseGroups/AggregateView'
import ThesisCourses from './ThesisCourses'
import PresentStudents from './PresentStudents'
import '../PopulationQueryCard/populationQueryCard.css'
import { getTextIn, useTabs, getUserRoles, getUserIsAdmin, useTitle, isNewHYStudyProgramme } from '../../common'
import TSA from '../../common/tsa'
import Tags from './Tags'

import { getThroughput } from '../../redux/throughput'
import { getProductivity } from '../../redux/productivity'
import { getPresentStudents } from '../../redux/presentStudents'
import { callApi } from '../../apiConnection'

const StudyProgramme = props => {
  const [tab, setTab] = useTabs('p_tab', props.match.params.courseGroupId ? 2 : 0, props.history)
  useTitle('Study programmes')
  const SHOW_PRESENT_STUDENTS_TAB_FEATURE_TOGGLE = props.userRoles && props.userRoles.includes('dev')

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
    const { match, rights, userRoles } = props
    const { studyProgrammeId, courseGroupId } = match.params
    const panes = []
    panes.push(
      {
        menuItem: 'Overview',
        render: () => <Overview studyprogramme={studyProgrammeId} history={props.history} />
      },
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
    if (SHOW_PRESENT_STUDENTS_TAB_FEATURE_TOGGLE && !isNewHYStudyProgramme(studyProgrammeId)) {
      panes.push({
        menuItem: 'Present students',
        render: () => <React.Fragment>{SHOW_PRESENT_STUDENTS_TAB_FEATURE_TOGGLE && <PresentStudents />}</React.Fragment>
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
    if (SHOW_PRESENT_STUDENTS_TAB_FEATURE_TOGGLE && !isNewHYStudyProgramme(studyProgrammeId)) {
      props.getPresentStudentsDispatch(studyProgrammeId)
    }
  }, [studyProgrammeId])

  useEffect(() => {
    if (!programmeName) {
      return
    }

    TSA.sendEvent({
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
  getPresentStudentsDispatch: func.isRequired
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
  return {
    programmes,
    language: getActiveLanguage(localize).code,
    rights,
    userRoles: getUserRoles(roles),
    isAdmin: getUserIsAdmin(roles)
  }
}

export default connect(
  mapStateToProps,
  {
    getThroughputDispatch: getThroughput,
    getProductivityDispatch: getProductivity,
    getPresentStudentsDispatch: getPresentStudents
  },
  null,
  {
    areStatePropsEqual: isEqual
  }
)(withRouter(StudyProgramme))
