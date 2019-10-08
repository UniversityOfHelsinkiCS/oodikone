import React, { useCallback } from 'react'
import { withRouter } from 'react-router-dom'
import { connect } from 'react-redux'
import { getActiveLanguage } from 'react-localize-redux'
import { shape, string, arrayOf } from 'prop-types'
import { Header, Segment, Tab, Card, Icon } from 'semantic-ui-react'
import StudyProgrammeMandatoryCourses from './StudyProgrammeMandatoryCourses'
import CourseCodeMapper from '../CourseCodeMapper'
import StudyProgrammeSelector from './StudyProgrammeSelector'
import Overview from './Overview'
import AggregateView from '../CourseGroups/AggregateView'
import ThesisCourses from './ThesisCourses'
import '../PopulationQueryCard/populationQueryCard.css'
import { getTextIn, useTabs, getUserRoles } from '../../common'
import Tags from './Tags'

const StudyProgramme = props => {
  const [tab, setTab] = useTabs('p_tab', props.match.params.courseGroupId ? 2 : 0, props.history)
  const getPanes = () => {
    const { match, rights, userRoles } = props
    const { studyProgrammeId, courseGroupId } = match.params
    const panes = []
    panes.push(
      {
        menuItem: 'Overview',
        render: () => <Overview studyprogramme={studyProgrammeId} />
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
                  <Icon name="remove" className="controlIcon" onClick={() => props.history.push('/study-programme')} />
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
  userRoles: arrayOf(string).isRequired
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
  return { programmes, language: getActiveLanguage(localize).code, rights, userRoles: getUserRoles(roles) }
}

export default connect(mapStateToProps)(withRouter(StudyProgramme))
