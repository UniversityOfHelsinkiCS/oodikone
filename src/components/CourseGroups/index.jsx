import React from 'react'
import { Header, Segment } from 'semantic-ui-react'
import { shape, string } from 'prop-types'

import AggregateView from './AggregateView'
import CourseGroup from './CourseGroup'
import sharedStyles from '../../styles/shared'


const CourseGroups = ({ match }) => {
  const { params: { courseGroupId } } = match

  return (
    <div className={sharedStyles.segmentContainer}>
      <Header className={sharedStyles.segmentTitle} size="large" content="Course groups" />
      <Segment className={sharedStyles.contentSegment}>
        { courseGroupId
            ? <CourseGroup groupId={courseGroupId} />
            : <AggregateView />
        }
      </Segment>
    </div>
  )
}

CourseGroups.propTypes = {
  match: shape({
    params: shape({
      courseGroupId: string
    }).isRequired
  }).isRequired
}

export default CourseGroups
