import React from 'react'
import { useParams } from 'react-router-dom'
import { Segment, Header } from 'semantic-ui-react'

import { useTitle } from '@/common/hooks'
import { StudentNameVisibilityToggle } from '../StudentNameVisibilityToggle'
import { ConnectedStudentDetails as StudentDetails } from './StudentDetails'
import { ConnectedStudentSearch as StudentSearch } from './StudentSearch'

export const StudentStatistics = () => {
  const { studentNumber } = useParams()
  useTitle('Student statistics')

  return (
    <div className="segmentContainer">
      <Header className="segmentTitle" size="large">
        Student statistics
      </Header>
      <StudentNameVisibilityToggle />
      <div style={{ alignContent: 'center', margin: 'auto' }}>
        <Segment className="contentSegment">
          <StudentSearch studentNumber={studentNumber} />
          <StudentDetails studentNumber={studentNumber} />
        </Segment>
      </div>
    </div>
  )
}
