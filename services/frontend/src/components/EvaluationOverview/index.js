import React from 'react'
import { Redirect, withRouter } from 'react-router-dom'
import { Segment } from 'semantic-ui-react'

import FacultyView from './FacultyView'
import ProgrammeView from './ProgrammeView'

const EvaluationOverview = props => {
  const { id, level } = props.match.params

  if (!(level === 'programme' || level === 'faculty') || !id) {
    return <Redirect to="/" />
  }

  return (
    <div className="segmentContainer">
      <Segment className="contentSegment">
        {level === 'programme' ? <ProgrammeView studyprogramme={id} /> : <FacultyView faculty={id} />}
      </Segment>
    </div>
  )
}

export default withRouter(EvaluationOverview)
