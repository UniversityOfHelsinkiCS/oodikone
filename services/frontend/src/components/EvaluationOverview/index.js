import React from 'react'
import { Redirect, withRouter } from 'react-router-dom'
import { Header, Segment } from 'semantic-ui-react'

import FacultyView from './FacultyView'
import ProgrammeView from './ProgrammeView'

const EvaluationOverview = props => {
  const { id, level } = props.match.params

  if (!(level === 'programme' || level === 'faculty')) {
    return <Redirect to="/" />
  }

  return (
    <div className="segmentContainer">
      <Segment className="contentSegment">
        <div align="center" style={{ padding: '30px' }}>
          <Header textAlign="center">{id}</Header>
          {/* <span>
            {programmeLetterId ? `${programmeLetterId} - ` : ''} {studyProgrammeId}
          </span> */}
        </div>
        {level === 'programme' ? <ProgrammeView studyprogramme={id} /> : <FacultyView faculty={id} />}
      </Segment>
    </div>
  )
}

export default withRouter(EvaluationOverview)
