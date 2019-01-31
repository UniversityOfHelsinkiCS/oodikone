import React from 'react'
import { Header, Segment } from 'semantic-ui-react'
import { shape, string } from 'prop-types'

import CourseGroup from './CourseGroup'
import sharedStyles from '../../styles/shared'

const CourseGroups = ({ match }) => {
  const { params: { courseGroupId, studyProgrammeId } } = match
  return (
    <div className={sharedStyles.segmentContainer}>
      <Header className={sharedStyles.segmentTitle} size="large" content="Course groups" />
      <Segment className={sharedStyles.contentSegment}>
        <CourseGroup groupId={courseGroupId} studyProgrammeId={studyProgrammeId} />
      </Segment>
    </div>
  )
}

CourseGroups.propTypes = {
  match: shape({
    params: shape({
      courseGroupId: string,
      edit: string
    }).isRequired
  }).isRequired
}

export default CourseGroups
