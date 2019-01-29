import React, { Component } from 'react'
import { withRouter } from 'react-router-dom'
import { shape, string } from 'prop-types'
import { Header, Message, Segment, Tab } from 'semantic-ui-react'
import sharedStyles from '../../styles/shared'
import StudyProgrammeMandatoryCourses from './StudyProgrammeMandatoryCourses'
import StudyProgrammeCourseCodeMapper from './StudyProgrammeCourseCodeMapper'
import StudyProgrammeSelector from './StudyProgrammeSelector'

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

  getPanes() {
    const { match } = this.props
    const { studyProgrammeId } = match.params
    return ([
      {
        menuItem: 'Mandatory Courses',
        render: () => <StudyProgrammeMandatoryCourses studyProgramme={studyProgrammeId} />
      },
      { menuItem: 'Code Mapper', render: () => <StudyProgrammeCourseCodeMapper /> },
      { menuItem: 'Course Groups', render: () => <Header>Nothing here yet</Header> }
    ])
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

  select = (e, { activeIndex }) => {
    this.setState({ selected: activeIndex })
  }

  render() {
    const { selected } = this.state
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
              <Tab panes={panes} activeIndex={selected} onTabChange={this.select} />
            ) : null
          }
        </Segment>
      </div>
    )
  }
}

export default withRouter(StudyProgramme)
