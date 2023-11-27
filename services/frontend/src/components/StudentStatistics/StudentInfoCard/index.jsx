import React from 'react'
import { Card, Icon, Button } from 'semantic-ui-react'
import { useSelector, useDispatch } from 'react-redux'
import { useHistory } from 'react-router-dom'

import { useGetAuthorizedUserQuery } from 'redux/auth'
import { SisuLinkItem } from 'components/common/SisuLinkItem'
import { reformatDate } from 'common'
import { DISPLAY_DATE_FORMAT, DISPLAY_DATE_FORMAT_DEV } from '../../../constants'
import './studentInfoCard.css'
import { removeStudentSelection, resetStudent } from '../../../redux/students'
import { callApi } from '../../../apiConnection'
import { EnrollmentAccordion } from './EnrollmentAccordion'

export const StudentInfoCard = ({ student }) => {
  const dispatch = useDispatch()
  const history = useHistory()
  const { namesVisible: showName } = useSelector(state => state.settings)
  const { updating } = useSelector(state => state.populations)
  const { isAdmin } = useGetAuthorizedUserQuery()
  const name = showName ? `${student.name}, ` : ''
  const email = showName && student.email ? `${student.email}` : ''
  const onRemove = () => {
    history.push('/students')
    dispatch(resetStudent())
    dispatch(removeStudentSelection())
  }

  const formattedTimestamp = reformatDate(student.updatedAt, isAdmin ? DISPLAY_DATE_FORMAT_DEV : DISPLAY_DATE_FORMAT)

  const updateStudent = async () => {
    await callApi('/updater/update/v2/students', 'post', [student.studentNumber])
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
          <Icon name="remove" className="controlIcon" onClick={onRemove} />
        </Card.Header>
        <Card.Meta>
          <div className="startDate">{email}</div>
        </Card.Meta>
        <Card.Description>{`Credits: ${student.credits || 0}`}</Card.Description>
        <div style={{ paddingTop: '4px' }}>
          <EnrollmentAccordion semesterEnrollments={student.semesterenrollments} />
          <p style={{ fontSize: 14 }}>{`Updated at ${formattedTimestamp}`}</p>
          <Button disabled={updating} compact size="medium" labelPosition="left" onClick={updateStudent}>
            <Icon loading={updating} name="refresh" />
            update student
          </Button>
        </div>
      </Card.Content>
    </Card>
  )
}
