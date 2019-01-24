import React from 'react'
import { Header, Segment } from 'semantic-ui-react'
import { shape, string } from 'prop-types'

import AggregateView from './AggregateView'
import CourseGroup from './CourseGroup'
import CourseGroupAddTeacher from './CourseGroupAddTeacher'
import sharedStyles from '../../styles/shared'


const CourseGroups = ({ match }) => {
  const { params: { courseGroupId, action } } = match

  let view = null
  if (courseGroupId) {
    if (action === 'edit') {
      view = <CourseGroupAddTeacher groupId={courseGroupId} />
    } else {
      view = <CourseGroup groupId={courseGroupId} />
    }
  } else {
    view = <AggregateView />
  }

  return (
    <div className={sharedStyles.segmentContainer}>
      <Header className={sharedStyles.segmentTitle} size="large" content="Course groups" />
      <Segment className={sharedStyles.contentSegment}>
        {view}
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
