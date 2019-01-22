import React, { Component } from 'react'
import { withRouter } from 'react-router-dom'
import { shape, string } from 'prop-types'
import { Header, Message, Segment, Button } from 'semantic-ui-react'
import sharedStyles from '../../styles/shared'
import StudyProgrammeMandatoryCourses from '../StudyProgrammeMandatoryCourses'
import StudyProgrammeCourseCodeMapper from '../StudyProgrammeCourseCodeMapper'
import StudyProgrammeSelector from '../StudyProgrammeSelector'

class StudyProgramme extends Component {
  static propTypes = {
    match: shape({
      params: shape({
        studyProgrammeId: string
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
    selected: 0
  }

  getComponent = () => {
    const { match } = this.props
    const { studyProgrammeId } = match.params
    if (this.state.selected === 0) {
      return <StudyProgrammeMandatoryCourses studyProgramme={studyProgrammeId} />
    } else if (this.state.selected === 1) {
      return <StudyProgrammeCourseCodeMapper />
    } else if (this.state.selected === 2) {
      return <Header>Nothing here yet</Header>
    }
    return []
  }

  handleSelect = (target) => {
    this.props.history.push(`/study-programme/${target[1]}`, { selected: target[1] })
  }

  select = (int) => {
    this.setState({ selected: int })
  }

  render() {
    const { match } = this.props
    const { studyProgrammeId } = match.params
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
                <Button.Group>
                  <Button onClick={() => this.select(0)}>Mandatory Courses</Button>
                  <Button onClick={() => this.select(1)}>Course Code Mapping</Button>
                  <Button onClick={() => this.select(2)}>Course Groups</Button>
                </Button.Group>
                <Segment className={sharedStyles.contentSegment}>
                  {this.getComponent()}
                </Segment>
              </React.Fragment>) : null
          }
        </Segment>
      </div>
    )
  }
}

export default withRouter(StudyProgramme)
