import React from 'react'
import { connect } from 'react-redux'
import { withRouter } from 'react-router-dom'
import { Segment, Header } from 'semantic-ui-react'
import { useTitle } from '../../common/hooks'

const FacultyStatistics = () => {
  useTitle('Faculties')

  return (
    <div className="segmentContainer">
      <Header className="segmentTitle" size="large">
        Faculty statistics
      </Header>
      <Segment className="contentSegment">Tosi hienot faculty statsit tähän</Segment>
    </div>
  )
}

export default connect()(withRouter(FacultyStatistics))
