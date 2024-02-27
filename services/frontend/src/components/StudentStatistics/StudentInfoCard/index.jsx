import React, { useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { Card, Icon, Button } from 'semantic-ui-react'

import { callApi } from '@/apiConnection'
import { reformatDate } from '@/common'
import { SisuLinkItem } from '@/components/common/SisuLinkItem'
import { DISPLAY_DATE_FORMAT, DISPLAY_DATE_FORMAT_DEV } from '@/constants'
import { useGetAuthorizedUserQuery } from '@/redux/auth'
import { removeStudentSelection, resetStudent } from '@/redux/students'
import { EnrollmentAccordion } from './EnrollmentAccordion'

import './studentInfoCard.css'

export const StudentInfoCard = ({ student }) => {
  const dispatch = useDispatch()
  const { namesVisible: showName } = useSelector(state => state.settings)
  const { isAdmin } = useGetAuthorizedUserQuery()
  const name = showName ? `${student.name}, ` : ''
  const email = showName && student.email ? `${student.email}` : ''

  const formattedTimestamp = reformatDate(student.updatedAt, isAdmin ? DISPLAY_DATE_FORMAT_DEV : DISPLAY_DATE_FORMAT)

  const updateStudent = async () => {
    await callApi('/updater/update/v2/customlist/students', 'post', [student.studentNumber])
  }

  useEffect(() => {
    return () => {
      dispatch(resetStudent())
      dispatch(removeStudentSelection())
    }
  }, [])

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
            <Button compact size="medium" labelPosition="left" onClick={updateStudent}>
              <Icon name="refresh" />
              Update student
            </Button>
          )}
        </div>
      </Card.Content>
    </Card>
  )
}
