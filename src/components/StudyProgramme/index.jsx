import React from 'react'
import { withRouter } from 'react-router-dom'
import { Header, Message, Segment } from 'semantic-ui-react'
import sharedStyles from '../../styles/shared'
import StudyProgrammeTable from '../StudyProgrammeTable'
import StudyProgrammeMandatoryCourses from '../StudyProgrammeMandatoryCourses'
import StudyProgrammeCourseCodeMapper from '../StudyProgrammeCourseCodeMapper'

const StudyProgramme = () => {
  console.log('Oodikone study programme insane experiment started')
  return (
    <div className={sharedStyles.segmentContainer}>
      <Header className={sharedStyles.segmentTitle} size="large">
        Study Programme Statistics / Settings?
      </Header>
      <Message content="Visible only for admins for now" />
      <Segment className={sharedStyles.contentSegment}>
        {/*
          Here there should be component of choosing your own study programme,
            which takes you to /:studyprogrammeid
           (maybe if there is only one redirect directly there)
        */}
        <StudyProgrammeTable />
        {/*
          Then there should be a component of assigning mandatory courses to the study programme selected
        */}
        <StudyProgrammeMandatoryCourses />
        {/*
        Then there should be a component of assigning a PREFIX and course code mappings
        */}
        <StudyProgrammeCourseCodeMapper />
      </Segment>
    </div>
  )
}

export default withRouter(StudyProgramme)
