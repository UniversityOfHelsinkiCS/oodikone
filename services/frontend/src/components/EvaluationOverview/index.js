import React from 'react'
import { Redirect, useParams } from 'react-router-dom'
import { Segment } from 'semantic-ui-react'

import { FacultyView } from './FacultyView'
import { ProgrammeView } from './ProgrammeView'

export const EvaluationOverview = () => {
  const { id, level } = useParams()

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
