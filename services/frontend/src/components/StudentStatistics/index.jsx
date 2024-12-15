import { useParams } from 'react-router'
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
      <div style={{ width: '75%', minWidth: '800px', maxWidth: '1200px' }}>
        <Segment className="contentSegment">
          {studentNumber ? <StudentDetails studentNumber={studentNumber} /> : <StudentSearch />}
        </Segment>
      </div>
    </div>
  )
}
