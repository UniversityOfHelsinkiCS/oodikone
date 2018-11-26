import React from 'react'
import { Header, Segment } from 'semantic-ui-react'
import AggregateView from './AggregateView'
import CourseGroup from './CourseGroup'
import sharedStyles from '../../styles/shared'


const CourseGroups = () => (
  <div className={sharedStyles.segmentContainer}>
    <Header className={sharedStyles.segmentTitle} size="large" content="Course groups" />
    <Segment className={sharedStyles.contentSegment}>
      <CourseGroup />
      <AggregateView />
    </Segment>
  </div>
)

export default CourseGroups
