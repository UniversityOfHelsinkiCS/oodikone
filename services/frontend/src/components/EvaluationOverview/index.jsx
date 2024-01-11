import React from 'react'
import { Redirect, useParams } from 'react-router-dom'
import { Segment } from 'semantic-ui-react'

import { FacultyView } from './FacultyView'
import { ProgrammeView } from './ProgrammeView'
import { UniversityView } from './UniversityView'

export const EvaluationOverview = () => {
  const { id, level } = useParams()

  if (!(level === 'programme' || level === 'faculty' || level === 'university') || (level !== 'university' && !id)) {
    return <Redirect to="/" />
  }

  const levelToComponent = {
    programme: <ProgrammeView studyprogramme={id} />,
    faculty: <FacultyView faculty={id} />,
    university: <UniversityView />,
  }

  return (
    <div className="segmentContainer">
      <Segment className="contentSegment">{levelToComponent[level]}</Segment>
    </div>
  )
}
