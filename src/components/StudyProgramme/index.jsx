import React, { Component } from 'react'
import { withRouter } from 'react-router-dom'
import { shape, string } from 'prop-types'
import { Header, Message, Segment, Tab, Card, Icon } from 'semantic-ui-react'
import sharedStyles from '../../styles/shared'
import StudyProgrammeMandatoryCourses from './StudyProgrammeMandatoryCourses'
// import StudyProgrammeCourseCodeMapper from './StudyProgrammeCourseCodeMapper'
import StudyProgrammeSelector from './StudyProgrammeSelector'
import AggregateView from '../CourseGroups/AggregateView'
import styles from '../PopulationQueryCard/populationQueryCard.css'

class StudyProgramme extends Component {
  static propTypes = {
    match: shape({
      params: shape({
        studyProgrammeId: string,
        courseGroupId: string
      })
    }),
    history: shape({}).isRequired
  }

  static defaultProps = {
    match: {
      params: { studyProgrammeId: undefined }
    }
  }

  state = {
    selected: this.props.match.params.courseGroupId ? 2 : 0
  }

  getPanes() {
    const { match } = this.props
    const { studyProgrammeId, courseGroupId } = match.params
    return ([
      {
        menuItem: 'Mandatory Courses',
        render: () => <StudyProgrammeMandatoryCourses studyProgramme={studyProgrammeId} />
      },
      // { menuItem: 'Code Mapper', render: () => <StudyProgrammeCourseCodeMapper /> },
      {
        menuItem: 'Course Groups',
        render: () => <AggregateView programmeId={studyProgrammeId} courseGroupId={courseGroupId} />
      }
    ])
  }

  handleSelect = (target) => {
    this.setState({ studyProgrammeName: target[0] })
    this.props.history.push(`/study-programme/${target[1]}`, { selected: target[1] })
  }

  select = (e, { activeIndex }) => {
    this.setState({ selected: activeIndex })
  }

  render() {
    const { selected, studyProgrammeName } = this.state
    const { match } = this.props
    const { studyProgrammeId } = match.params
    const panes = this.getPanes()
    return (
      <div className={sharedStyles.segmentContainer}>
        <Header className={sharedStyles.segmentTitle} size="large">
          Study Programme Settings
        </Header>
        <Message content="Visible only for admins for now" />
        <Segment className={sharedStyles.contentSegment}>
          <StudyProgrammeSelector handleSelect={this.handleSelect} selected={studyProgrammeId !== undefined} />
          {
            studyProgrammeId ? (
              <React.Fragment>
                <Card fluid className={styles.cardContainer}>
                  <Card.Content>
                    <Card.Header className={styles.cardHeader}>
                      {studyProgrammeName}
                      <Icon
                        name="remove"
                        className={styles.controlIcon}
                        onClick={() => this.props.history.goBack()}
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

export default withRouter(StudyProgramme)
