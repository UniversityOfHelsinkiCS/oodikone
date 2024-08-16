import { Redirect, useParams } from 'react-router-dom'
import { Segment } from 'semantic-ui-react'

import { useTitle } from '@/common/hooks'
import { FacultyView } from './FacultyView'
import { ProgrammeView } from './ProgrammeView'
import { UniversityView } from './UniversityView'

export const EvaluationOverview = () => {
  const { id, level } = useParams()
  useTitle('Evaluation overview')

  if (!['programme', 'faculty', 'university'].includes(level) || (level !== 'university' && !id)) {
    return <Redirect to="/" />
  }

  const levelToComponent = {
    programme: <ProgrammeView studyprogramme={id} />,
    faculty: <FacultyView faculty={id} />,
    university: <UniversityView isEvaluationOverview />,
  }

  return (
    <div className="segmentContainer">
      <Segment className="contentSegment">{levelToComponent[level]}</Segment>
    </div>
  )
}
