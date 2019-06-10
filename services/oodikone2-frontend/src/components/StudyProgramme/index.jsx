import React, { Component } from 'react'
import { withRouter } from 'react-router-dom'
import { connect } from 'react-redux'
import { shape, string } from 'prop-types'
import { Header, Segment, Tab, Card, Icon } from 'semantic-ui-react'
import StudyProgrammeMandatoryCourses from './StudyProgrammeMandatoryCourses'
import CourseCodeMapper from '../CourseCodeMapper'
import StudyProgrammeSelector from './StudyProgrammeSelector'
import Overview from './Overview'
import AggregateView from '../CourseGroups/AggregateView'
import ThesisCourses from './ThesisCourses'
import '../PopulationQueryCard/populationQueryCard.css'
import { getRolesWithoutRefreshToken, getRightsWithoutRefreshToken, getTextIn } from '../../common'
import Tags from './Tags'

class StudyProgramme extends Component {
  static propTypes = {
    match: shape({
      params: shape({
        studyProgrammeId: string,
        courseGroupId: string
      })
    }),
    programmes: shape({}),
    language: string.isRequired,
    history: shape({}).isRequired
  }

  static defaultProps = {
    match: {
      params: { studyProgrammeId: undefined }
    },
    programmes: {}
  }

  state = {
    selected: this.props.match.params.courseGroupId ? 2 : 0
  }

  getPanes() {
    const { match } = this.props
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
      { menuItem: 'Code Mapper', render: () => <CourseCodeMapper studyprogramme={studyProgrammeId} /> },
    )
    if ((getRolesWithoutRefreshToken().includes('coursegroups') &&
      getRightsWithoutRefreshToken().includes(studyProgrammeId)) ||
      getRolesWithoutRefreshToken().includes('admin')) {
      panes.push({
        menuItem: 'Course Groups',
        render: () => <AggregateView programmeId={studyProgrammeId} courseGroupId={courseGroupId} />
      })
    }
    panes.push({
      menuItem: 'Thesis Courses',
      render: () => <ThesisCourses studyprogramme={studyProgrammeId} />
    })
    if (getRolesWithoutRefreshToken().includes('admin')) {
      panes.push({
        menuItem: 'Tags',
        render: () => <Tags />
      })
    }
    return panes
  }

  handleSelect = (programme) => {
    this.props.history.push(`/study-programme/${programme}`, { selected: programme })
  }

  select = (e, { activeIndex }) => {
    this.setState({ selected: activeIndex })
  }

  render() {
    const { selected } = this.state
    const { match, programmes, language } = this.props
    const { studyProgrammeId } = match.params
    const programmeName = programmes[studyProgrammeId] && getTextIn(programmes[studyProgrammeId].name, language)
    const panes = this.getPanes()
    return (
      <div className="segmentContainer">
        <Header className="segmentTitle" size="large">
          Study Programme
        </Header>
        <Segment className="contentSegment">
          <StudyProgrammeSelector handleSelect={this.handleSelect} selected={studyProgrammeId !== undefined} />
          {
            studyProgrammeId ? (
              <React.Fragment>
                <Card fluid className="cardContainer">
                  <Card.Content>
                    <Card.Header className="cardHeader">
                      {programmeName}
                      <Icon
                        name="remove"
                        className="controlIcon"
                        onClick={() => this.props.history.push('/study-programme')}
                      />
                    </Card.Header>
                    <Card.Meta content={studyProgrammeId} />
                  </Card.Content>
                </Card>
                <Tab panes={panes} activeIndex={selected} onTabChange={this.select} />
              </React.Fragment>
            ) : null
          }
        </Segment>
      </div>
    )
  }
}

const mapStateToProps = ({ populationDegreesAndProgrammes, settings }) => {
  const programmes = populationDegreesAndProgrammes.data ?
    populationDegreesAndProgrammes.data.programmes : {}
  return { programmes, language: settings.language }
}

export default connect(mapStateToProps)(withRouter(StudyProgramme))
