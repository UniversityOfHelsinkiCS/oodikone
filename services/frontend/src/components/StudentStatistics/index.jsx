import React from 'react'
import { useParams } from 'react-router-dom'
import { Header, Segment } from 'semantic-ui-react'

import { useTitle } from '@/common/hooks'
import { StudentNameVisibilityToggle } from '@/components/StudentNameVisibilityToggle'
import { StudentDetails } from './StudentDetails'
import { StudentSearch } from './StudentSearch'

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
          {studentNumber ? <StudentDetails studentNumber={studentNumber} /> : <StudentSearch />}
        </Segment>
      </div>
    </div>
  )
}
