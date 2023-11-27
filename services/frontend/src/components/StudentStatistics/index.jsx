import React from 'react'
import { Segment, Header } from 'semantic-ui-react'
import { useParams } from 'react-router-dom'

import { useTitle } from 'common/hooks'
import { ConnectedStudentSearch as StudentSearch } from './StudentSearch'
import { ConnectedStudentDetails as StudentDetails } from './StudentDetails'
import { StudentNameVisibilityToggle } from '../StudentNameVisibilityToggle'

export const StudentStatistics = () => {
  const { studentNumber } = useParams()
  useTitle('Student statistics')

  return (
    <div className="segmentContainer">
      <Header className="segmentTitle" size="large">
        Student statistics
      </Header>
      <StudentNameVisibilityToggle />
      <Segment className="contentSegment">
        <StudentSearch studentNumber={studentNumber} />
        <StudentDetails studentNumber={studentNumber} />
      </Segment>
    </div>
  )
}
