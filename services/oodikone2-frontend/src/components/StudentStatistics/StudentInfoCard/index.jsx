import React from 'react'
import { func, bool, shape } from 'prop-types'
import { Card, Icon, Button } from 'semantic-ui-react'
import { connect } from 'react-redux'
import { withRouter } from 'react-router-dom'
import { reformatDate } from '../../../common'
import { studentDetailsType } from '../../../constants/types'
import { DISPLAY_DATE_FORMAT, DISPLAY_DATE_FORMAT_DEV } from '../../../constants'
import './studentInfoCard.css'
import { removeStudentSelection, resetStudent } from '../../../redux/students'
import { updatePopulationStudents } from '../../../redux/populations'
import { useSisFeatureToggle } from '../../../common/hooks'
import { callApi } from '../../../apiConnection'

const StudentInfoCard = props => {
  const { student, showName, updating } = props
  const name = showName ? `${student.name}, ` : ''
  const email = showName && student.email ? `${student.email}` : ''
  const onRemove = () => {
    props.history.push('/students')
    props.resetStudent()
    props.removeStudentSelection()
  }

  const sisActive = useSisFeatureToggle()

  const formattedTimestamp = reformatDate(
    student.updatedAt,
    props.has_dev_role ? DISPLAY_DATE_FORMAT_DEV : DISPLAY_DATE_FORMAT
  )

  const updateStudent = async () => {
    if (sisActive) {
      await callApi('/updater/update/v2/students', 'post', [student.studentNumber])
    } else {
      await props.updatePopulationStudents([student.studentNumber])
    }
  }

  return (
    <Card fluid>
      <Card.Content>
        <Card.Header className="cardHeader">
          <div>
            {name}
            {student.studentNumber}
          </div>
          <Icon name="remove" className="controlIcon" onClick={onRemove} />
        </Card.Header>
        <Card.Meta>
          <div className="startDate">{`Started: ${reformatDate(student.started, DISPLAY_DATE_FORMAT)}`}</div>
          <div className="startDate">{email}</div>
        </Card.Meta>
        <Card.Description>
          {`Credits: ${student.credits || 0}`}
          <p style={{ fontSize: 14 }}>{`Updated at ${formattedTimestamp}`}</p>
        </Card.Description>
        <div style={{ paddingTop: '4px' }}>
          <Button disabled={updating} compact size="medium" labelPosition="left" onClick={updateStudent}>
            <Icon loading={updating} name="refresh" />
            update student
          </Button>
        </div>
      </Card.Content>
    </Card>
  )
}

StudentInfoCard.propTypes = {
  student: studentDetailsType.isRequired,
  showName: bool.isRequired,
  removeStudentSelection: func.isRequired,
  resetStudent: func.isRequired,
  history: shape({}).isRequired,
  updating: bool.isRequired,
  updatePopulationStudents: func.isRequired,
  has_dev_role: bool.isRequired
}

const mapStateToProps = state => ({
  showName: state.settings.namesVisible,
  updating: state.populations.updating,
  has_dev_role: state.auth.token.roles.find(r => r.group_code === 'dev') !== undefined
})

export default withRouter(
  connect(mapStateToProps, {
    removeStudentSelection,
    resetStudent,
    updatePopulationStudents
  })(StudentInfoCard)
)
