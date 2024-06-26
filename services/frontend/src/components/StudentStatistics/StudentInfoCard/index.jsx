import { Button, Card, Icon } from 'semantic-ui-react'

import { callApi } from '@/apiConnection'
import { SisuLinkItem } from '@/components/common/SisuLinkItem'
import { useStudentNameVisibility } from '@/components/StudentNameVisibilityToggle'
import { DISPLAY_DATE_FORMAT, DISPLAY_DATE_FORMAT_DEV } from '@/constants/date'
import { useGetAuthorizedUserQuery } from '@/redux/auth'
import { reformatDate } from '@/util/timeAndDate'
import { EnrollmentAccordion } from './EnrollmentAccordion'
import './studentInfoCard.css'

export const StudentInfoCard = ({ student }) => {
  const { visible: showName } = useStudentNameVisibility()
  const { isAdmin } = useGetAuthorizedUserQuery()
  const name = showName ? `${student.name}, ` : ''
  const email = showName && student.email ? `${student.email}` : ''

  const formattedTimestamp = reformatDate(student.updatedAt, isAdmin ? DISPLAY_DATE_FORMAT_DEV : DISPLAY_DATE_FORMAT)

  const updateStudent = async () => {
    await callApi('/updater/update/v2/customlist/students', 'post', [student.studentNumber])
  }

  return (
    <Card fluid>
      <Card.Content>
        <Card.Header className="cardHeader">
          <div>
            {name}
            {student.studentNumber}
            <SisuLinkItem id={student.sis_person_id} />
          </div>
        </Card.Header>
        <Card.Meta>
          <div className="startDate">{email}</div>
        </Card.Meta>
        <Card.Description>{`Credits: ${student.credits || 0}`}</Card.Description>
        <div style={{ paddingTop: '4px' }}>
          <EnrollmentAccordion student={student} />
          <p>{`Updated at ${formattedTimestamp}`}</p>
          {isAdmin && (
            <Button compact labelPosition="left" onClick={updateStudent} size="medium">
              <Icon name="refresh" />
              Update student
            </Button>
          )}
        </div>
      </Card.Content>
    </Card>
  )
}
