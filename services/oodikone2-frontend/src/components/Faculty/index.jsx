import React from 'react'
import { withRouter } from 'react-router-dom'
import { Header, Segment } from 'semantic-ui-react'
import FacultySelector from './FacultySelector'

const Faculty = () => (
  <div className="segmentContainer">
    <Header className="segmentTitle" size="large">
      Faculties
    </Header>
    <Segment className="contentSegment" >
      <FacultySelector />
    </Segment>
  </div>
)

export default withRouter(Faculty)
